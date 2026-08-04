import { EvidenceCitation } from "@/components/evidence-citation";

const facts: [string, string][] = [
  ["5", "criteria, in the order your client wrote them"],
  ["0", "scores, percentages, or ranked shortlists"],
  ["1", "document that leaves the building"],
];

export function Hero() {
  return (
    <section className="border-rule border-b">
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-20">
        <div className="flex flex-col gap-7">
          <p className="border-rule-strong bg-paper-sunk rc-label text-ink w-fit rounded-rc border px-3 py-1.5">
            Applicant tracking · agencies of 1–10
          </p>

          <h1 className="text-36 md:text-48 text-ink text-balance font-semibold tracking-tight">
            Proof you can hand a client.
          </h1>

          <p className="text-18 text-ink-secondary max-w-[46ch] text-pretty">
            Recruit Copilot reads each application against the criteria your client actually asked
            for, and returns one Submission Record — every finding beside the passage it came from,
            under your own logo.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#captures"
              className="bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink rounded-rc px-6 py-3 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Get early access
            </a>
            <a
              href="#curriculum"
              className="border-rule-control text-ink hover:bg-paper-sunk focus-visible:outline-ink rounded-rc border px-6 py-3 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Build your own instead
            </a>
          </div>

          <dl className="border-rule mt-4 grid gap-6 border-t pt-8 sm:grid-cols-3">
            {facts.map(([value, label]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-28 text-ink tabular font-semibold">{value}</dt>
                <dd className="text-14 text-ink-secondary text-pretty">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product artifact: the thing the customer actually receives. */}
        <figure className="border-rule-strong bg-paper-raised rounded-rc border">
          <div className="border-rule flex items-center justify-between gap-4 border-b px-4 py-3">
            <p className="rc-label text-ink">Submission Record</p>
            <p className="text-12 text-ink-muted tabular font-mono">Sarah Whitfield · draft</p>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <p className="rc-label text-ink-muted">Criterion 2 of 5</p>
            <EvidenceCitation
              state="evidenced"
              criterion="Five years in-house payroll for a UK entity of 200+ staff"
              quote="I ran monthly payroll for 240 UK employees at Halliday Group for six years, including RTI submissions and year-end reporting."
              provenance="CV · page 1, paragraph 3 · uploaded 12 Jun 2026"
            />
            <EvidenceCitation state="not-found" criterion="CIPP qualification" />
          </div>

          <figcaption className="border-rule bg-paper-sunk text-14 text-ink-secondary border-t px-4 py-3">
            Two criteria of five shown. Nothing here is inferred — a finding either quotes the
            application or says it was not found.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
