"""The periodic closer. Discovered automatically by procrastinate's Django integration
(settings.AUTODISCOVER_MODULE_NAME = "tasks") because this app is in INSTALLED_APPS.

Organization carries no organization_id and sits outside RLS — it is the anchor, not a
tenant table — so this is the one place in the codebase that legitimately enumerates every
org. Each org's candidacies are then read and closed under that org's own context, one
transaction per org, so a failure in one org's batch cannot roll back another's.
"""

from django.db import connection, transaction
from django.utils import timezone
from procrastinate.contrib.django import app

from organizations.models import Organization

from .models import Candidacy
from .services import close_overdue_candidacy


def _set_org_context(organization_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_org', %s, true)", [str(organization_id)])


@app.periodic(cron="0 * * * *")
@app.task(name="close_overdue_candidacies")
def close_overdue_candidacies(timestamp):
    for org_id in Organization.objects.values_list("id", flat=True):
        with transaction.atomic():
            _set_org_context(org_id)
            overdue = Candidacy.objects.filter(
                auto_close_at__lt=timezone.now(),
                closed_at__isnull=True,
                terminal_stage__isnull=True,
            )
            for candidacy in overdue:
                close_overdue_candidacy(candidacy)
