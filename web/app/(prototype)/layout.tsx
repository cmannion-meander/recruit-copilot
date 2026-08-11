import type { Metadata } from "next";
import { PrototypeProvider } from "./_state/provider";
import { CockpitQueryProvider } from "./cockpit";
import { PrototypeBar } from "./prototype-bar";

/* Reachable by direct URL only. Nothing links here — not the marketing site, not /app —
 * and app/robots.ts disallows the path. That is obscurity, not access control, which is
 * exactly why no real candidate data goes in the fixtures.
 *
 * Metadata inherits, so this one declaration covers every route in the group.
 *
 * The column is h-screen so the cockpit shell (cockpit.tsx) can fill what the bar
 * leaves and manage its own scrolling; deeper screens that outgrow the viewport
 * scroll inside <main> as before. */
export const metadata: Metadata = {
  title: "Prototype",
  robots: { index: false, follow: false },
};

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrototypeProvider>
      <CockpitQueryProvider>
        <div className="bg-paper flex h-screen flex-col">
          <PrototypeBar />
          <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
        </div>
      </CockpitQueryProvider>
    </PrototypeProvider>
  );
}
