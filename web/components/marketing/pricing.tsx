const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "no card",
    lines: ["100 applications / month", "Pre-flight", "Watermarked Submission Record"],
  },
  {
    name: "Solo",
    price: "$79",
    cadence: "per month",
    lines: ["500 applications / month", "1 seat", "Evidence-linked Review"],
  },
  {
    name: "Firm",
    price: "$299",
    cadence: "per month",
    lines: ["2,500 applications / month", "5 seats", "Unbranded Submission Records"],
  },
  {
    name: "Agency",
    price: "$699",
    cadence: "per month",
    lines: ["10,000 applications / month", "Unlimited seats", "Compliance audit pack"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <p className="rc-label text-ink-muted">Pricing</p>
        <h2 className="text-28 md:text-36 text-ink mt-4 text-balance font-semibold tracking-tight">
          Every price is on this page
        </h2>
        <p className="text-18 text-ink-secondary mt-6 max-w-[54ch] text-pretty">
          There is no quote to request and no call to book. Start on Free without a card.
        </p>

        <div className="mt-12 grid border-t border-ink md:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="flex flex-col gap-5 border-b border-rule px-0 py-8 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"
            >
              <h3 className="rc-label text-ink">{tier.name}</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-36 font-semibold tabular text-ink">{tier.price}</p>
                <p className="text-14 text-ink-muted">{tier.cadence}</p>
              </div>
              <ul className="flex flex-col gap-2">
                {tier.lines.map((line) => (
                  <li key={line} className="text-16 tabular text-ink-secondary">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 text-14 text-ink-muted">
          <p>Annual billing costs ten months rather than twelve.</p>
          <p>Identity verification checks are sold separately as credit packs, never bundled.</p>
        </div>
      </div>
    </section>
  );
}
