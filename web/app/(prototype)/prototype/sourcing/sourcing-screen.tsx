"use client";

/* Screen 4 — sourcing runs. Attention first, runs second: the inversion is the
 * point. A sighting that has been read and is not yet anybody is the only thing
 * on this screen that needs a decision, so it comes before the history.
 */
import { Control } from "@/components/control";
import { cn } from "@/lib/utils";
import { formatDate, formatDateShort } from "../../_fixtures/clock";
import { usePrototype } from "../../_state/provider";
import {
  clientById,
  roleById,
  sourcingScopeById,
  unresolvedSightings,
} from "../../_state/selectors";

export function SourcingScreen() {
  const { state, dispatch } = usePrototype();

  const unresolved = unresolvedSightings(state);
  const searches = [...state.searches].sort(
    (left, right) => Date.parse(left.ran_at) - Date.parse(right.ran_at),
  );

  const role = searches.length > 0 ? roleById(state, searches[0].role_id) : undefined;
  const client = role ? clientById(state, role.client_id) : undefined;

  const versions = new Set(searches.map((search) => search.brief_version_id));
  const pinnedLine =
    versions.size === 1 && searches.length > 1
      ? ` · ${searches.length === 2 ? "both" : "all"} pinned to Brief version ${
          state.briefVersions.find((version) => version.id === searches[0].brief_version_id)
            ?.version
        }`
      : "";

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="text-22 text-ink font-medium tracking-[-.01em]">Sourcing runs</h1>
        {client && role ? (
          <p className="text-14 text-ink-muted">
            {client.name} · {role.title}
          </p>
        ) : null}
      </div>

      <p className="rc-label text-ink-muted mt-[22px]">
        Read, and not yet anybody · {unresolved.length}
      </p>
      <div className="overflow-x-auto">
        <ul className="border-ink mt-2 min-w-[880px] border-t">
          {unresolved.map((sighting) => {
            const firstSentence = sighting.snapshot_excerpt.split(". ")[0];
            return (
              <li
                key={sighting.id}
                className="border-rule grid grid-cols-[3px_minmax(0,1fr)_300px_132px] items-center gap-x-4 border-b py-[9px]"
              >
                <span aria-hidden="true" className="bg-ink self-stretch" />
                <span className="min-w-0">
                  <span className="text-16 text-ink block">{firstSentence}</span>
                  <span className="text-14 text-ink-muted block">{sighting.source_kind}</span>
                </span>
                <span className="text-ink-muted tabular font-mono text-12">
                  {sighting.source_name} · read {formatDateShort(sighting.retrieved_at)}
                </span>
                <Control
                  variant="secondary"
                  className="text-14 px-3 py-1.5"
                  onClick={() =>
                    // The sighting is the resolving source — invariant 9. The row
                    // leaves this list because person_id stops being null.
                    dispatch({ type: "create_person_from_sighting", sighting_id: sighting.id })
                  }
                >
                  Create person
                </Control>
              </li>
            );
          })}
        </ul>
      </div>

      <p className={cn("rc-label text-ink-muted mt-[26px]")}>Runs{pinnedLine}</p>
      <div className="overflow-x-auto">
        <ul className="border-ink mt-2 min-w-[720px] border-t">
          {searches.map((search) => {
            const scope = sourcingScopeById(state, search.sourcing_scope_id);
            return (
              <li
                key={search.id}
                className="border-rule grid grid-cols-[150px_150px_minmax(0,1fr)] items-baseline gap-x-4 border-b py-[9px]"
              >
                <span className="text-14 text-ink tabular">{formatDate(search.ran_at)}</span>
                <span className="text-14 text-ink-secondary tabular">
                  Scope revision {scope?.revision}
                </span>
                <span className="text-14 text-ink-muted truncate">{search.coverage_note}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
