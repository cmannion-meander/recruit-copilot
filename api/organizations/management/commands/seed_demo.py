"""Seed a demo dataset through the real command surface — every invariant a live
request enforces is what built this data too, with one deliberate exception: one
candidacy's auto_close_at is set directly at INSERT time, close to now. The ADR 0012
trigger only ever fires on UPDATE, so a chosen value at creation is legitimate; it is
the only way to show the "closing soon" flag without nine weeks actually passing.

Run once against a freshly migrated database:

    uv run manage.py seed_demo

Prints the demo login when it finishes. Refuses to run twice — for a clean re-seed,
./db/setup-local.sh --reset first.
"""

from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone

from candidacies.models import Candidacy
from candidacies.services import (
    advance_stage,
    create_candidacy,
    reject_candidacy,
    send_stage_message,
)
from channels.models import Channel
from clients.models import Client
from crosscheck.models import CrosscheckSignal
from findings.models import Finding
from findings.services import Passage, record_finding
from organizations.models import Organization, User
from people.models import Person
from placements.services import create_placement
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
from submissions.services import create_submission

DEMO_ORG_NAME = "Halloway & Finch"
DEMO_USERNAME = "ruth"
DEMO_PASSWORD = "recruit-copilot-demo"


def _set_org_context(organization_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_org', %s, true)", [str(organization_id)])


class Command(BaseCommand):
    help = "Seed a demo organization with enough flagged records to light up the Desk."

    def handle(self, *args, **options):
        if Organization.objects.filter(name=DEMO_ORG_NAME).exists():
            raise CommandError(
                f"An organization named {DEMO_ORG_NAME!r} already exists. "
                "Run ./db/setup-local.sh --reset for a clean database, then seed again."
            )

        with transaction.atomic():
            org = Organization.objects.create(
                name=DEMO_ORG_NAME, wordmark="H&F", place="Manchester"
            )
            _set_org_context(org.id)
            with connection.cursor() as cursor:
                cursor.execute("SET CONSTRAINTS person_provenance DEFERRED")

            user = User.objects.create(
                username=DEMO_USERNAME,
                password=make_password(DEMO_PASSWORD),
                organization=org,
                first_name="Ruth",
                last_name="Halloway",
                title="Founder",
            )

            bramhall = Client.objects.create(
                organization=org,
                name="Bramhall Precision Group",
                description="Precision engineering, Stockport.",
            )
            calder_vale = Client.objects.create(
                organization=org,
                name="Calder Vale Foods",
                description="Contract food manufacturing, Leeds.",
            )

            linkedin = Channel.objects.create(
                organization=org, name="LinkedIn search", kind=Channel.Kind.OUTBOUND
            )
            referral = Channel.objects.create(
                organization=org, name="Referral", kind=Channel.Kind.REFERRAL
            )
            Channel.objects.create(
                organization=org, name="Inbound application", kind=Channel.Kind.INBOUND
            )

            def person_with_sighting(name, employer, url, note):
                person = Person.objects.create(
                    organization=org, full_name=name, current_employer=employer
                )
                Sighting.objects.create(
                    organization=org,
                    person=person,
                    source_url=url,
                    source_name=url.split("/")[2],
                    source_kind="company_page",
                    retrieved_at=timezone.now(),
                    snapshot_excerpt=note,
                    resolving=True,
                )
                return person

            def build_role(client, title, *, criteria_text, stages):
                role = Role.objects.create(organization=org, client=client, title=title)
                brief = Brief.objects.create(organization=org, role=role)
                version = BriefVersion.objects.create(
                    organization=org, brief=brief, version=1, created_by=user
                )
                criteria = [
                    Criterion.objects.create(
                        organization=org, brief_version=version, position=i + 1, text=text
                    )
                    for i, text in enumerate(criteria_text)
                ]
                for position, (label, criterion_indices) in enumerate(stages, start=1):
                    stage = BriefStage.objects.create(
                        organization=org,
                        brief_version=version,
                        position=position,
                        label=label,
                        owner=BriefStage.Owner.RECRUITER,
                        candidate_message=(
                            f"You reached {label.lower()}. If nothing has been decided "
                            "within ninety days this closes on its own and you will be "
                            "told that it has closed."
                        ),
                    )
                    for idx in criterion_indices:
                        BriefStageCriterion.objects.create(
                            organization=org,
                            brief_version=version,
                            brief_stage=stage,
                            criterion=criteria[idx],
                        )
                return role

            # -----------------------------------------------------------------
            # Role 1: Financial Controller @ Bramhall — open, two stages
            # -----------------------------------------------------------------
            role1 = build_role(
                bramhall,
                "Financial Controller",
                criteria_text=[
                    "Led an ERP migration, not only participated in one",
                    "Has managed a team of three or more",
                    "Built a rolling forecast from site-level data",
                ],
                stages=[("Screening call", [0, 1]), ("Competency call", [2])],
            )
            role1.open()
            criteria1 = list(role1.pinned_brief_version.criteria.order_by("position"))
            # The competency call's own criterion (criteria1[2]) is deliberately never
            # recorded for anyone — it stays open at that stage for Person C, below.
            stage1_screening, _stage1_competency = list(
                role1.pinned_brief_version.stages.order_by("position")
            )

            # Person A — clean, both screening criteria evidenced, ready to advance.
            person_a = person_with_sighting(
                "Aileen Marchetti",
                "Stelmark Engineering",
                "https://stelmarkengineering.example/people",
                "Aileen led the Sage-to-Dynamics migration across two sites and built "
                "the rolling forecast the board now uses monthly.",
            )
            cnd_a = create_candidacy(role1, person_a, linkedin, actor=user)
            sighting_a = person_a.sightings.first()
            for criterion in criteria1[:2]:
                record_finding(
                    cnd_a,
                    stage=stage1_screening,
                    criterion=criterion,
                    status=Finding.Status.EVIDENCED,
                    passage=Passage(
                        char_start=0,
                        char_end=len(sighting_a.snapshot_excerpt),
                        sighting=sighting_a,
                    ),
                    actor=user,
                )

            # Person B — scorecard incomplete: one of two screening criteria has no entry.
            person_b = person_with_sighting(
                "Ivan Petrescu",
                "Northgate Dynamics",
                "https://northgatedynamics.example/team",
                "Ivan sits on the steering group for the group's Dynamics rollout.",
            )
            cnd_b = create_candidacy(role1, person_b, referral, actor=user)
            record_finding(
                cnd_b,
                stage=stage1_screening,
                criterion=criteria1[0],
                status=Finding.Status.NOT_FOUND,
                actor=user,
            )

            # Person C — advanced to the competency call; that stage's own criterion is
            # still open, which is a different flavour of the same flag.
            person_c = person_with_sighting(
                "Frances Ibbotson",
                "Delamere Manufacturing",
                "https://delameremanufacturing.example/leadership",
                "Frances chairs the finance steering group and has managed a team of "
                "four since 2023.",
            )
            cnd_c = create_candidacy(role1, person_c, linkedin, actor=user)
            sighting_c = person_c.sightings.first()
            for criterion in criteria1[:2]:
                record_finding(
                    cnd_c,
                    stage=stage1_screening,
                    criterion=criterion,
                    status=Finding.Status.EVIDENCED,
                    passage=Passage(
                        char_start=0,
                        char_end=len(sighting_c.snapshot_excerpt),
                        sighting=sighting_c,
                    ),
                    actor=user,
                )
            send_stage_message(cnd_c, stage1_screening, actor=user)
            advance_stage(cnd_c, actor=user)

            # Person D — rejected. Closed, no flag.
            person_d = person_with_sighting(
                "Bethan Lloyd-Price",
                "Kestrel Components",
                "https://kestrelcomponents.example/people",
                "Bethan has been in a group financial controller role since 2021.",
            )
            cnd_d = create_candidacy(role1, person_d, referral, actor=user)
            reject_candidacy(
                cnd_d,
                reason_code="below_criteria",
                reason_text="No evidence of leading a system migration end to end.",
                actor=user,
            )

            # Person E — closing soon. A direct INSERT, not an UPDATE, so ADR 0012's
            # trigger never sees it — the only way to show this flag without nine
            # weeks actually passing.
            person_e = person_with_sighting(
                "Priya Nandakumar",
                "Kestrel Components",
                "https://kestrelcomponents.example/leadership",
                "Priya was Group Financial Controller as of the last conference listing.",
            )
            Candidacy.objects.create(
                organization=org,
                role=role1,
                person=person_e,
                brief_version=role1.pinned_brief_version,
                channel=linkedin,
                brief_stage=stage1_screening,
                auto_close_at=timezone.now() + timedelta(days=3),
            )

            # Sourcing: a search, and two sightings never resolved into a person.
            scope1 = SourcingScope.objects.create(
                organization=org,
                brief_version=role1.pinned_brief_version,
                revision=1,
                created_by=user,
                geography="North West England",
                markets=["precision engineering"],
            )
            search1 = Search.objects.create(
                organization=org,
                role=role1,
                brief_version=role1.pinned_brief_version,
                sourcing_scope=scope1,
                ran_by=user,
                coverage_note="June run, widened to composites and food manufacturing.",
            )
            for name, url in [
                ("Rhodri Vaughan", "https://compositesnw.example/team"),
                ("Nia Ashworth", "https://compositesnw.example/leadership"),
            ]:
                Sighting.objects.create(
                    organization=org,
                    person=None,
                    search=search1,
                    source_url=url,
                    source_name=url.split("/")[2],
                    source_kind="company_page",
                    retrieved_at=timezone.now(),
                    snapshot_excerpt=f"{name}, listed on the leadership page.",
                    resolving=True,
                )

            # -----------------------------------------------------------------
            # Role 2: Finance Business Partner @ Calder Vale Foods — open, one stage
            # -----------------------------------------------------------------
            role2 = build_role(
                calder_vale,
                "Finance Business Partner",
                criteria_text=[
                    "Owns the monthly close process end to end",
                    "Has presented to a board or an investment committee",
                    "Built a rolling forecast from site-level data",
                ],
                stages=[("Screening call", [0, 1, 2])],
            )
            role2.open()
            criteria2 = list(role2.pinned_brief_version.criteria.order_by("position"))
            stage2 = role2.pinned_brief_version.stages.get()

            # Person F — fully evidenced and submitted.
            person_f = person_with_sighting(
                "George Amankwah",
                "Calder Vale Foods",
                "https://caldervalefoods.example/finance-team",
                "George owns the monthly close, presented the Q2 numbers to the "
                "investment committee, and builds the weekly site-level forecast.",
            )
            cnd_f = create_candidacy(role2, person_f, referral, actor=user)
            sighting_f = person_f.sightings.first()
            for criterion in criteria2:
                record_finding(
                    cnd_f,
                    stage=stage2,
                    criterion=criterion,
                    status=Finding.Status.EVIDENCED,
                    passage=Passage(
                        char_start=0,
                        char_end=len(sighting_f.snapshot_excerpt),
                        sighting=sighting_f,
                    ),
                    actor=user,
                )
            send_stage_message(cnd_f, stage2, actor=user)
            submission = create_submission(cnd_f, actor=user)

            # Person G — fully evidenced, but one unresolved signal blocks submission
            # until a recruiter resolves or overrides it live.
            person_g = person_with_sighting(
                "Stefan Bak",
                "Calder Vale Foods",
                "https://caldervalefoods.example/site-leads",
                "Stefan owns the monthly close for the Leeds site, presented to the "
                "board in March, and runs the site-level forecast.",
            )
            cnd_g = create_candidacy(role2, person_g, linkedin, actor=user)
            sighting_g = person_g.sightings.first()
            for criterion in criteria2:
                record_finding(
                    cnd_g,
                    stage=stage2,
                    criterion=criterion,
                    status=Finding.Status.EVIDENCED,
                    passage=Passage(
                        char_start=0,
                        char_end=len(sighting_g.snapshot_excerpt),
                        sighting=sighting_g,
                    ),
                    actor=user,
                )
            CrosscheckSignal.objects.create(
                candidacy=cnd_g,
                type=CrosscheckSignal.Type.DUPLICATE_CANDIDACY,
                detail=(
                    "A very similarly named candidate exists elsewhere in the org's "
                    "records. Needs a human check before this goes out."
                ),
                artifact={
                    "kind": "record",
                    "label": "Possible duplicate",
                    "detail": "Name and employer are a close match to another record.",
                    "candidacy_id": None,
                },
            )

            # -----------------------------------------------------------------
            # Role 3: Management Accountant @ Calder Vale Foods — draft, can't open
            # -----------------------------------------------------------------
            build_role(
                calder_vale,
                "Management Accountant",
                criteria_text=[
                    "Owns the monthly close process end to end",
                    "Has managed a team of three or more",
                ],
                stages=[("Screening call", [0, 1])],
            )
            # Left in draft — two criteria, three required. The Desk names it.

            # -----------------------------------------------------------------
            # Placement: Person F, backdated so day 7 and day 30 are overdue.
            # -----------------------------------------------------------------
            create_placement(
                cnd_f,
                started_on=timezone.now().date() - timedelta(days=95),
                probation_ends_on=timezone.now().date() - timedelta(days=5),
                actor=user,
            )

        self.stdout.write(self.style.SUCCESS("Seeded."))
        self.stdout.write(f"  username: {DEMO_USERNAME}")
        self.stdout.write(f"  password: {DEMO_PASSWORD}")
        self.stdout.write(f"Candidate view token: {submission.candidate_link_id}")
