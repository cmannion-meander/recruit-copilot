"""The candidacy commands.

Constants match the reducer's (AUTO_CLOSE_DAYS = 90, EXTENSION_DAYS = 30) and the trigger
in this app's migration, which bounds auto_close_at to exactly these increments — if either
constant changes, the migration's SQL must change with it.

Each command wraps its writes in transaction.atomic() rather than depending on a caller to
provide one (ADR 0013: "one command, one transaction... commit together or not at all").
In production that caller is OrgContextMiddleware, already wrapping the request, so this
nests as a harmless savepoint there. It matters for extend_auto_close specifically: the
ADR 0012 trigger's extension branch requires the CandidateMessage to have landed in the
SAME transaction as the auto_close_at update, which only holds if this function's own
statements are guaranteed to share one.
"""

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from decisions.models import Decision, DecisionEvent
from roles.models import Role

from .exceptions import CandidacyRefused
from .models import Candidacy, CandidateMessage, TerminalStage

AUTO_CLOSE_DAYS = 90
EXTENSION_DAYS = 30


def _refuse_if_closed(candidacy, *, invariant):
    if candidacy.closed_at is not None or candidacy.terminal_stage is not None:
        raise CandidacyRefused(
            requirement="A closed candidacy does not move.",
            reason="This record is closed.",
            action="Nothing to do — its state does not move from here.",
            invariant=invariant,
        )


def create_candidacy(role, person, channel, *, actor):
    if role.state != Role.State.OPEN:
        raise CandidacyRefused(
            requirement="A candidacy needs an open role.",
            reason=f"{role.title} is {role.state}.",
            action="Open the role first.",
            invariant=1,
        )
    if Candidacy.objects.filter(role=role, person=person).exists():
        raise CandidacyRefused(
            requirement="One candidacy per person, per role.",
            reason=f"{person.full_name} already has a candidacy on this role.",
            action="Open the existing record instead of adding a new one.",
            invariant=1,
        )
    # Guaranteed by role.open(): every criterion is assigned to some stage, so at least
    # one stage exists.
    first_stage = role.pinned_brief_version.stages.order_by("position").first()
    with transaction.atomic():
        candidacy = Candidacy.objects.create(
            role=role,
            person=person,
            brief_version=role.pinned_brief_version,
            channel=channel,
            brief_stage=first_stage,
            auto_close_at=timezone.now() + timedelta(days=AUTO_CLOSE_DAYS),
        )
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.CANDIDACY_CREATED,
            actor=actor,
            summary=f"{person.full_name} added to {role.title} via {channel.name}.",
            brief_stage=first_stage,
        )
    return candidacy


def send_stage_message(candidacy, stage, *, actor):
    _refuse_if_closed(candidacy, invariant=6)
    if candidacy.messages.filter(kind=CandidateMessage.Kind.STAGE, brief_stage=stage).exists():
        raise CandidacyRefused(
            requirement="One stage message per candidacy, per stage.",
            reason=f"A message for {stage.label} is already on the record.",
            action="Nothing to do.",
            invariant=6,
        )
    with transaction.atomic():
        message = CandidateMessage.objects.create(
            candidacy=candidacy,
            kind=CandidateMessage.Kind.STAGE,
            brief_stage=stage,
            sent_by=actor,
            body=stage.candidate_message,
        )
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.MESSAGE_SENT,
            actor=actor,
            summary=f"Told they reached {stage.label}.",
            brief_stage=stage,
        )
    return message


