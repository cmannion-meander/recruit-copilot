import { candidacies } from "../../../../_fixtures/candidacies";
import { PlacementScreen } from "./placement-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return candidacies.map((candidacy) => ({ candidacyId: candidacy.id }));
}

export default async function PlacementPage({
  params,
}: {
  params: Promise<{ candidacyId: string }>;
}) {
  const { candidacyId } = await params;
  return <PlacementScreen candidacyId={candidacyId} />;
}
