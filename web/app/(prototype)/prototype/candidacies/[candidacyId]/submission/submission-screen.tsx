"use client";

/* Screen 9 — the Submission Record.
 *
 * Creation refuses while any Crosscheck signal on the candidacy is unresolved, and the
 * refusal names the signals rather than counting them — invariant 5.
 *
 * Once created there is no edit control anywhere on it. Not a disabled one, not a
 * "request a change" link that opens a form: none. Invariant 8 revokes UPDATE and DELETE
 * on submission_record and on evidence at the permission level, so an interface that
 * offered an edit would be describing a system that does not exist.
 *
 * The document itself is components/submission-record.tsx, which takes a frozen snapshot
 * and no callbacks. It carries the agency's wordmark and nothing of ours.
 */
import Link from "next/link";
import { useState } from "react";
import { Control } from "@/components/control";
import { Refusal } from "@/components/refusal";
import { SubmissionRecordDocument } from "@/components/submission-record";
import { formatDate } from "../../../../_fixtures/clock";
import { usePrototype } from "../../../../_state/provider";
import { type Refusal as RefusalShape, refuseSubmission } from "../../../../_state/refusals";
import {
  briefVersionById,
  candidacyById,
  personById,
  roleById,
  submissionFor,
  userById,
} from "../../../../_state/selectors";
import { Crumbs, Screen, ScreenTitle, Section } from "../../../../screen";

export function SubmissionScreen({ candidacyId }: { candidacyId: string }) {
  const { state, dispatch } = usePrototype();
  const [refusal, setRefusal] = useState<RefusalShape | null>(null);

  const candidacy = candidacyById(state, candidacyId);
  if (!candidacy) {
    return (
      <Screen>
        <p className="text-16 text-ink">No candidacy with that identifier.</p>
      </Screen>
    );
  }

  const person = personById(state, candidacy.person_id);
  const role = roleById(state, candidacy.role_id);
  const record = submissionFor(state, candidacy.id);
  const version = briefVersionById(state, candidacy.brief_version_id);

  const trail = [
    { href: "/prototype", label: "The desk" },
    { href: `/prototype/roles/${candidacy.role_id}`, label: role?.title ?? "Role" },
    { href: `/prototype/candidacies/${candidacy.id}`, label: person?.full_name ?? "" },
    { label: "Submission Record" },
  ];

  if (record) {
    const signer = userById(state, record.signed_off_by);
    return (
      <Screen>
        <Crumbs trail={trail} />

        <div className="mt-8">
          <SubmissionRecordDocument
            wordmark={state.organization.wordmark}
            reference={record.reference}
            clientName={record.snapshot.client_name}
            roleTitle={record.snapshot.role_title}
            personName={record.snapshot.person_name}
            personHeadline={record.snapshot.person_headline}
            briefVersion={record.snapshot.brief_version}
            briefAgreedOn={version ? formatDate(version.created_at) : ""}
            signedOffBy={signer?.name ?? ""}
            signedOffTitle={signer?.title ?? ""}
            signedOffOn={formatDate(record.signed_off_at)}
            lines={record.snapshot.lines.map((line) => ({
              position: line.position,
              criterionText: line.criterion_text,
              status: line.status,
              quote: line.quote,
              provenance: line.provenance,
            }))}
          />
        </div>

        <Section
          title="About this record"
          note="It renders from the snapshot taken when it was signed off, not from the rows on the candidacy. If The Brief moves to version 3 tomorrow, this document still says what it said when it was sent."
        >
          <div className="max-w-[62ch]">
            <p className="text-16 text-ink-secondary">
              There is no edit control on this page. Not a greyed-out one — none at all. The
              database revokes UPDATE and DELETE on this record and on every quoted passage in it,
              so a control offering an edit would be describing a system that does not exist.
            </p>
            <Link
              href={`/prototype/candidate/${record.snapshot.candidate_token}`}
              className="text-16 text-ink focus-visible:outline-ink mt-5 inline-block underline decoration-1 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              What {record.snapshot.person_name} can read
            </Link>
          </div>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Crumbs trail={trail} />
      <ScreenTitle
        eyebrow={`${role?.title} · ${person?.full_name}`}
        title="Submission Record"
        lede="The artifact the whole product exists to produce. Once it is created it cannot be changed, so the checks happen before it exists rather than after."
      />

      <Section title="Create it">
        {refusal ? (
          <Refusal
            className="max-w-3xl"
            requirement={refusal.requirement}
            reason={refusal.reason}
            action={refusal.action}
            items={refusal.items}
            footnote={`Invariant ${refusal.invariant} · verification before submission`}
          >
            <Link
              href={`/prototype/candidacies/${candidacy.id}`}
              className="rounded-rc bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open the Crosscheck signals
            </Link>
            <Control variant="secondary" onClick={() => setRefusal(null)}>
              Not yet
            </Control>
          </Refusal>
        ) : (
          <div className="max-w-[62ch]">
            <p className="text-16 text-ink-secondary">
              Creating the record freezes the pinned Brief version, every finding, and every quoted
              passage, and puts {userById(state, "usr_ruth_halloway")?.name}&rsquo;s name on it.
            </p>
            <Control
              className="mt-5"
              onClick={() => {
                const refused = refuseSubmission(state, candidacy.id);
                setRefusal(refused);
                if (refused) return;
                dispatch({ type: "create_submission", candidacy_id: candidacy.id });
              }}
            >
              Create the Submission Record
            </Control>
          </div>
        )}
      </Section>
    </Screen>
  );
}
