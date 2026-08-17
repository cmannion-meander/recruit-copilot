"""Org context and the refusal response.

OrgContextMiddleware wraps every request in one transaction and sets `app.current_org`
inside it, from the session. RLS policies key on that GUC, so a request that never logged
in queries with it empty and every tenant-scoped read fails closed. `SET LOCAL` semantics
(`set_config(..., true)`) scope the value to the transaction, so a pooled connection cannot
carry one request's org into the next — the contract test for the leak opens its own
connection and proves it.

RefusalMiddleware sits inside the transaction. A Refusal raised by a view marks the
transaction for rollback — a refused command must leave no trace — and returns 422 with the
refusal shape as the body. Any other exception also marks rollback and then propagates to
Django's 500 handling; a half-committed command is worse than a failed one.
"""

from django.db import connection, transaction
from django.http import JsonResponse

from .refusals import Refusal


class OrgContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        org_id = request.session.get("org_id", "")
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SELECT set_config('app.current_org', %s, true)", [str(org_id)])
            return self.get_response(request)


class RefusalMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        transaction.set_rollback(True)
        if isinstance(exception, Refusal):
            return JsonResponse(exception.as_payload(), status=422)
        return None
