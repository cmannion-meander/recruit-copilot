"use client";

/* The pipeline as a board: one column per stage of The Brief, one card per open
 * candidacy. Drag a card forward to advance it.
 *
 * The rules the board makes physical:
 *
 *   · The only legal drop is the NEXT stage — while dragging, that column alone
 *     illuminates and says so. There is no dragging backward, because no demote
 *     action exists on the record.
 *   · A refused drop springs back and the refusal renders on the card, with the
 *     action that clears it. The trigger that guards the table guards the hand.
 *   · Cards within a column sort by family name and cannot be hand-ordered. A
 *     hand-ordered column is a stack ranking, and invariant 2 refuses it.
 *
 * Closed and terminal records are not on the board; the List view holds them.
 */
import Link from "next/link";
import { useRef, useState } from "react";
import { CriteriaRow } from "@/components/criteria-row";
import { cn } from "@/lib/utils";
import type { Candidacy, Person } from "./_fixtures/types";
import { usePrototype } from "./_state/provider";
import { type Refusal as RefusalShape, refuseAdvance } from "./_state/refusals";
import {
  cellsFor,
  needsAttention,
  nextStage,
  personById,
  roleById,
  stageOf,
  stagesFor,
} from "./_state/selectors";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const CELL_STATE = {
  evidenced: "evidenced",
  not_found: "not-found",
  no_entry: "no-entry",
} as const;

function familyName(person: Person | undefined): string {
  if (!person) return "";
  const parts = person.full_name.split(" ");
  return parts[parts.length - 1] ?? person.full_name;
}

