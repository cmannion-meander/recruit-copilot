#!/usr/bin/env bash
#
# Local database setup — no Docker required.
#
# Assumes Postgres 16 is installed and running, and that you can connect as a superuser
# (Postgres.app on macOS, the EDB installer on Windows, or `apt install postgresql-16`).
#
#   ./db/setup-local.sh                 # create everything
#   ./db/setup-local.sh --reset         # drop and recreate (destroys local data)
#
# Requires RCP_LOCAL_PASSWORD, from .env or the environment. Idempotent apart from --reset.

set -euo pipefail

# Read .env so the quickstart stays one command. Parsed, not sourced: `source` runs the file,
# so one stray word in a config file becomes a command, and a malformed .env kills the script
# with an error pointing at bash rather than at the line. Only KEY=VALUE is recognised;
# anything else is skipped. Values already in the environment win, which is what you want
# when overriding one setting for a single run.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$REPO_ROOT/.env" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val%\"}"; val="${val#\"}"
      val="${val%\'}"; val="${val#\'}"
      if [[ -z "${!key:-}" ]]; then
        printf -v "$key" '%s' "$val"
        export "${key?}"
      fi
    fi
  done < "$REPO_ROOT/.env"
fi

SUPERUSER="${PGSUPERUSER:-postgres}"
DBNAME="${PGDATABASE:-recruitcopilot}"

# No default, deliberately. A fallback here is a password literal in a public repo, and every
# checkout would share it — including any run pointed at something other than a local
# Postgres, which would create both roles with a known password and say nothing. There is no
# value this could default to that is safe to publish, so it is required. See CLAUDE.md.
if [[ -z "${RCP_LOCAL_PASSWORD:-}" ]]; then
  echo "RCP_LOCAL_PASSWORD is not set, so the two roles have no password to take." >&2
  echo "Generate one into .env, then re-run:" >&2
  echo >&2
  echo "  echo \"RCP_LOCAL_PASSWORD=\$(openssl rand -hex 16)\" >> .env" >&2
  echo >&2
  echo "Update DATABASE_URL and MIGRATION_DATABASE_URL in .env to match." >&2
  exit 1
fi

# Interpolated into CREATE ROLE below, where a single quote would end the literal early and
# turn the rest into SQL. Rejected rather than escaped: this is a generated local password,
# and no correct value contains one.
if [[ "$RCP_LOCAL_PASSWORD" == *"'"* ]]; then
  echo "RCP_LOCAL_PASSWORD contains a single quote, which cannot be used here." >&2
  exit 1
fi

APP_PASSWORD="$RCP_LOCAL_PASSWORD"

psql_super() { psql -U "$SUPERUSER" -d postgres -v ON_ERROR_STOP=1 "$@"; }

if [[ "${1:-}" == "--reset" ]]; then
  echo "Dropping $DBNAME ..."
  psql_super -c "DROP DATABASE IF EXISTS $DBNAME;"
  psql_super -c "DROP ROLE IF EXISTS rcp_app;"
  psql_super -c "DROP ROLE IF EXISTS rcp_login;"
  psql_super -c "DROP ROLE IF EXISTS rcp_owner;"
fi

echo "Creating roles ..."
psql_super <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rcp_owner') THEN
    CREATE ROLE rcp_owner WITH LOGIN PASSWORD '$APP_PASSWORD'
      NOSUPERUSER CREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rcp_app') THEN
    CREATE ROLE rcp_app WITH LOGIN PASSWORD '$APP_PASSWORD'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  -- The one role that can cross RLS, and it cannot log in. It exists to own SECURITY
  -- DEFINER lookup functions (the login crossing, ADR 0014) — never to run a query of
  -- its own. rcp_owner is made a member below so migrations can hand functions to it;
  -- membership does not confer BYPASSRLS, because role attributes are not inherited.
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rcp_login') THEN
    CREATE ROLE rcp_login WITH NOLOGIN
      NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
  END IF;
END
\$\$;
GRANT rcp_login TO rcp_owner;
SQL

echo "Creating database ..."
psql_super -c "SELECT 1 FROM pg_database WHERE datname = '$DBNAME'" | grep -q 1 \
  || psql_super -c "CREATE DATABASE $DBNAME OWNER rcp_owner;"

echo "Granting ..."
psql -U "$SUPERUSER" -d "$DBNAME" -v ON_ERROR_STOP=1 <<SQL
ALTER SCHEMA public OWNER TO rcp_owner;
GRANT CONNECT ON DATABASE $DBNAME TO rcp_app;
GRANT USAGE ON SCHEMA public TO rcp_app;

-- Tables created later by migrations (run as rcp_owner) are granted automatically.
-- Without this, every migration needs a manual GRANT and one will eventually be missed.
ALTER DEFAULT PRIVILEGES FOR ROLE rcp_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rcp_app;
ALTER DEFAULT PRIVILEGES FOR ROLE rcp_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO rcp_app;
SQL

echo
echo "Done. Verify the app role cannot bypass RLS:"
echo "  psql -U rcp_app -d $DBNAME -c \"SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;\""
echo "Both columns must read f. If either reads t, the isolation tests prove nothing."
