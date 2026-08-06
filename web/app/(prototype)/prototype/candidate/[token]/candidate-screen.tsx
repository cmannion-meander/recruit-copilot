"use client";

/* Screen 10 — what the candidate can read. Invariant 7.
 *
 * A different audience and a different voice. The person reading this is being assessed
 * and did not ask to be: they were found on a company page by a recruiter they have
 * never met, and the first they may know of any of it is this link.
 *
 * So: no exclamation marks, no encouragement, no apology, and nothing that reads as a
 * rejection letter written by a system that is pleased with itself. It says software was
 * used, shows the findings and the passages they came from, and names what happens next
 * and when. Read-only — there is no control on this page at all.
 *
 * The test is whether a line would embarrass us printed in a newspaper beside this
 * person's name. Every sentence below has been read that way.
 */
import { EvidenceCitation } from "@/components/evidence-citation";
import { formatDate } from "../../../_fixtures/clock";
import { usePrototype } from "../../../_state/provider";
import { candidacyById, messagesFor, stageOf, submissionByToken } from "../../../_state/selectors";

export function CandidateScreen({ token }: { token: string }) {
  const { state } = usePrototype();
  const record = submissionByToken(state, token);

  if (!record) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-22 text-ink font-medium">This link does not open a record.</h1>
        <p className="text-16 text-ink-secondary mt-3 max-w-[52ch]">
          It may have been mistyped. The agency that sent it can send it again.
        </p>
      </div>
    );
  }

  const candidacy = candidacyById(state, record.candidacy_id);
  const stage = candidacy ? stageOf(state, candidacy) : undefined;
  const sent = candidacy ? messagesFor(state, candidacy.id) : [];
  const evidenced = record.snapshot.lines.filter((line) => line.status === "evidenced").length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="rc-label text-ink-muted">{state.organization.name}</p>

      <h1 className="text-36 text-ink mt-6 font-semibold tracking-tight">
        What was recorded about you
      </h1>

      <p className="text-18 text-ink-secondary mt-5 max-w-[62ch]">
        {state.organization.name} put your name forward to {record.snapshot.client_name} for the
        role of {record.snapshot.role_title} on {formatDate(record.signed_off_at)}. This page is
        what was written, and what it was based on.
      </p>

      {/* Invariant 7. Rendered from a non-nullable field: the wording is editable, the
          presence of it is not, and there is no flag anywhere that suppresses it. */}
      <section className="border-rule bg-paper-sunk mt-10 border-l-4 border-l-ink px-6 py-6">
        <h2 className="text-22 text-ink font-medium">Software was used to assess you</h2>
        <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
          Your CV was read against {record.snapshot.lines.length} criteria, written and agreed with{" "}
          {record.snapshot.client_name} before any candidate was looked at. Every finding below is
          either a passage quoted from a document you supplied, or a statement that nothing
          supporting that criterion was found.
        </p>
        <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
          You were not scored. No number was produced about you, and you are not ranked against
          anyone else — the system holds no such figure, so there is none to show you or to
          withhold.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="rc-label text-ink-muted">
          The {record.snapshot.lines.length} criteria, and what was recorded
        </h2>
        <p className="text-16 text-ink-secondary mt-4 tabular">
          {evidenced} of {record.snapshot.lines.length} were evidenced by something in your own
          documents.
        </p>

        <ol className="mt-8 flex flex-col gap-10">
          {record.snapshot.lines.map((line) => (
            <li key={line.position}>
              <h3 className="text-18 text-ink max-w-[52ch] font-medium">
                <span className="text-ink-muted tabular">{line.position}. </span>
                {line.criterion_text}
              </h3>
              <div className="mt-4">
                {line.status === "evidenced" && line.quote ? (
                  <EvidenceCitation
                    state="evidenced"
                    quote={line.quote}
                    provenance={line.provenance ?? ""}
                  />
                ) : (
                  <div className="border-l-open bg-open-tint border-l-2 border-dashed px-5 py-4">
                    <p className="rc-label text-open">Not found</p>
                    <p className="text-16 text-ink-secondary mt-3 max-w-[52ch]">
                      Nothing in the documents held supports this. That is a statement about the
                      documents, not about you, and it is the kind of thing an interview is for.
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Step four, from the candidate's side. Everything they were sent, in order,
          with dates — so "where am I in this?" has an answer that is not an email
          they have to go and find. */}
      <section className="border-rule mt-14 border-t pt-8">
        <h2 className="text-22 text-ink font-medium">Where you are</h2>
        {stage ? (
          <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
            {stage.terminal
              ? `This is closed: ${stage.label.toLowerCase()}.`
              : `You are at ${stage.label.toLowerCase()}.`}
          </p>
        ) : null}
        {sent.length > 0 ? (
          <ol className="border-rule mt-6 border-t">
            {sent.map((message) => (
              <li key={message.id} className="border-rule border-b py-4">
                <p className="text-14 text-ink-muted tabular">{formatDate(message.sent_at)}</p>
                <p className="text-16 text-ink-secondary mt-2 max-w-[62ch]">{message.body}</p>
              </li>
            ))}
          </ol>
        ) : null}
        <p className="text-14 text-ink-muted mt-4 max-w-[62ch]">
          Everything sent to you about this role, in order. There is no version of any of it written
          for anyone else.
        </p>
      </section>

      <section className="border-rule mt-14 border-t pt-8">
        <h2 className="text-22 text-ink font-medium">What happens next</h2>
        <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
          This record is with {record.snapshot.client_name}. The decision is theirs, and{" "}
          {state.organization.name} will tell you what they say.
        </p>
        {candidacy ? (
          <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
            If nothing has been decided by {formatDate(candidacy.auto_close_at)}, this closes on its
            own and you will be told that it has closed. It does not go quiet.
          </p>
        ) : null}
        <p className="text-16 text-ink-secondary mt-3 max-w-[62ch]">
          If a passage above has been read wrongly, reply to the message this link came in. A
          correction is recorded beside the original, and the original is not removed.
        </p>
      </section>

      <section className="border-rule mt-10 border-t pt-8">
        <h2 className="rc-label text-ink-muted">How this record is held</h2>
        <p className="text-16 text-ink-secondary mt-4 max-w-[62ch]">
          {state.organization.name} holds it. Where each passage came from is on the record and is
          shown above. To ask what is held about you, or to ask for it to be removed, write to the
          agency.
        </p>
      </section>
    </div>
  );
}
