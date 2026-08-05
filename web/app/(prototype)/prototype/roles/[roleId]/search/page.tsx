import { roles } from "../../../../_fixtures/roles";
import { SearchScreen } from "./search-screen";

export const dynamic = "force-static";

export function generateStaticParams() {
  return roles.map((role) => ({ roleId: role.id }));
}

export default async function SearchPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <SearchScreen roleId={roleId} />;
}
