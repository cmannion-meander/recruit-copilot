import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { PAPER } from "@/lib/brand";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

/* Serif is loaded for one purpose: quoted candidate passages. It is never a heading. */
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-serif",
  display: "swap",
});

/* No hardcoded hosts — the canonical origin comes from the environment, and when it
 * is unset (local dev, or a build before the hostnames are bound) relative URLs are
 * used rather than a guessed one. See ADR 0005. */
const canonicalHost = process.env.CANONICAL_HOST;

export const metadata: Metadata = {
  ...(canonicalHost ? { metadataBase: new URL(`https://${canonicalHost}`) } : {}),
  title: {
    default: "Recruit Copilot — Proof you can hand a client",
    template: "%s — Recruit Copilot",
  },
  description:
    "An applicant tracking system for permanent-placement recruiting agencies of one to ten people. Every finding cited against the criteria your client asked for, in one Submission Record under your own logo.",
  /* No `alternates` here. Metadata inherits, so a canonical set on the root layout is
   * claimed by every page — /not would declare itself a duplicate of / and drop out of
   * the index. Each route states its own. */
};

/* Icons come from app/icon.svg and app/apple-icon.png by file convention.
 * The palette is light only, so there is no dark variant to declare. */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: PAPER,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${plexSans.variable} ${plexMono.variable} ${plexSerif.variable}`}
    >
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
