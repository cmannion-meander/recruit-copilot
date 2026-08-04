import type { Metadata } from "next";
import { BuildInPublic } from "@/components/marketing/build-in-public";
import { CaptureSection } from "@/components/marketing/capture-section";
import { Curriculum } from "@/components/marketing/curriculum";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { NoScore } from "@/components/marketing/no-score";
import { Pricing } from "@/components/marketing/pricing";

/* Prerendered at build, served from the filesystem. Per ADR 0007 this is what keeps
 * the page that sells the product independent of the product: no request-time call to
 * Django, Postgres or a model provider can slow it down or take it off the air. If a
 * marketing route ever needs request-time data, reconsider here rather than relaxing it. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <NoScore />
      <BuildInPublic />
      <Curriculum />
      <Pricing />
      <CaptureSection />
    </>
  );
}
