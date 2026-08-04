import type { Metadata } from "next";

/* Prerendered at build. See ADR 0007. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "What it does not do",
  description:
    "A list of the decisions Recruit Copilot leaves to you: it does not rank candidates, decide who to advance, verify claims an application never made, or read video.",
  alternates: { canonical: "/not" },
};

const refusals: { claim: string; reason: string }[] = [
  {
    claim: "It does not rank candidates.",
    reason:
      "A ranking hides the reason for the order. You get the same criteria in the same order for every applicant, and the citations underneath.",
  },
  {
    claim: "It does not decide who to advance.",
    reason: "The decision, and the accountability for it, stays with you.",
  },
  {
    claim: "It does not verify a claim an application never made.",
    reason:
      "Where a criterion has no supporting passage, the record says so and stops. Absence is reported, not inferred.",
  },
  {
    claim: "It does not read video, analyse faces or score voices.",
    reason: "No such input is accepted, so no such output exists.",
  },
  {
    claim: "It does not produce a match percentage, a grade, or a star rating.",
    reason: "A single figure cannot be handed to a client as proof of anything.",
  },
  {
    claim: "It does not train on your candidates or your clients.",
    reason: "Evaluation runs inside the product, on your key, against your own data only.",
  },
];

export default function NotPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <p className="rc-label text-ink-muted">Scope</p>
      <h1 className="text-36 mt-5 font-semibold tracking-tight text-ink text-balance">
        What this product does not do
      </h1>
      <p className="text-18 text-ink-secondary mt-6 text-pretty">
        The list matters as much as the feature list. Each line below is a refusal we intend to
        keep.
      </p>

      <dl className="mt-14 border-t border-ink">
        {refusals.map((item) => (
          <div key={item.claim} className="flex flex-col gap-2 border-b border-rule py-7">
            <dt className="text-18 font-medium text-ink">{item.claim}</dt>
            <dd className="text-16 text-ink-secondary text-pretty">{item.reason}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