def advance_stage(candidacy, *, actor):
    """Invariant 3, then invariant 6. The scorecard-coverage half of invariant 3 —
    every criterion this stage carries has a Finding — is reviews.services
    .require_stage_complete, the same check Review.advance() runs directly; a stage
    with criteria but no Review at all (no finding was ever recorded there) is zero
    coverage, not a pass.
    """
    _refuse_if_closed(candidacy, invariant=3)
    current_stage = candidacy.brief_stage

    from reviews.models import Review
    from reviews.services import require_stage_complete

    review = Review.objects.filter(candidacy=candidacy, brief_stage=current_stage).first()
    require_stage_complete(current_stage, review)

    if not candidacy.messages.filter(
        kind=CandidateMessage.Kind.STAGE, brief_stage=current_stage
    ).exists():
        raise CandidacyRefused(
            requirement=(
                "A candidacy cannot leave a stage until the candidate has been told "
                "they reached it."
            ),
            reason=f"No message has been sent for {current_stage.label}.",
            action="Send the stage message, then advance.",
            invariant=6,
        )

    next_stage = (
        candidacy.brief_version.stages.filter(position__gt=current_stage.position)
        .order_by("position")
        .first()
    )
    if next_stage is None:
        raise CandidacyRefused(
            requirement=f"{current_stage.label} is the last stage.",
            reason="There is nowhere further to advance to.",
            action="Record the outcome — rejection or submission — instead of advancing.",
            invariant=3,
        )

    with transaction.atomic():
        candidacy.brief_stage = next_stage
        candidacy.auto_close_at = timezone.now() + timedelta(days=AUTO_CLOSE_DAYS)
        candidacy.save(update_fields=["brief_stage", "auto_close_at"])
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.STAGE_CHANGED,
            actor=actor,
            summary=f"Moved to {next_stage.label}.",
            brief_stage=next_stage,
        )
    return candidacy


def extend_auto_close(candidacy, *, message_text, actor):
    """ADR 0012: the deadline moves only in the same act that tells the candidate
    something. An extension is itself that message — no internal version, no second,
    softer text; what is written here is sent verbatim."""
    _refuse_if_closed(candidacy, invariant=6)
    if not message_text.strip():
        raise CandidacyRefused(
            requirement="An extension is itself a message to the candidate.",
            reason="The message is empty.",
            action="Write what they should know, then extend again.",
            invariant=6,
        )
    with transaction.atomic():
        CandidateMessage.objects.create(
            candidacy=candidacy,
            kind=CandidateMessage.Kind.EXTENSION,
            sent_by=actor,
            body=message_text.strip(),
        )
        candidacy.auto_close_at = candidacy.auto_close_at + timedelta(days=EXTENSION_DAYS)
        candidacy.save(update_fields=["auto_close_at"])
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.DEADLINE_EXTENDED,
            actor=actor,
            summary=f"Deadline extended {EXTENSION_DAYS} days: {message_text.strip()}",
        )
    return candidacy


def reject_candidacy(candidacy, *, reason_code, reason_text, actor):
    """Invariant 4: a reason code and a written reason, sent to the candidate verbatim —
    one text, one audience."""
    _refuse_if_closed(candidacy, invariant=4)
    if not reason_text.strip():
        raise CandidacyRefused(
            requirement="A rejection is not free text alone.",
            reason="The written reason is empty.",
            action="Choose a reason and write why, then reject again.",
            invariant=4,
        )
    with transaction.atomic():
        decision = Decision.objects.create(
            candidacy=candidacy,
            reason_code=reason_code,
            reason_text=reason_text.strip(),
            decided_by=actor,
        )
        CandidateMessage.objects.create(
            candidacy=candidacy,
            kind=CandidateMessage.Kind.REJECTION,
            sent_by=actor,
            body=reason_text.strip(),
        )
        candidacy.terminal_stage = TerminalStage.REJECTED
        candidacy.closed_at = timezone.now()
        candidacy.save(update_fields=["terminal_stage", "closed_at"])
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.REJECTED,
            actor=actor,
            summary=f"Rejected: {reason_text.strip()}",
            terminal_stage=TerminalStage.REJECTED,
        )
    return decision


def close_overdue_candidacy(candidacy):
    """The one writer that is not a user command — the periodic closer
    (docs/backend-prd.md, "Designed, not transcribed"). Closure is itself the message:
    invariant 6 promises the candidate is told, not silently dropped."""
    with transaction.atomic():
        CandidateMessage.objects.create(
            candidacy=candidacy,
            kind=CandidateMessage.Kind.AUTO_CLOSURE,
            sent_by=None,
            body=(
                "This closes on its own because nothing was decided before the date you "
                "were given. It has closed, as you were told it would."
            ),
        )
        candidacy.terminal_stage = TerminalStage.CLOSED_NO_RESPONSE
        candidacy.closed_at = timezone.now()
        candidacy.save(update_fields=["terminal_stage", "closed_at"])
        DecisionEvent.objects.create(
            candidacy=candidacy,
            type=DecisionEvent.Type.AUTO_CLOSED,
            actor=None,
            summary="Closed automatically: the deadline passed with nothing decided.",
            terminal_stage=TerminalStage.CLOSED_NO_RESPONSE,
        )
    return candidacy
