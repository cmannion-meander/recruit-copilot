const slices: [string, string][] = [
  ["Skeleton", "Repository, local Postgres, this page in production"],
  ["Org, user, auth", "Multi-tenant from the first commit, with tests that assert failure"],
  ["The Brief", "Every ATS starts with a job. This one will not open one without criteria."],
  ["Person and Sighting", "No resolving source, no record — a database refusal, not a request"],
  ["The model boundary", "Evaluation runs inside the product, on the customer's key"],
  ["Candidacy", "The pipeline, and the moment a person becomes a candidate"],
  ["Documents", "Two-column PDFs, tables, scans, and DOCX from 2011"],
  ["Review", "Every finding cited against pinned criteria"],
  ["Crosscheck", "Integrity signals, traceable to artifacts"],
  ["Submission Record", "The artifact that leaves the building"],
];

export function BuildInPublic() {
  return (
    <section id="the-build" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <p className="rc-label text-ink-muted">Slice by slice, on camera</p>
        <h2 className="text-28 md:text-36 text-ink mt-4 text-balance font-semibold tracking-tight">
          The build, in public
        </h2>
        <p className="text-18 text-ink-secondary mt-6 max-w-[62ch] text-pretty">
          The product is being built on camera, slice by slice, from an empty repository. Nothing is
          skipped and nothing is pre-baked: the schema, the tests, the model boundary and the
          failures all happen in view. Someone following along can build their own; someone who
          would rather not can buy this one.
        </p>

        {/* Deliberately not a table: the module map below is the page's one
            tabular element, and two in a row would flatten both. */}
        <ul className="mt-12 grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {slices.map(([name, claim]) => (
            <li
              key={name}
              className="bg-paper-raised border-rule flex flex-col gap-2 rounded-rc border p-5"
            >
              <p className="text-16 text-ink font-medium">{name}</p>
              <p className="text-14 text-ink-secondary text-pretty leading-relaxed">{claim}</p>
            </li>
          ))}
        </ul>

        <p className="text-16 text-ink-secondary mt-6">
          Episodes publish as each slice lands. Module 0 of the course starts where this leaves off.
        </p>
      </div>
    </section>
  );
}
