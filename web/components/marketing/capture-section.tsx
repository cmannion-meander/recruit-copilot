import { SoftwareCapture } from "@/components/marketing/captures";

export function CaptureSection() {
  return (
    <section id="captures" className="border-rule border-b">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:py-24 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-4">
          <p className="rc-label text-ink-muted">Early access</p>
          <h2 className="text-28 md:text-36 text-ink text-balance font-semibold tracking-tight">
            Two ways in. Pick the one you mean.
          </h2>
          <p className="text-18 text-ink-secondary max-w-[48ch] text-pretty">
            Follow the build and run your own agents, or take the finished product and get back to
            placing people. Which form you fill in is what tells us what to send you — there is no
            call to book either way.
          </p>
          <a
            href="#curriculum"
            className="border-rule-control text-ink hover:bg-paper-sunk focus-visible:outline-ink mt-2 w-fit rounded-rc border px-6 py-3 text-16 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            I would rather build my own
          </a>
        </div>

        <div className="border-rule-strong bg-paper-raised rounded-rc border px-6 md:px-8">
          <SoftwareCapture />
        </div>
      </div>
    </section>
  );
}
