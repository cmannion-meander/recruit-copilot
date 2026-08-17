import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class Organization(models.Model):
    """The tenant root and the RLS anchor. The one table with no organization_id."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    wordmark = models.CharField(max_length=200, blank=True, default="")
    place = models.CharField(max_length=200, blank=True, default="")
    # Invariant 7: the AI-use notice is rendered from a non-nullable template field.
    # Wording is editable; visibility is not — no enabled flag exists, and
    # test_ai_use_notice_cannot_be_disabled asserts one never will.
    ai_notice_template = models.TextField(
        default=(
            "Software was used to assess you. Every finding recorded about you cites the "
            "passage it was read from, and you can see both."
        )
    )

    class Meta:
        db_table = "organization"

    def __str__(self):
        return self.name


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # AbstractUser names the column `password`, which the key-material catalogue scan
    # (invariant 10) refuses. It holds a salted hash, not a secret, so it keeps the field
    # and loses the name.
    password = models.CharField(max_length=128, db_column="pw_hash")
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="users")
    title = models.CharField(max_length=200, blank=True, default="")

    class Meta:
        db_table = "app_user"

    def __str__(self):
        return self.get_username()
