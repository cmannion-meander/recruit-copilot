"""Placement commands. record_checkpoint is the one the prototype's reducer actually
models; create_placement has no reducer counterpart — the fixtures simply hold
already-placed candidacies — but a checkpoint needs a placement to belong to, and a
placement needs the offer-signed moment to exist from (ADR 0011). Kept minimal and
undisguised as more than it is: no reducer action, no refusal history to port."""

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from candidacies.exceptions import CandidacyRefused
from candidacies.models import TerminalStage
from common.refusals import Refusal
from decisions.models import DecisionEvent

from .models import Placement, PlacementCheckpoint

CHECKPOINT_DAYS = (7, 30, 60, 90)


def create_placement(candidacy, *, started_on, probation_ends_on, actor):
    if candidacy.closed_at is not None:
        raise CandidacyRefused(
            requirement="A closed candidacy does not move.",
            reason="This record is closed.",
            action="Nothing to do — its state does not move from here.",
            invariant=6,
        )
    with transaction.atomic():
        placement = Placement.objects.create(
            candidacy=candidacy,
            brief_version=candidacy.brief_version,
            started_on=started_on,
            probation_ends_on=probation_ends_on,
        )
        for day in CHECKPOINT_DAYS:
            PlacementCheckpoint.objects.create(
                placement=placement, day=day, due_on=started_on + timedelta(days=day)
            )
        candidacy.brief_stage = None
        candidacy.terminal_stage = TerminalStage.PLACED
        candidacy.closed_at = timezone.now()
        candidacy.save(update_fields=["brief_stage", "terminal_stage", "closed_at"])
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.PLACED,
            actor=actor,
            summary=f"Placed, starting {started_on.isoformat()}.",
            terminal_stage=TerminalStage.PLACED,
        )
    return placement


def record_checkpoint(checkpoint, *, note, brief_feedback, actor):
    """A checkpoint records what happened, in words, on a date — not a rating. Already
    recorded is a no-op, not a refusal: re-visiting a checkpoint that was filled in
    yesterday is not an error."""
    if checkpoint.recorded_at is not None:
        return checkpoint
    if not note.strip():
        raise Refusal(
            requirement="A checkpoint is a note, not a checkbox.",
            reason="The note is empty.",
            action="Write what happened, then record it.",
        )
    checkpoint.recorded_at = timezone.now()
    checkpoint.recorded_by = actor
    checkpoint.note = note.strip()
    checkpoint.brief_feedback = brief_feedback.strip() if brief_feedback else None
    checkpoint.save(update_fields=["recorded_at", "recorded_by", "note", "brief_feedback"])
    DecisionEvent.objects.create(
        candidacy=checkpoint.placement.candidacy,
        type=DecisionEvent.Type.CHECKPOINT_RECORDED,
        actor=actor,
        summary=f"Day {checkpoint.day} checkpoint recorded.",
    )
    return checkpoint


def brief_feedback_for_client(client):
    """Every recorded checkpoint note for this client's past placements, newest first —
    surfaced at the top of the Brief screen for the next role at the same client
    (ADR 0011: 'the loop closes on the Brief, or it closes nowhere')."""
    return (
        PlacementCheckpoint.objects.filter(
            placement__candidacy__role__client=client, brief_feedback__isnull=False
        )
        .exclude(brief_feedback="")
        .select_related("placement__candidacy__role")
        .order_by("-recorded_at")
    )
