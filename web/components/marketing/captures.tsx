"use client";

import { useState } from "react";
import { Honeypot, SelectField, SubmitButton, TextField } from "@/components/fields";

type Status = "idle" | "pending" | "done" | "error";

async function submit(form: HTMLFormElement) {
  const response = await fetch("/api/capture", {
    method: "POST",
    body: new FormData(form),
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  };
  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ?? "The form did not send. Try again, or write to hello@recruitcopilot.com.",
    );
  }
}

function Panel({
  heading,
  intro,
  children,
}: {
  heading: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 py-10">
      <div className="flex flex-col gap-2">
        <h3 className="text-22 font-medium text-ink">{heading}</h3>
        <p className="text-16 text-ink-secondary max-w-prose">{intro}</p>
      </div>
      {children}
    </div>
  );
}

/* Form outcomes are not evidence, so they do not borrow --rc-evidenced or
   --rc-open. They are distinguished by rule style and by a written label. */
function Resolution({ status, message }: { status: Status; message: string }) {
  const done = status === "done";
  return (
    <div
      className={`bg-paper-sunk border-l-ink text-ink border-l-2 px-4 py-3 ${
        done ? "border-solid" : "border-dashed"
      }`}
      role={done ? "status" : "alert"}
    >
      <p className="rc-label text-ink-secondary mb-1">{done ? "Recorded" : "Not sent"}</p>
      <p className="text-16">{message}</p>
    </div>
  );
}

export function CourseCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("pending");
    try {
      await submit(form);
      setStatus("done");
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "The form did not send.");
      setStatus("error");
    }
  }

  return (
    <Panel
      heading="Take the course"
      intro="Seven modules, each shipping a working build and a number it moves. Tell us where to send it when enrolment opens."
    >
      {status === "done" ? (
        <Resolution
          status="done"
          message="You will hear from us when enrolment opens. Nothing else gets sent to that address."
        />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="list" value="course" />
          <Honeypot />
          <TextField
            id="course-email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
          />
          {status === "error" ? <Resolution status="error" message={error} /> : null}
          <div>
            <SubmitButton pending={status === "pending"}>
              Notify me when the course opens
            </SubmitButton>
          </div>
        </form>
      )}
    </Panel>
  );
}

export function SoftwareCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("pending");
    try {
      await submit(form);
      setStatus("done");
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "The form did not send.");
      setStatus("error");
    }
  }

  return (
    <Panel
      heading="Buy this one instead"
      intro="Design partner seats open before the build is finished, at the prices published above."
    >
      {status === "done" ? (
        <Resolution
          status="done"
          message="We will write before design partner seats open, at the published prices."
        />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="list" value="software" />
          <Honeypot />
          <TextField
            id="software-email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
          />
          <SelectField
            id="software-agency-size"
            name="agency_size"
            label="Agency size"
            defaultValue="1"
            options={[
              { value: "1", label: "1" },
              { value: "2-5", label: "2–5" },
              { value: "6-10", label: "6–10" },
              { value: "10+", label: "More than 10" },
            ]}
          />
          <TextField
            id="software-current-ats"
            name="current_ats"
            label="Current ATS"
            hint="optional"
            placeholder="Loxo, Bullhorn, spreadsheets…"
            autoComplete="off"
          />
          {status === "error" ? <Resolution status="error" message={error} /> : null}
          <div>
            <SubmitButton pending={status === "pending"}>Register interest</SubmitButton>
          </div>
        </form>
      )}
    </Panel>
  );
}
