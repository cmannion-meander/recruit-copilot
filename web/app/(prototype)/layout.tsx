import type { Metadata } from "next";
import { PrototypeProvider } from "./_state/provider";
import { PrototypeBar } from "./prototype-bar";

/* Reachable by direct URL only. Nothing links here — not the marketing site, not /app —
 * and app/robots.ts disallows the path. That is obscurity, not access control, which is
 * exactly why no real candidate data goes in the fixtures.
 *
 * Metadata inherits, so this one declaration covers every route in the group. */
export const metadata: Metadata = {
  title: "Prototype",
  robots: { index: false, follow: false },
};

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrototypeProvider>
      <div className="bg-paper flex min-h-screen flex-col">
        <PrototypeBar />
        <main className="flex-1">{children}</main>
      </div>
    </PrototypeProvider>
  );
}
