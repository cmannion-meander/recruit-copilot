"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Buttons.
 *
 * There is no `disabled` variant here, and that is the design. A disabled control
 * teaches nothing: it declines silently, gives no reason, and leaves the reader to
 * guess which of five things is wrong. Every control in this product stays live and
 * answers when it is pressed — the answer is a refusal with a reason and a next action.
 *
 * `disabled` is still accepted for the one honest use, a form mid-submit, where the
 * control is not refusing but working.
 */
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
};

const BASE =
  "rounded-rc px-4 py-2.5 text-16 font-medium transition-colors focus-visible:outline " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const VARIANT = {
  primary: "bg-ink text-ink-inverse hover:bg-ink-strong",
  secondary: "border border-rule-control bg-paper-raised text-ink hover:bg-paper-sunk",
  quiet: "px-0 py-0 text-ink underline decoration-1 underline-offset-4 hover:text-ink-secondary",
} as const;

export function Control({ children, variant = "primary", className, ...props }: Props) {
  return (
    <button type="button" className={cn(BASE, VARIANT[variant], className)} {...props}>
      {children}
    </button>
  );
}

/** The small mono control that sits on a provenance line or inside a table row. */
export function InlineControl({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "text-ink focus-visible:outline-ink font-mono text-12 underline decoration-1 underline-offset-4 transition-colors hover:text-ink-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
