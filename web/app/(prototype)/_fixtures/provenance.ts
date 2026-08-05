/* The provenance line under a quoted passage.
 *
 * It names the artifact, where in it the passage sits, and — for a sighting — when the
 * source was read. It never says "verified", "confirmed" or "source: AI", because it is
 * a pointer, not a claim.
 *
 * Character offsets are printed. That looks like an odd thing to show a recruiter until
 * the first time a client asks where a sentence came from.
 */
import { formatDateShort } from "./clock";
import { documents } from "./documents";
import { sightings } from "./people";
import type { Evidence, EvidenceTarget } from "./types";

export function provenanceOf(target: EvidenceTarget): string {
  if (target.kind === "document") {
    const document = documents.find((candidate) => candidate.id === target.document_id);
    const name = document ? document.filename : target.document_id;
    return `${name} · page ${target.page} ¶ ${target.paragraph} · chars ${target.char_start}–${target.char_end}`;
  }

  const sighting = sightings.find((candidate) => candidate.id === target.sighting_id);
  const name = sighting ? sighting.source_name : target.sighting_id;
  const read = sighting ? `read ${formatDateShort(sighting.retrieved_at)}` : "read date unknown";
  return `${name} · ${read} · chars ${target.char_start}–${target.char_end}`;
}

export function provenanceOfEvidence(item: Evidence): string {
  return provenanceOf(item.target);
}