export function PipelineBoard({
  roleId,
  selected,
  onSelect,
}: {
  roleId: string;
  selected: string | null;
  onSelect: (candidacyId: string | null) => void;
}) {
  const { state, dispatch } = usePrototype();
  /* The ref is the truth the drag handlers read — a dragover can arrive before
   * React has re-rendered from dragstart, and a drop decided from stale state
   * is a drop that silently vanishes. The state is only the illumination. */
  const draggingRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [held, setHeld] = useState<{ candidacyId: string; refusal: RefusalShape } | null>(null);

  const role = roleById(state, roleId);
  const versionId = role?.pinned_brief_version_id;
  if (!role || !versionId) return null;

  const stages = stagesFor(state, versionId);
  const cards = state.candidacies.filter(
    (candidacy) => candidacy.role_id === roleId && candidacy.closed_at === null,
  );

  const legalTargetNow = () => {
    const id = draggingRef.current;
    const candidacy = id ? cards.find((item) => item.id === id) : undefined;
    return candidacy ? nextStage(state, candidacy)?.id : undefined;
  };

  const draggingCandidacy = dragging
    ? cards.find((candidacy) => candidacy.id === dragging)
    : undefined;
  const legalTarget = draggingCandidacy ? nextStage(state, draggingCandidacy)?.id : undefined;

  return (
    <div className="mt-3 flex items-start gap-3 overflow-x-auto pb-3">
      {stages.map((stage) => {
        const mine = cards
          .filter((candidacy) => stageOf(state, candidacy)?.id === stage.id)
          .sort((left, right) =>
            familyName(personById(state, left.person_id)).localeCompare(
              familyName(personById(state, right.person_id)),
            ),
          );
        const legal = dragging !== null && stage.id === legalTarget;

        return (
          <section
            key={stage.id}
            aria-label={`${stage.label} · ${mine.length}`}
            onDragOver={(event) => {
              if (stage.id === legalTargetNow()) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const candidacyId = draggingRef.current ?? event.dataTransfer.getData("text/plain");
              if (!candidacyId || stage.id !== legalTargetNow()) return;
              const refused = refuseAdvance(state, candidacyId);
              if (refused) {
                setHeld({ candidacyId, refusal: refused });
              } else {
                dispatch({ type: "advance_stage", candidacy_id: candidacyId });
                setHeld(null);
              }
              draggingRef.current = null;
              setDragging(null);
            }}
            className={cn(
              "w-[240px] shrink-0 border-t-[3px] pt-2",
              legal ? "border-ink bg-paper-sunk" : "border-rule",
            )}
          >
            <div className="flex items-baseline justify-between gap-2 px-1">
              <p className={cn("rc-label", legal ? "text-ink" : "text-ink-muted")}>
                {legal ? `${stage.label} · drop to advance` : stage.label}
              </p>
              {mine.length > 0 && !legal ? (
                <p className="text-ink-muted tabular font-mono text-12">{mine.length}</p>
              ) : null}
            </div>

            <ul className="mt-2 flex min-h-[40px] flex-col gap-2 px-1">
              {mine.map((candidacy) => (
                <BoardCard
                  key={candidacy.id}
                  candidacy={candidacy}
                  isSelected={selected === candidacy.id}
                  isDragging={dragging === candidacy.id}
                  heldRefusal={held?.candidacyId === candidacy.id ? held.refusal : null}
                  onSelect={() => onSelect(selected === candidacy.id ? null : candidacy.id)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", candidacy.id);
                    event.dataTransfer.effectAllowed = "move";
                    draggingRef.current = candidacy.id;
                    setDragging(candidacy.id);
                    setHeld(null);
                  }}
                  onDragEnd={() => {
                    draggingRef.current = null;
                    setDragging(null);
                  }}
                  onDismiss={() => setHeld(null)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function BoardCard({
  candidacy,
  isSelected,
  isDragging,
  heldRefusal,
  onSelect,
  onDragStart,
  onDragEnd,
  onDismiss,
}: {
  candidacy: Candidacy;
  isSelected: boolean;
  isDragging: boolean;
  heldRefusal: RefusalShape | null;
  onSelect: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onDismiss: () => void;
}) {
  const { state, dispatch } = usePrototype();
  const person = personById(state, candidacy.person_id);
  const stage = stageOf(state, candidacy);
  const flag = needsAttention(state, candidacy);
  const cells = cellsFor(state, candidacy).map((cell) => ({
    label: cell.criterion.cell_label,
    state: CELL_STATE[cell.state],
  }));

  return (
    <li>
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onSelect}
        className={cn(
          "bg-paper-raised rounded-rc grid w-full cursor-grab grid-cols-[3px_1fr] gap-x-2 border p-2 text-left",
          isSelected ? "border-ink" : "border-rule",
          isDragging ? "opacity-60" : "",
          FOCUS,
        )}
      >
        <span
          aria-hidden="true"
          className={cn("self-stretch", flag ? "bg-ink" : "bg-transparent")}
        />
        <span className="min-w-0">
          <span className={cn("text-16 block truncate", flag ? "text-ink" : "text-ink-secondary")}>
            {person?.full_name}
          </span>
          <span className="text-14 text-ink-muted block truncate">{person?.current_employer}</span>
          <CriteriaRow
            cells={cells}
            subject={person?.full_name ?? ""}
            size="sm"
            count="short"
            className="mt-1.5"
          />
          {flag ? <span className="rc-label text-ink mt-1.5 block">{flag.flag}</span> : null}
        </span>
      </button>

      {heldRefusal ? (
        <div className="border-l-ink bg-paper-sunk mt-1 border-l-4 p-2.5">
          <p className="text-14 text-ink font-medium">{heldRefusal.requirement}</p>
          <p className="text-14 text-ink-secondary mt-0.5">{heldRefusal.reason}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {heldRefusal.invariant === 6 && stage ? (
              <button
                type="button"
                onClick={() => {
                  dispatch({
                    type: "send_stage_message",
                    candidacy_id: candidacy.id,
                    stage_id: stage.id,
                  });
                  onDismiss();
                }}
                className={cn(
                  "rc-label bg-ink text-ink-inverse rounded-rc hover:bg-ink-strong border border-transparent px-2 py-[3px] transition-colors",
                  FOCUS,
                )}
              >
                Send the {stage.label} message
              </button>
            ) : (
              <Link
                href={`/prototype/candidacies/${candidacy.id}/review`}
                className={cn(
                  "rc-label text-ink border-rule-control rounded-rc hover:bg-paper-raised border px-2 py-[3px] transition-colors",
                  FOCUS,
                )}
              >
                Open the scorecard
              </Link>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className={cn("rc-label text-ink-muted hover:text-ink px-1 py-[3px]", FOCUS)}
            >
              Leave it
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
