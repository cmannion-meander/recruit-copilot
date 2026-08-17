"""Test bootstrap. Runs before any test module is imported.

Two jobs:

1. Load the repo-root .env, because tests read connection strings from the environment and
   pytest does not source shell profiles.
2. Point APP_DATABASE_URL at the *test* database. tests/test_invariants.py opens raw
   psycopg connections as rcp_app to prove isolation on the role the application actually
   uses — but the test runner migrates `test_<name>`, not `<name>`, and a raw connection
   aimed at the development database would assert against tables the tests never created.
"""

import os
from urllib.parse import urlsplit, urlunsplit

from config import env


def pytest_configure(config):
    env.load()
    dsn = os.environ["APP_DATABASE_URL"]
    parts = urlsplit(dsn)
    name = parts.path.lstrip("/")
    if not name.startswith("test_"):
        os.environ["APP_DATABASE_URL"] = urlunsplit(parts._replace(path="/test_" + name))
