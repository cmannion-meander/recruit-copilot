import { cn } from "@/lib/utils";

/* The Submission Record.
 *
 * The one screen in this product where the register is a document rather than an
 * application. It carries the agency's own wordmark and nobody else's — there is no
 * "powered by" line here and there will not be one. A four-person agency is handing this
 * to its best client under its own name, and a vendor credit in the footer turns their
 * work into someone else's marketing.
 *
 * Every criterion, in the order of The Brief, with its finding and the passage that
 * produced it. No summary line, no headline figure, no "recommended". A reader who wants
 * the short version reads the five findings; there is no shorter version to give them.
 *
 * Immutable by construction: this component takes a frozen snapshot and renders it. It
 * accepts no callbacks, so there is nothing for an edit control to be wired to.
 */
export type SubmissionLine = {
  position: number;
  criterionText: string;
  status: "evidenced" | "not_found";
  quote: string | null;
  provenance: string | null;
};

export function SubmissionRecordDocument({
  wordmark,
  reference,
  clientName,
  roleTitle,
  personName,
  personHeadline,
  briefVersion,
  briefAgreedOn,
  signedOffBy,
  signedOffTitle,
  signedOffOn,
  lines,
  className,
}: {
  wordmark: string;
  reference: string;
  clientName: string;
  roleTitle: string;
  personName: string;
  personHeadline: string;
  briefVersion: number;
  briefAgreedOn: string;
  signedOffBy: string;
  signedOffTitle: string;
  signedOffOn: string;
  lines: SubmissionLine[];
  className?: string;
}) {
  const evidenced = lines.filter((line) => line.status === "evidenced").length;

  return (
    <article
      className={cn("border-rule bg-paper-raised border px-8 py-10 sm:px-14 sm:py-14", className)}
    >
      <header className="border-rule border-b pb-8">
        <p className="rc-label text-ink">{wordmark}</p>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="rc-label text-ink-muted">{clientName}</p>
            <h1 className="text-36 text-ink mt-2 font-semibold tracking-tight">{roleTitle}</h1>
          </div>
          <p className="text-14 text-ink-muted tabular">{reference}</p>
        </div>
      </header>

      <section className="border-rule border-b py-8">
        <p className="rc-label text-ink-muted">Candidate</p>
        <p className="text-28 text-ink mt-2 font-medium tracking-tight">{personName}</p>
        <p className="text-18 text-ink-secondary mt-1">{personHeadline}</p>
      </section>

      <section className="border-rule border-b py-8">
        <p className="rc-label text-ink-muted">Assessed against</p>
        <p className="text-16 text-ink mt-3 max-w-[62ch]">
          The Brief agreed with {clientName} for this role, version{" "}
          <span className="tabular">{briefVersion}</span>, agreed {briefAgreedOn}. The criteria
          below are in the order they were written, and every candidate put forward for this role is
          read against the same list in the same order.
        </p>
        <p className="text-16 text-ink-secondary mt-4 tabular">
          {evidenced} of {lines.length} criteria are evidenced by a passage quoted below.
        </p>
      </section>

      <section className="py-8">
        <p className="rc-label text-ink-muted">Findings</p>
        <ol className="mt-6 flex flex-col gap-10">
          {lines.map((line) => (
            <li key={line.position}>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-16 text-ink-muted tabular">{line.position}.</span>
                <h2 className="text-18 text-ink max-w-[52ch] font-medium">{line.criterionText}</h2>
              </div>

              {line.status === "evidenced" && line.quote ? (
                <figure className="border-l-evidenced bg-evidenced-tint mt-4 border-l-2 px-5 py-4">
                  <p className="rc-label text-evidenced">Evidenced</p>
                  <blockquote className="font-serif text-18 text-ink mt-3 leading-relaxed">
                    {"“"}
                    {line.quote}
                    {"”"}
                  </blockquote>
                  {line.provenance ? (
                    <figcaption className="text-ink-secondary mt-3 font-mono text-12 tabular">
                      {line.provenance}
                    </figcaption>
                  ) : null}
                </figure>
              ) : (
                <div className="border-l-open bg-open-tint mt-4 border-l-2 border-dashed px-5 py-4">
                  <p className="rc-label text-open">Not found</p>
                  <p className="text-16 text-ink-secondary mt-3 max-w-[52ch]">
                    Nothing in what we hold supports this. It is not a judgement that the candidate
                    lacks it — it is a statement that we could not quote anything, and a question
                    worth asking at interview.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-rule border-t pt-8">
        <p className="rc-label text-ink-muted">Put forward by</p>
        <p className="text-18 text-ink mt-3">{signedOffBy}</p>
        <p className="text-16 text-ink-secondary">{signedOffTitle}</p>
        <p className="text-16 text-ink-secondary mt-1">{wordmark}</p>
        <p className="text-14 text-ink-muted mt-4 tabular">{signedOffOn}</p>
      </footer>
    </article>
  );
}
