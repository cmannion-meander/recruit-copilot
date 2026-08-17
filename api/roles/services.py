"""The Brief's commands. Each is one transaction (the request middleware provides it) and
refuses with named items, never a count alone."""

from common.refusals import Refusal

from .models import BriefStage, BriefStageCriterion, Criterion


def _refuse_unless_draft(role):
    if role.state != "draft":
        raise Refusal(
            requirement="The Brief can't change after the role opens.",
            reason="Opening pinned the version, and every record renders against the "
            "version it was made under.",
            action="A later slice adds re-versioning; until then the pinned Brief stands.",
            invariant=1,
        )


def add_criterion(role, *, text, cell_label=""):
    """Append one criterion to the current version of the role's Brief."""
    if not text or not text.strip():
        raise Refusal(
            requirement="A criterion is a sentence saying what must be evidenced.",
            reason="The text is empty.",
            action="Write the requirement and add it again.",
            invariant=1,
        )
    _refuse_unless_draft(role)
    version = role.brief.versions.order_by("-version").first()
    last = version.criteria.order_by("-position").first()
    return Criterion.objects.create(
        organization=role.organization,
        brief_version=version,
        position=(last.position + 1) if last else 1,
        text=text.strip(),
        cell_label=cell_label.strip(),
    )


def assign_criterion(criterion, stage):
    """Assign a criterion to the stage that will evidence it. Idempotent."""
    _refuse_unless_draft(criterion.brief_version.brief.role)
    if stage.brief_version_id != criterion.brief_version_id:
        raise Refusal(
            requirement="A criterion is assigned to a stage of its own Brief version.",
            reason="This stage belongs to a different version.",
            action="Assign it to one of this version's stages.",
            invariant=1,
        )
    if stage.owner == BriefStage.Owner.CLIENT:
        raise Refusal(
            requirement="Findings are recorded at stages the agency owns.",
            reason=f"{stage.label} belongs to the client, and the agency records no "
            "findings on somebody else's conversation.",
            action="Assign it to a stage the agency runs.",
            invariant=1,
        )
    assignment, _created = BriefStageCriterion.objects.get_or_create(
        brief_stage=stage,
        criterion=criterion,
        defaults={
            "organization": criterion.organization,
            "brief_version": criterion.brief_version,
        },
    )
    return assignment
