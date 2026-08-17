"""The refusal shape.

Every guard in the product answers with the same four parts the screens render: the
requirement, the reason in one clause, the next action, and the named items — never a bare
count (docs/prototype-findings.md §11). A validator that cannot name what is missing is not
finished.

Raising a Refusal inside a request rolls the transaction back and returns 422 with this
shape as the body. See common/middleware.py.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class RefusalItem:
    label: str
    detail: str | None = None


class Refusal(Exception):
    def __init__(
        self,
        *,
        requirement: str,
        reason: str,
        action: str,
        items: tuple[RefusalItem, ...] = (),
        invariant: int | None = None,
    ):
        super().__init__(requirement)
        self.requirement = requirement
        self.reason = reason
        self.action = action
        self.items = tuple(items)
        self.invariant = invariant

    def as_payload(self) -> dict:
        return {
            "requirement": self.requirement,
            "reason": self.reason,
            "action": self.action,
            "items": [{"label": i.label, "detail": i.detail} for i in self.items],
            "invariant": self.invariant,
        }
