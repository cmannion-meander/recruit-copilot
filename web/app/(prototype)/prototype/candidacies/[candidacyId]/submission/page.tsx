import { candidacies } from "../../../../_fixtures/candidacies";
import { SubmissionScreen } from "./submission-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return candidacies.map((candidacy) => ({ candidacyId: candidacy.id }));
}

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ candidacyId: string }>;
}) {
  const { candidacyId } = await params;
  return <SubmissionScreen candidacyId={candidacyId} />;
}
