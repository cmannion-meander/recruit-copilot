import { CourseCapture } from "@/components/marketing/captures";

type Module = {
  n: string;
  name: string;
  build: string;
  metric: string;
};

const modules: Module[] = [
  {
    n: "0",
    name: "The constraint map",
    build: "Map your funnel, find the constraint",
    metric: "Throughput — stops you optimising the wrong stage",
  },
  {
    n: "1",
    name: "Market mapping",
    build: "A market-map agent (conference scrapers, Scholar, LinkedIn)",
    metric: "Leads/week, coverage",
  },
  {
    n: "2",
    name: "Tier definition",
    build: "Personas from your own hires, both traps, and the four-fifths gate",
    metric: "Lead quality score",
  },
  {
    n: "3",
    name: "Sourcing",
    build: "The sourcing agent, tiered output",
    metric: "Quality score ≥ 75, % to outreach",
  },
  {
    n: "4",
    name: "Screening & assessment",
    build: "Structured evidence for recruiter and hiring-manager screens",
    metric: "% reaching onsite, HM NPS",
  },
  {
    n: "5",
    name: "Coordination",
    build: "The scheduling constraint",
    metric: "Scheduling cycle time, candidate experience",
  },
  {
    n: "6",
    name: "Measurement",
    build: "The metric set, before and after",
    metric: "All of the above, made visible",
  },
];

export function Curriculum() {
  return (
    <section id="curriculum" className="border-rule border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="flex flex-col gap-4">
          <p className="rc-label text-ink-muted">The course</p>
          <h2 className="text-28 md:text-36 text-ink text-balance font-semibold tracking-tight">
            Build your own
          </h2>
          <p className="text-18 text-ink-secondary max-w-[62ch] text-pretty">
            Seven modules, each one shipping a working piece of an AI-forward recruiting process —
            and each one tied to a number it is supposed to move. You start by finding your
            constraint, so you do not spend six weeks automating a stage that was never the problem.
          </p>
        </div>

        <table className="border-ink mt-12 w-full border-t text-left">
          <caption className="sr-only">
            Module map: the build shipped in each module and the metric it moves
          </caption>
          <thead className="hidden md:table-header-group">
            <tr className="border-rule border-b">
              <th scope="col" className="rc-label text-ink-muted w-14 py-3 pr-4">
                #
              </th>
              <th scope="col" className="rc-label text-ink-muted w-1/4 py-3 pr-6">
                Module
              </th>
              <th scope="col" className="rc-label text-ink-muted py-3 pr-6">
                The build
              </th>
              <th scope="col" className="rc-label text-ink-muted w-1/4 py-3">
                The metric it moves
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {modules.map((module) => (
              <tr key={module.n} className="border-rule block border-b py-5 md:table-row md:py-0">
                <td className="text-16 text-ink-muted tabular block font-mono md:table-cell md:w-14 md:py-5 md:pr-4 md:align-baseline">
                  {module.n}
                </td>
                <td className="text-18 md:text-16 text-ink block font-medium md:table-cell md:py-5 md:pr-6 md:align-baseline">
                  {module.name}
                </td>
                <td className="text-16 text-ink-secondary mt-1 block md:table-cell md:py-5 md:pr-6 md:align-baseline">
                  {module.build}
                </td>
                <td className="mt-2 block md:table-cell md:py-5 md:align-baseline">
                  <span className="rc-label text-ink-muted mb-1 block md:hidden">Moves</span>
                  <span className="text-14 text-ink-secondary tabular font-mono">
                    {module.metric}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-rule-strong bg-paper-sunk mt-14 grid gap-10 rounded-rc border p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-22 text-ink font-medium">What you end up with</h3>
            <ul className="flex flex-col gap-3">
              {[
                "Your own agents, running on your own keys, against your own market.",
                "A before-and-after number for every module you finish.",
                "The four-fifths gate applied to your tiers, so the process survives scrutiny.",
              ].map((line) => (
                <li
                  key={line}
                  className="border-rule text-16 text-ink-secondary border-l-2 pl-4 text-pretty"
                >
                  {line}
                </li>
              ))}
            </ul>
            <p className="text-14 text-ink-muted mt-2 text-pretty">
              The build series is free and publishes as each slice lands. The course is the longer
              version, with the market mapping and sourcing agents you would run yourself.
            </p>
          </div>

          <div className="border-rule bg-paper-raised rounded-rc border px-6 md:px-8">
            <CourseCapture />
          </div>
        </div>
      </div>
    </section>
  );
}
