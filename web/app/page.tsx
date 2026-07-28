import { ServedHost } from "./served-host";

/** Evaluated once, at build time, because this page is statically rendered.
 * Two loads showing different values means you fetched a new build; two loads
 * showing the same value during a cutover means you are still on a cache. */
const BUILD_TIME = new Date().toISOString().replace("T", " ").slice(0, 16);

export default function Page() {
  return (
    <main className="mx-auto max-w-[38rem] px-6 py-24">
      <h1 className="text-[2.25rem] font-semibold leading-tight tracking-[-0.01em]">
        Recruit Copilot
      </h1>

      <p className="mt-6 text-[1.125rem] leading-relaxed text-ink-secondary">
        Nothing is published here yet. This page confirms that the domain resolves to the production
        app and that the certificate is valid.
      </p>

      <hr className="mt-12 border-0 border-t border-rule" />

      <dl className="mt-6 grid grid-cols-[7rem_1fr] gap-x-6 gap-y-3 font-mono text-[0.875rem]">
        <dt className="text-ink-muted">Served from</dt>
        <dd>
          <ServedHost />
        </dd>

        <dt className="text-ink-muted">Build</dt>
        <dd className="tabular">{BUILD_TIME} UTC</dd>
      </dl>
    </main>
  );
}
