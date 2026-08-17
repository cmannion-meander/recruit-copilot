"""Shared model behaviour.

DerivesOrganization: tenant-scoped child rows may omit `organization` when a parent
reference already carries it — a sighting belongs to its person's org, a candidacy to its
role's. The contract tests create child rows this way, and requiring the caller to repeat
what the parent already knows invites the one mismatch RLS would then have to catch.
Derivation happens in save(); a caller who passes a wrong organization explicitly is still
caught by the row policy on insert.
"""


class DerivesOrganization:
    # Field names to copy the organization from, tried in order; first non-null wins.
    organization_from: tuple[str, ...] = ()

    def save(self, *args, **kwargs):
        if self.organization_id is None:
            for name in self.organization_from:
                if getattr(self, f"{name}_id", None) is not None:
                    self.organization_id = getattr(self, name).organization_id
                    break
        super().save(*args, **kwargs)
