import { candidacies } from "../../../../_fixtures/candidacies";
import { ReviewScreen } from "./review-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return candidacies.map((candidacy) => ({ candidacyId: candidacy.id }));
}

export default async function ReviewPage({ params }: { params: Promise<{ candidacyId: string }> }) {
  const { candidacyId } = await params;
  return <ReviewScreen candidacyId={candidacyId} />;
}
