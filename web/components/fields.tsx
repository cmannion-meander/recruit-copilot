"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* The one glyph on the page. Drawn here rather than pulled from an icon set: a single
   chevron does not justify a dependency, and an icon set is where sparkles get in. */
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      className={className}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

/* --rc-evidenced and --rc-open are semantic; a focus ring and a validation
   error are neither, so both are drawn in ink. Invalid controls carry a
   dashed edge as well as the border weight, and a written message. */
const controlBase =
  "w-full rounded-rc border bg-paper-raised px-3 py-2.5 text-16 text-ink placeholder:text-ink-muted " +
  "focus:border-ink focus:border-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ink";

const controlInvalid = "border-ink border-2 border-dashed";

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-14 font-medium text-ink">
        {label}
        {hint ? <span className="text-ink-muted font-normal"> — {hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-14 text-ink font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlBase, error ? controlInvalid : "border-rule-control", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  hint,
  error,
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            controlBase,
            "appearance-none pr-10",
            error ? controlInvalid : "border-rule-control",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="text-ink-secondary pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
      </div>
    </FieldShell>
  );
}

export function Honeypot() {
  return (
    <div className="rc-offscreen" aria-hidden="true">
      <label htmlFor="company_website">Company website</label>
      <input
        id="company_website"
        name="company_website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

export function SubmitButton({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-rc bg-ink px-5 py-2.5 text-16 font-medium text-ink-inverse transition-colors hover:bg-ink-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
    >
      {pending ? "Sending…" : children}
    </button>
  );
}
