"use client";

/* Screen 8 — rejection.
 *
 * A reason code from a fixed enum AND non-empty written text. Both, or nothing is
 * written — invariant 4, a CHECK constraint in the real schema.
 *
 * The refusal names which of the two is missing rather than saying "fill in the form",
 * because the person pressing the button already believes they have filled in the form.
 */
import { useState } from "react";
import { Control } from "@/components/control";
import { SelectField } from "@/components/fields";
import { Refusal } from "@/components/refusal";
import { formatDate } from "../../../_fixtures/clock";
import type { Candidacy, Decision, ReasonCode } from "../../../_fixtures/types";
import { usePrototype } from "../../../_state/provider";
import { REASON_LABEL } from "../../../_state/reducer";
import { type Refusal as RefusalShape, refuseRejection } from "../../../_state/refusals";
import { userById } from "../../../_state/selectors";

const CODES: { value: ReasonCode | ""; label: string }[] = [
  { value: "", label: "No code selected" },
  { value: "below_criteria", label: "Below criteria" },
  { value: "salary_expectation", label: "Salary expectation" },
  { value: "location", label: "Location" },
  { value: "withdrew", label: "Withdrew" },
  { value: "counter_offer", label: "Counter offer accepted" },
  { value: "client_declined", label: "Client declined" },
];

export function RejectionPanel({
  candidacy,
  decision,
}: {
  candidacy: Candidacy;
  decision: Decision | undefined;
}) {
  const { state, dispatch } = usePrototype();
  const [code, setCode] = useState<ReasonCode | "">("");
  const [text, setText] = useState("");
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  if (decision) {
    return (
      <div className="border-rule max-w-[62ch] border-l-2 border-l-ink pl-5">
        <p className="rc-label text-ink-muted">Rejected · {REASON_LABEL[decision.reason_code]}</p>
        <p className="text-16 text-ink mt-3">{decision.reason_text}</p>
        <p className="text-14 text-ink-muted mt-3 tabular">
          {userById(state, decision.decided_by)?.name} · {formatDate(decision.decided_at)}
        </p>
        <p className="text-14 text-ink-muted mt-5">
          The decision is on the record and cannot be edited from here. What was said to the
          candidate is what the candidate can read.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[62ch]">
      <SelectField
        id={`reject-code-${candidacy.id}`}
        label="Reason code"
        options={CODES}
        value={code}
        onChange={(event) => setCode(event.target.value as ReasonCode | "")}
      />

      <div className="mt-5">
        <label htmlFor={`reject-text-${candidacy.id}`} className="text-14 text-ink font-medium">
          What you told them
          <span className="text-ink-muted font-normal">
            {" "}
            — this goes in the record and to the candidate
          </span>
        </label>
        <textarea
          id={`reject-text-${candidacy.id}`}
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="border-rule-control bg-paper-raised text-16 text-ink focus:border-ink focus:outline-ink rounded-rc mt-1.5 w-full border px-3 py-2.5 focus:border-2 focus:outline focus:outline-2 focus:outline-offset-2"
        />
      </div>

      <div className="mt-5">
        <Control
          onClick={() => {
            const refused = refuseRejection(code, text);
            setRefusal(refused);
            if (refused || code === "") return;
            dispatch({
              type: "reject_candidacy",
              candidacy_id: candidacy.id,
              reason_code: code,
              reason_text: text,
            });
          }}
        >
          Reject this candidacy
        </Control>
      </div>

      {refusal ? (
        <Refusal
          className="mt-6"
          requirement={refusal.requirement}
          reason={refusal.reason}
          action={refusal.action}
          footnote={`Invariant ${refusal.invariant} · no free-text-only rejection`}
        />
      ) : null}
    </div>
  );
}
