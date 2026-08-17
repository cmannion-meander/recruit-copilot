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

from organizations.models import Organization
from people.models import Person


def set_org_context(organization):
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_org', %s, true)", [str(organization.id)])


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
