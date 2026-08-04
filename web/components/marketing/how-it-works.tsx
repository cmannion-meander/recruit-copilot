const steps = [
  {
    name: "The Brief",
    body: "Write the criteria the client actually asked for, before applications arrive.",
  },
  {
    name: "Review",
    body: "Each application read against those criteria, every finding beside the sentence that produced it.",
  },
  {
    name: "Crosscheck",
    body: "Identity and consistency signals: contact details, timeline arithmetic, document metadata, duplicates across your own history.",
  },
  {
    name: "Submission Record",
    body: "All of it in one document carrying your logo.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-rule border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="flex flex-col gap-4">
          <p className="rc-label text-ink-muted">The path an application takes</p>
          <h2 className="text-28 md:text-36 text-ink text-balance font-semibold tracking-tight">
            Four stages, and nothing hidden between them
          </h2>
        </div>

        <ol className="border-rule mt-12 grid gap-px border-t md:grid-cols-4 md:border-t-0">
          {steps.map((step, index) => (
            <li
              key={step.name}
              className="border-rule border-b-ink md:border-b-0 md:border-t-ink flex flex-col gap-3 border-b py-7 md:border-t-2 md:pr-8"
            >
              <p className="text-12 text-ink-muted tabular font-mono">Stage {index + 1}</p>
              <h3 className="text-18 text-ink font-medium">{step.name}</h3>
              <p className="text-16 text-ink-secondary text-pretty">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
