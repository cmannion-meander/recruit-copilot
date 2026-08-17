"""
The contract.

These tests encode the ten invariants in docs/invariants.md plus the tenancy guarantee
beneath them. They are expected to FAIL until the corresponding slice lands — that is their
job. They define what "done" means.

Rules for this file:

  * Never weaken, skip, or xfail a test here to make a feature land. If a feature conflicts
    with an invariant, the feature is wrong.
  * Tests may be added. Assertions may not be relaxed.

A note on the database connection, because it is the subtle part:

Django's test runner connects as `rcp_owner` — the role in MIGRATION_DATABASE_URL — because
creating the test database needs CREATEDB. But `rcp_owner` OWNS the tables, and table owners
bypass RLS unless FORCE ROW LEVEL SECURITY is set. So the isolation tests below open their
own raw connection as `rcp_app` — the role the running application actually uses. Testing
isolation over the owner connection would pass while proving nothing.
"""

import os
import re

import psycopg
import pytest
from django.db import connection

APP_DSN = os.environ["APP_DATABASE_URL"]  # rcp_app — see .env.example

FORBIDDEN_COLUMN = re.compile(
    r"(score|rank|rating|confidence|percentile|weight|match_pct)", re.IGNORECASE
)

KEY_SHAPED_COLUMN = re.compile(
    r"(api_key|secret|token|credential|private_key|password)", re.IGNORECASE
)


# --------------------------------------------------------------------------------------
# Tenancy — the invariant beneath the invariants
# --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_app_role_is_not_privileged():
    """rcp_app must not be able to bypass RLS by attribute."""
    with psycopg.connect(APP_DSN) as conn:
        row = conn.execute(
            "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user"
        ).fetchone()
    assert row == (False, False), "the application role can bypass RLS"


@pytest.mark.django_db
def test_every_tenant_table_has_rls_enabled_and_forced():
    """RLS enabled is not enough — the owner bypasses it unless it is also forced."""
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
              AND EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = c.relname AND column_name = 'organization_id'
              )
            """
        )
        offenders = [name for name, enabled, forced in cur.fetchall() if not (enabled and forced)]
    assert not offenders, f"RLS not enabled and forced on: {offenders}"


@pytest.mark.django_db
def test_cross_tenant_read_returns_nothing(two_orgs_with_data):
    """The promise we cannot be caught wrong on."""
    org_a, org_b = two_orgs_with_data
    with psycopg.connect(APP_DSN) as conn, conn.transaction():
        # set_config(..., true) is SET LOCAL in function form — a utility statement
        # cannot take a bind parameter, so the function form is the parameterisable one.
        conn.execute("SELECT set_config('app.current_org', %s, true)", (str(org_a.id),))
        rows = conn.execute(
            "SELECT id FROM person WHERE organization_id = %s", (org_b.id,)
        ).fetchall()
    assert rows == [], "cross-tenant read returned rows"


@pytest.mark.django_db
def test_missing_org_context_returns_nothing(two_orgs_with_data):
    """No org context set must fail closed, not open."""
    with psycopg.connect(APP_DSN) as conn:
        rows = conn.execute("SELECT id FROM person").fetchall()
    assert rows == [], "queries without org context are not failing closed"


@pytest.mark.django_db
def test_org_context_does_not_leak_across_transactions(two_orgs_with_data):
    """SET LOCAL is transaction-scoped. Verify pooling cannot carry it over."""
    org_a, _ = two_orgs_with_data
    with psycopg.connect(APP_DSN) as conn:
        with conn.transaction():
            conn.execute("SELECT set_config('app.current_org', %s, true)", (str(org_a.id),))
        leaked = conn.execute("SELECT current_setting('app.current_org', true)").fetchone()[0]
    assert not leaked, "org context leaked out of its transaction"


@pytest.mark.django_db(transaction=True)
def test_same_org_read_returns_rows():
    """
    The positive control. The isolation tests above assert emptiness, which an empty table
    satisfies vacuously — this one proves the policy admits the org's own rows, so the
    emptiness elsewhere means isolation rather than absence.
    """
    from django.db import transaction

    from organizations.models import Organization
    from people.models import Person

    org = Organization.objects.create(name="Positive Control")
    with transaction.atomic():
        with connection.cursor() as cur:
            cur.execute("SELECT set_config('app.current_org', %s, true)", [str(org.id)])
        Person.objects.create(organization=org, full_name="Visible Row")

    with psycopg.connect(APP_DSN) as conn, conn.transaction():
        conn.execute("SELECT set_config('app.current_org', %s, true)", (str(org.id),))
        rows = conn.execute("SELECT full_name FROM person").fetchall()
    assert rows == [("Visible Row",)], "the org's own rows are not visible under its context"


# --------------------------------------------------------------------------------------
# Invariant 2 — no composite score, ever
# --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_no_scoring_column_exists_anywhere():
    """
    The strongest form of this conviction: the column does not exist, so no future session
    can ship one by accident. This test is the reason it holds at commit 800.
    """
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            """
        )
        offenders = [f"{t}.{c}" for t, c in cur.fetchall() if FORBIDDEN_COLUMN.search(c)]
    assert not offenders, f"scoring-shaped columns found: {offenders}"


@pytest.mark.django_db
def test_finding_status_has_exactly_two_values():
    from findings.models import Finding

    assert {c[0] for c in Finding.Status.choices} == {"evidenced", "not_found"}


