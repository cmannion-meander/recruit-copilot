const criteria = [
  "Payroll for 200+ staff",
  "CIPP qualification",
  "Sage 50 Payroll",
  "Managed one or more reports",
  "Commutable to Leeds",
];

const candidates = [
  { name: "Sarah Whitfield", cells: [true, false, true, true, true] },
  { name: "Daniel Osei", cells: [true, true, true, false, false] },
  { name: "Priya Raman", cells: [false, true, true, true, true] },
];

/* Fill is the primary signal and it is a shape, not a colour: solid means evidenced,
   hollow means not found, and the row reads the same in greyscale. The colours are the
   product's own semantic pair used for exactly what they mean, and the outline carries
   the same weight the fill does — a hairline here reaches 1.4:1 on ink, which makes an
   empty cell disappear and takes the comparison with it. */
function Row({ cells, name }: { cells: boolean[]; name: string }) {
  return (
    <ul aria-label={`Criteria evidenced for ${name}`} className="flex items-center gap-1.5">
      {criteria.map((criterion, index) => (
        <li
          key={criterion}
          aria-label={`${criterion}: ${cells[index] ? "evidenced" : "not found"}`}
          className={
            cells[index]
              ? "size-5 bg-evidenced-on-ink"
              : "size-5 border-2 border-open-on-ink bg-transparent"
          }
        />
      ))}
    </ul>
  );
}

export function NoScore() {
  return (
    <section className="bg-ink text-ink-inverse">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="rc-label text-ink-inverse/60">The part most tools get wrong</p>
        <h2 className="text-36 md:text-48 mt-4 font-semibold tracking-tight">There is no score.</h2>
        <p className="text-18 mt-6 max-w-[52ch] text-pretty text-ink-inverse/70">
          No match score. No percentage. No star rating. No ranked shortlist. You get five criteria
          in a fixed order, and for each one either a citation or a stated absence. Compare the
          shape of the row, then read the citations that matter to you.
        </p>

        <div className="mt-14 border-t border-rule-inverse">
          <div className="hidden gap-6 border-b border-rule-inverse py-4 md:grid md:grid-cols-[minmax(0,14rem)_auto_minmax(0,9rem)]">
            <p className="rc-label text-ink-inverse/60">Candidate</p>
            <p className="rc-label text-ink-inverse/60">Criteria, in fixed order</p>
            <p className="rc-label text-ink-inverse/60 md:text-right">Evidenced</p>
          </div>
          {candidates.map((candidate) => {
            const count = candidate.cells.filter(Boolean).length;
            return (
              <div
                key={candidate.name}
                className="flex flex-col gap-3 border-b border-rule-inverse py-6 md:grid md:grid-cols-[minmax(0,14rem)_auto_minmax(0,9rem)] md:items-center md:gap-6"
              >
                <p className="text-16">{candidate.name}</p>
                <Row cells={candidate.cells} name={candidate.name} />
                <p className="text-16 tabular text-ink-inverse/70 md:text-right">
                  {count} of 5 evidenced
                </p>
              </div>
            );
          })}
        </div>

        <dl className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-10">
          <div className="flex items-center gap-3">
            <span className="size-4 bg-evidenced-on-ink" />
            <dt className="rc-label text-ink-inverse/60">Filled</dt>
            <dd className="text-14 text-ink-inverse/70">evidenced, with a citation</dd>
          </div>
          <div className="flex items-center gap-3">
            <span className="size-4 border-2 border-open-on-ink" />
            <dt className="rc-label text-ink-inverse/60">Hollow</dt>
            <dd className="text-14 text-ink-inverse/70">not found in the application</dd>
          </div>
        </dl>

        <ol className="mt-12 flex flex-col gap-2 border-t border-rule-inverse pt-8 text-14 text-ink-inverse/60">
          {criteria.map((criterion, index) => (
            <li key={criterion} className="tabular">
              Cell {index + 1} · {criterion}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
