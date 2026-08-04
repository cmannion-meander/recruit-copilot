import Link from "next/link";

const nav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#curriculum", label: "Build your own" },
  { href: "/#the-build", label: "The build" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/not", label: "What it does not do" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <header className="border-rule bg-paper/85 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link
            href="/"
            className="focus-visible:outline-ink text-16 text-ink shrink-0 font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Recruit&nbsp;Copilot
          </Link>

          <nav aria-label="Main" className="hidden flex-1 items-center gap-7 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-14 text-ink-secondary hover:text-ink focus-visible:outline-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <Link
              href="/#captures"
              className="bg-ink text-ink-inverse hover:bg-ink-strong focus-visible:outline-ink rounded-rc px-4 py-2 text-14 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Get early access
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-rule bg-paper-sunk border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="text-16 text-ink font-semibold tracking-tight">Recruit Copilot</p>
            <p className="text-14 text-ink-secondary max-w-[38ch]">
              Applicant tracking for recruiting agencies of one to ten people. Every finding cited
              to the passage that produced it.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="rc-label text-ink-muted">Product</p>
            {nav.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-14 text-ink-secondary hover:text-ink w-fit transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="rc-label text-ink-muted">Straight answers</p>
            <Link
              href="/not"
              className="text-14 text-ink-secondary hover:text-ink w-fit transition-colors"
            >
              What it does not do
            </Link>
            <a
              href="mailto:hello@recruitcopilot.com"
              className="text-14 text-ink-secondary hover:text-ink w-fit transition-colors"
            >
              hello@recruitcopilot.com
            </a>
          </div>
        </div>
        <div className="border-rule border-t">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <p className="text-12 text-ink-muted tabular">
              © 2026 Recruit Copilot · Built in public, slice by slice
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
