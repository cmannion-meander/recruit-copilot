import { roles } from "../../../_fixtures/roles";
import { RoleScreen } from "./role-screen";

export const dynamic = "force-static";

/* Generated from the fixtures, which is also the proof that the fixture set is closed:
 * if a role exists, it has a page, and if it has a page, it came from here.
 *
 * dynamicParams is left at its default. The prototype can create a candidacy at
 * runtime, and a record you have just made refusing to open is a worse lie than a route
 * that was not pre-rendered. */
export function generateStaticParams() {
  return roles.map((role) => ({ roleId: role.id }));
}

export default async function RolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <RoleScreen roleId={roleId} />;
}
