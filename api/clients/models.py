import uuid

from django.db import models


class Client(models.Model):
    """The hiring company."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "client"

    def __str__(self):
        return self.name


class Contact(models.Model):
    """A person at a client."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="+"
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=300)
    title = models.CharField(max_length=300, blank=True, default="")
    email = models.EmailField(blank=True, default="")

    class Meta:
        db_table = "contact"

    def __str__(self):
        return self.name
