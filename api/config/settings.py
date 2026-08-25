"""Django settings. All configuration comes from environment variables (CLAUDE.md).

Two database connections, deliberately (see .env.example and ADR 0014):

  DATABASE_URL            rcp_app — the application. Cannot bypass RLS, owns nothing.
  MIGRATION_DATABASE_URL  rcp_owner — migrations, and the test runner (creating the test
                          database needs CREATEDB). Owns the schema; never serves a request.

The selection is by context: management commands that do DDL, and pytest, connect as the
owner; everything else — runserver, wsgi, shell, the worker — connects as the app role.
Collapsing the two into one connection would leave every invariant test passing while
proving nothing, because both superusers and table owners bypass RLS unless it is forced.
"""

import os
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

from . import env

env.load()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [
    h for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h
]


def _dsn(url: str) -> dict:
    parts = urlsplit(url)
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": parts.path.lstrip("/"),
        "USER": unquote(parts.username or ""),
        "PASSWORD": unquote(parts.password or ""),
        "HOST": parts.hostname or "",
        "PORT": str(parts.port or ""),
    }


_OWNER_COMMANDS = {"migrate", "makemigrations", "sqlmigrate", "showmigrations", "test"}


def _needs_owner() -> bool:
    argv0 = os.path.basename(sys.argv[0]) if sys.argv else ""
    if "pytest" in argv0:
        return True
    return len(sys.argv) > 1 and sys.argv[1] in _OWNER_COMMANDS


DATABASES = {
    "default": _dsn(os.environ["MIGRATION_DATABASE_URL" if _needs_owner() else "DATABASE_URL"])
}

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.sessions",
    "procrastinate.contrib.django",
    "organizations",
    "clients",
    "roles",
    "people",
    "searches",
    "sightings",
    "channels",
    "candidacies",
    "decisions",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "common.middleware.OrgContextMiddleware",
    "common.middleware.RefusalMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
TEMPLATES = []

AUTH_USER_MODEL = "organizations.User"
AUTHENTICATION_BACKENDS = ["organizations.auth.LoginCrossingBackend"]

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
_cookie_domain = os.environ.get("SESSION_COOKIE_DOMAIN", "")
if _cookie_domain:
    SESSION_COOKIE_DOMAIN = _cookie_domain
    CSRF_COOKIE_DOMAIN = _cookie_domain
CSRF_TRUSTED_ORIGINS = [o for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o]

LANGUAGE_CODE = "en-gb"
TIME_ZONE = "UTC"
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
