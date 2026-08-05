"use client";

/* The bar that says what this is. Present on every screen in the group, and it is not
 * dismissible — a prototype that can be made to look like a product is a prototype that
 * will eventually be shown as one.
 *
 * Presentational, and deliberately NOT in web/components/: it names the prototype, so
 * it dies with it. See docs/decisions/0010.
 */
import Link from "next/link";
import { usePrototype } from "./_state/provider";

export function PrototypeBar() {
  const { dispatch } = usePrototype();

  return (
    <div className="bg-ink text-ink-inverse">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <p className="rc-label text-ink-inverse">PROTOTYPE · SYNTHETIC DATA · NOT A PRODUCT</p>

        <Link
          href="/prototype"
          className="rc-label text-ink-inverse/70 hover:text-ink-inverse focus-visible:outline-rule-inverse transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          The desk
        </Link>

        <button
          type="button"
          onClick={() => dispatch({ type: "reset" })}
          className="rc-label text-ink-inverse focus-visible:outline-rule-inverse border-rule-inverse ml-auto border px-3 py-1.5 transition-colors hover:bg-ink-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Reset
        </button>
      </div>
      <div className="border-rule-inverse mx-auto max-w-6xl border-t px-6 py-2">
        <p className="text-12 text-ink-inverse/70 max-w-[92ch]">
          Every person, company and document below is invented. Nothing is stored: a reload or a
          Reset returns to the same starting state.
        </p>
      </div>
    </div>
  );
}
