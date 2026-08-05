import { submissionRecords } from "../../../_fixtures/submissions";
import { CandidateScreen } from "./candidate-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return submissionRecords.map((record) => ({ token: record.snapshot.candidate_token }));
}

export default async function CandidatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CandidateScreen token={token} />;
}
