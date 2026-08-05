import { candidacies } from "../../../_fixtures/candidacies";
import { CandidacyScreen } from "./candidacy-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return candidacies.map((candidacy) => ({ candidacyId: candidacy.id }));
}

export default async function CandidacyPage({
  params,
}: {
  params: Promise<{ candidacyId: string }>;
}) {
  const { candidacyId } = await params;
  return <CandidacyScreen candidacyId={candidacyId} />;
}