# --------------------------------------------------------------------------------------
# Invariants 1, 3, 4, 5 — the workflow gates
# --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_role_cannot_open_with_fewer_than_three_criteria(role_with_two_criteria):
    from roles.exceptions import BriefIncomplete

    with pytest.raises(BriefIncomplete):
        role_with_two_criteria.open()


@pytest.mark.django_db
def test_candidacy_cannot_attach_to_unopened_role(draft_role, person):
    from candidacies.models import Candidacy
    from django.db.utils import IntegrityError

    with pytest.raises(IntegrityError):
        Candidacy.objects.create(role=draft_role, person=person)


@pytest.mark.django_db
def test_search_cannot_attach_to_unopened_role(draft_role):
    """
    The gate covers sourcing, not just intake. Searching against a role with no rubric is
    the case the gate exists for — you cannot look for someone before agreeing what counts.
    """
    from django.db.utils import IntegrityError
    from searches.models import Search

    with pytest.raises(IntegrityError):
        Search.objects.create(role=draft_role)


@pytest.mark.django_db
def test_search_and_review_pin_a_brief_version(search, review):
    """
    A brief that changed mid-search is the normal case, not the exception. Both records
    must render as they were when made, which is impossible without the pin.
    """
    assert search.brief_version_id is not None, "search did not pin a brief version"
    assert review.brief_version_id is not None, "review did not pin a brief version"


@pytest.mark.django_db
def test_cannot_advance_with_incomplete_scorecard(review_missing_two_findings):
    from reviews.exceptions import IncompleteScorecard

    with pytest.raises(IncompleteScorecard):
        review_missing_two_findings.advance()


@pytest.mark.django_db
def test_rejection_requires_reason_code_and_text(candidacy):
    from decisions.models import Decision
    from django.db.utils import IntegrityError

    with pytest.raises(IntegrityError):
        Decision.objects.create(candidacy=candidacy, kind="reject", reason_text="")


@pytest.mark.django_db
def test_evidenced_finding_requires_evidence(review, criterion):
    from django.db.utils import IntegrityError
    from findings.models import Finding

    with pytest.raises(IntegrityError):
        Finding.objects.create(
            review=review, criterion=criterion, status="evidenced", evidence=None
        )


@pytest.mark.django_db
def test_submission_blocked_while_crosscheck_signal_unresolved(candidacy_with_open_signal):
    from submissions.exceptions import UnresolvedCrosscheck
    from submissions.services import create_submission

    with pytest.raises(UnresolvedCrosscheck):
        create_submission(candidacy_with_open_signal)


# --------------------------------------------------------------------------------------
# Invariants 6, 7, 8 — closure, notice, immutability
# --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_every_candidacy_has_an_auto_close_deadline(candidacy):
    assert candidacy.auto_close_at is not None


@pytest.mark.django_db
def test_ai_use_notice_cannot_be_disabled(organization):
    assert not hasattr(organization, "ai_notice_enabled"), (
        "a switch exists to suppress the AI-use notice"
    )


# --------------------------------------------------------------------------------------
# Invariant 9 — provenance, no person without a source
# --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_person_cannot_exist_without_a_resolving_sighting(organization):
    """
    A sourced person is asserted into existence by a recruiter rather than arriving with an
    application behind them. Without a resolving source the record is a claim nobody can
    check, which is the failure this product exists to make impossible.
    """
    from django.db.utils import IntegrityError

    from people.models import Person

    with pytest.raises(IntegrityError):
        Person.objects.create(organization=organization, full_name="No Source")


@pytest.mark.django_db
def test_sighting_requires_a_source_and_a_retrieval_time(person):
    """A sighting without `retrieved_at` cannot be told apart from a dead link later."""
    from django.db.utils import IntegrityError
    from sightings.models import Sighting

    with pytest.raises(IntegrityError):
        Sighting.objects.create(person=person, source_url="", retrieved_at=None)


@pytest.mark.django_db
def test_evidence_points_at_a_document_or_a_sighting(review, criterion):
    """Never at nothing. A finding beside no quoted passage is the thing we do not ship."""
    from django.db.utils import IntegrityError
    from evidence.models import Evidence

    with pytest.raises(IntegrityError):
        Evidence.objects.create(review=review, criterion=criterion, document=None, sighting=None)


# --------------------------------------------------------------------------------------
# Invariant 10 — customer API keys never touch Postgres
# --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_no_customer_key_material_column_exists():
    """
    Under BYOK the key lives in Key Vault and Postgres holds only a reference. Same argument
    as the score column: if the column cannot exist, no later session can quietly fill it.
    Columns ending `_ref` are the permitted shape — they hold a pointer, not a secret.
    """
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            """
        )
        offenders = [
            f"{t}.{c}"
            for t, c in cur.fetchall()
            if KEY_SHAPED_COLUMN.search(c) and not c.endswith("_ref")
        ]
    assert not offenders, f"key-shaped columns found: {offenders}"


@pytest.mark.parametrize("table", ["evidence", "decision_event", "submission_record"])
@pytest.mark.django_db
def test_append_only_tables_reject_update_and_delete(table):
    """Refusal 07 as a permission grant, not a UI convention."""
    with psycopg.connect(APP_DSN) as conn:
        for privilege in ("UPDATE", "DELETE"):
            granted = conn.execute(
                "SELECT has_table_privilege(current_user, %s, %s)", (table, privilege)
            ).fetchone()[0]
            assert not granted, f"{table} is {privilege}-able by the application role"
