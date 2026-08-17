"""Row-level security, as a migration operation.

Every tenant-scoped table gets the same policy: rows are visible and writable only when
`organization_id` matches `app.current_org`, the GUC the request middleware sets inside the
request transaction. `FORCE` matters — without it the table owner (rcp_owner, which runs
migrations and the test runner) silently bypasses the policy and every isolation test
proves nothing. An unset GUC compares as NULL and fails closed.

A table that carries `organization_id` and skips this call is caught by
`test_every_tenant_table_has_rls_enabled_and_forced`.
"""

from django.db import migrations

_FORWARD = """\
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table} FORCE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON {table}
    USING (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
"""

_REVERSE = """\
DROP POLICY IF EXISTS org_isolation ON {table};
ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;
ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;
"""


def enable_rls(table: str) -> migrations.RunSQL:
    return migrations.RunSQL(_FORWARD.format(table=table), _REVERSE.format(table=table))
