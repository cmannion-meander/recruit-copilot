"""Fixtures for the contract.

Fixtures appear here as the slice that makes them satisfiable lands — a fixture for a model
that does not exist yet would only turn an honest failure into a confusing one.

Writing tenant rows from the test runner needs the org context set on the runner's own
connection: rcp_owner is subject to the policies too (FORCE ROW LEVEL SECURITY), which is
the entire point of forcing them. `set_config(..., true)` is SET LOCAL in function form and
scopes the value to the test transaction.
"""

import pytest
from django.db import connection

from clients.models import Client
from organizations.models import Organization, User
from people.models import Person
from roles.models import Brief, BriefStage, BriefStageCriterion, BriefVersion, Criterion, Role

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
    return Organization.objects.create(name="Halloway & Finch")


@pytest.fixture
def two_orgs_with_data(db):
    orgs = []
    for name in ("Halloway & Finch", "Marsh & Whitlow"):
        org = Organization.objects.create(name=name)
        set_org_context(org)
        Person.objects.create(
            organization=org,
            full_name=f"Person at {name}",
            current_employer=name,
        )
        orgs.append(org)
    return tuple(orgs)


@pytest.fixture
def person(organization):
    set_org_context(organization)
    return Person.objects.create(
        organization=organization,
        full_name="Priya Nandakumar",
        current_employer="Kestrel Components",
    )


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
