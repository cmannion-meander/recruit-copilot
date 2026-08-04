import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

const nav = ["Briefs", "People", "Candidacies", "Documents", "Submission Records"];

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 border-r border-rule bg-paper-sunk md:flex md:flex-col">
        <div className="border-b border-rule px-5 py-5">
          <Link href="/" className="rc-label text-ink">
            Recruit Copilot
          </Link>
        </div>
        <nav aria-label="Sections" className="flex flex-col px-2 py-4">
          {nav.map((item) => (
            <span key={item} className="rounded-rc px-3 py-2 text-16 text-ink-secondary">
              {item}
            </span>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-rule px-6 py-4">
          <p className="rc-label text-ink-muted">Workspace</p>
          <p className="text-14 text-ink-muted">Signed in</p>
        </header>
        <div className="flex-1 px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
