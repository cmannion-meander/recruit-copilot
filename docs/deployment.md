# Deployment — App Service

Reference for slice 4, when Pre-flight goes public. Not needed before then.

## Provisioning vs deploying

Two separate things, and they can be mixed:

- **Provisioning** creates the Azure resources. VS Code's Azure extension can do this through
  its create-Web-App wizard, or `azd provision` can from a template.
- **Deploying** pushes code onto them. VS Code right-click → Deploy to Web App, or GitHub
  Actions, or `azd deploy`.

Creating resources through the VS Code wizard is click-ops: nothing records what was made or
why. That is an acceptable Phase 0 trade if the resource set is small and written down in an
ADR. It stops being acceptable once there is a second environment to keep in sync.

## When to graduate off right-click deploy

Right-click deploy pushes **your local working directory** — including uncommitted changes,
whatever branch you happen to be on, with no test gate and no record of what shipped.

Fine for: the first deploy, the landing page, anything with no customer data behind it.

Move to GitHub Actions before the first paying design partner. `azd pipeline config` wires it
with OIDC federated credentials, so no long-lived Azure secret sits in the repo — which
matters more than usual for a repo you screen-share.

## Monorepo deploys

The extension deploys the folder you right-click, so `api/` and `web/` go to separate Web
Apps. Set `appService.deploySubpath` in `.vscode/settings.json` so it stops asking.

## Django on App Service — the things that break

**Startup command.** Set it explicitly in Configuration → General settings, or App Service
guesses and fails:

```
gunicorn --bind=0.0.0.0 --timeout 600 config.wsgi
```

**`SCM_DO_BUILD_DURING_DEPLOYMENT=1`** as an app setting, or dependencies never install and
you get an import error with no obvious cause.

**`SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`.** TLS terminates at the
front end, so without this Django believes requests are plain HTTP and
`SECURE_SSL_REDIRECT` produces an infinite redirect loop. This one costs people an evening.

**`CSRF_TRUSTED_ORIGINS`** must list the https origins — the `*.azurewebsites.net` host and
the custom domain. Django 4+ rejects POSTs otherwise, and the error message is unhelpful.

**`ALLOWED_HOSTS`** likewise.

**Static files:** WhiteNoise is the path of least resistance. Otherwise `collectstatic` has
to run as a build step.

**Do not run migrations on startup.** Multiple instances race each other. Run them as an
explicit step — SSH into the app, or a deployment job.

**Migrations connect as `rcp_owner`, the app runs as `rcp_app`.** Same split as local. If
production collapses these into one role, RLS is bypassed by the table owner and the
isolation guarantee is gone in the only place it matters.

## Next.js on App Service

- `output: 'standalone'` in `next.config.js`, startup command `node server.js`
- Set the Node version app setting explicitly
- Next reads `PORT` from the environment — don't hardcode it
- Either build locally and deploy the output, or enable SCM build

## Managed Postgres parity

The build runs against local Postgres on purpose; production will be a clone of this repo
with edits over the top. These are the known places a managed service differs, collected as
they are found so the clone-day edit list already exists:

- **No superuser.** On Azure Database for PostgreSQL Flexible Server the admin is a member
  of `azure_pg_admin`, not a superuser. `db/setup-local.sh` assumes a superuser exists to
  create the roles; production provisioning does the same work through the admin account
  and the portal/CLI.
- **`BYPASSRLS` cannot be granted without a superuser**, so the `rcp_login` role (ADR 0014)
  cannot be created as designed. The portable replacement, when needed: drop the definer
  role and add a second, narrow policy on `app_user` keyed to its own GUC —
  `app.login_username = username` — so the login flow exposes exactly one row to itself and
  no role bypasses RLS at all. Local keeps the definer function because it exists and the
  contract tests pin its behaviour; swap it in the clone.
- **Pooling is already safe.** Org context is `set_config(..., true)` inside each request
  transaction, so PgBouncer in transaction mode cannot leak one request's org into the
  next. Nothing to change here — recorded so nobody "fixes" it.

## Deliberately deferred

Front Door, WAF, deployment slots, staging, multi-region, autoscaling. Each is real and none
earns its complexity before there are customers. Recorded here so they are not re-decided
monthly.
