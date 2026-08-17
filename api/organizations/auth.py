"""The login crossing.

The user table is tenant-scoped and under forced RLS, which creates a bootstrap problem:
authenticating requires reading a user row, and reading a user row requires the org
context that only authentication can establish. The crossing is `login_lookup`, a
SECURITY DEFINER function owned by `rcp_login` — a role with BYPASSRLS and no login — that
returns exactly the three columns a credential check needs. One function, one row shape,
no other path across the boundary. See ADR 0014.

On a match the backend sets the org context for the remainder of the request transaction
and loads the user through the ORM like any other read.
"""

from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password, make_password
from django.db import connection

from .models import User


class LoginCrossingBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, pw_hash, organization_id FROM login_lookup(%s)", [username]
            )
            row = cursor.fetchone()
        if row is None:
            # Hash anyway, so a missing username costs the same time as a wrong password.
            check_password(password, make_password("unused"))
            return None
        user_id, pw_hash, organization_id = row
        if not check_password(password, pw_hash):
            return None
        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.current_org', %s, true)", [str(organization_id)])
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
