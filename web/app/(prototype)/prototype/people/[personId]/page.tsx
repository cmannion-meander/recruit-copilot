import { people } from "../../../_fixtures/people";
import { PersonScreen } from "./person-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return people.map((person) => ({ personId: person.id }));
}

export default async function PersonPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  return <PersonScreen personId={personId} />;
}
