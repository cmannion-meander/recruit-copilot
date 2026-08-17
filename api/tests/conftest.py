"""Fixtures for the contract.

Fixtures appear here as the slice that makes them satisfiable lands — a fixture for a model
that does not exist yet would only turn an honest failure into a confusing one.

Writing tenant rows from the test runner needs the org context set on the runner's own
connection: rcp_owner is subject to the policies too (FORCE ROW LEVEL SECURITY), which is
the entire point of forcing them. `set_config(..., true)` is SET LOCAL in function form and
scopes the value to the test transaction. Person creation additionally defers the
provenance trigger, the same way the real creation path does — the sighting arrives in the
same transaction, and the check runs at commit.
"""

import pytest
from django.db import connection
from django.utils import timezone

from clients.models import Client
from organizations.models import Organization, User
from people.models import Person
from roles.models import (
    Brief,
    BriefStage,
    BriefStageCriterion,
    BriefVersion,
    Criterion,
    Role,
    SourcingScope,
)
from searches.models import Search
from sightings.models import Sighting

CRITERIA = [
    "Led an ERP migration, not only participated in one",
    "Has managed a team of three or more",
    "Built a rolling forecast from site-level data",
]

STAGE_MESSAGE = (
    "You reached the screening call. The next step is a thirty-minute call, and if "
    "nothing has been decided within ninety days this closes on its own and you will "
    "be told that it has closed."
)


def set_org_context(organization):
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_org', %s, true)", [str(organization.id)])


def create_person(organization, full_name, *, employer=""):
    """A person the way the product makes one: with a resolving sighting behind them."""
    set_org_context(organization)
    with connection.cursor() as cursor:
        cursor.execute("SET CONSTRAINTS person_provenance DEFERRED")
    person = Person.objects.create(
        organization=organization, full_name=full_name, current_employer=employer
    )
    Sighting.objects.create(
        organization=organization,
        person=person,
        source_url="https://kestrelcomponents.example/leadership",
        source_name="kestrelcomponents.example",
        source_kind="company_page",
        retrieved_at=timezone.now(),
        snapshot_excerpt=f"{full_name} — as the page read on the day",
        resolving=True,
    )
    return person


def build_role(organization, *, n_criteria, assigned=None, title="Management Accountant"):
    """A draft role with a one-version Brief. `assigned` is how many of its criteria are
    assigned to the single screening stage; None builds no stages at all."""
    set_org_context(organization)
    user = User.objects.create(
        username=f"ruth-{str(organization.id)[:8]}-{title[:3].lower()}", organization=organization
    )
    client = Client.objects.create(organization=organization, name="Calder Vale Foods")
    role = Role.objects.create(organization=organization, client=client, title=title)
    brief = Brief.objects.create(organization=organization, role=role)
    version = BriefVersion.objects.create(
        organization=organization, brief=brief, version=1, created_by=user
    )
    criteria = [
        Criterion.objects.create(
            organization=organization, brief_version=version, position=i + 1, text=text
        )
        for i, text in enumerate(CRITERIA[:n_criteria])
    ]
    if assigned is not None:
        stage = BriefStage.objects.create(
            organization=organization,
            brief_version=version,
            position=1,
            label="Screening call",
            owner=BriefStage.Owner.RECRUITER,
            candidate_message=STAGE_MESSAGE,
        )
        for criterion in criteria[:assigned]:
            BriefStageCriterion.objects.create(
                organization=organization,
                brief_version=version,
                brief_stage=stage,
                criterion=criterion,
            )
    return role


@pytest.fixture
def organization(db):
    org = Organization.objects.create(name="Halloway & Finch")
    set_org_context(org)
    return org


@pytest.fixture
def two_orgs_with_data(db):
    orgs = []
    for name in ("Halloway & Finch", "Marsh & Whitlow"):
        org = Organization.objects.create(name=name)
        create_person(org, f"Person at {name}", employer=name)
        orgs.append(org)
    return tuple(orgs)


@pytest.fixture
def person(organization):
    return create_person(organization, "Priya Nandakumar", employer="Kestrel Components")


@pytest.fixture
def role_with_two_criteria(organization):
    return build_role(organization, n_criteria=2)


@pytest.fixture
def role_with_unassigned_criterion(organization):
    return build_role(organization, n_criteria=3, assigned=2)


@pytest.fixture
def role_ready_to_open(organization):
    return build_role(organization, n_criteria=3, assigned=3)


@pytest.fixture
def draft_role(organization):
    return build_role(organization, n_criteria=3, assigned=3, title="Financial Controller")


@pytest.fixture
def search(organization):
    role = build_role(organization, n_criteria=3, assigned=3, title="Group Accountant")
    role.open()
    user = role.brief.versions.first().created_by
    scope = SourcingScope.objects.create(
        organization=organization,
        brief_version=role.pinned_brief_version,
        revision=1,
        created_by=user,
        geography="North West England",
        markets=["precision engineering"],
    )
    return Search.objects.create(
        organization=organization,
        role=role,
        brief_version=role.pinned_brief_version,
        sourcing_scope=scope,
        ran_by=user,
        coverage_note="March run, scope revision 1.",
    )
