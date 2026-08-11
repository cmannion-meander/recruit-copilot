import { Suspense } from "react";
import { Cockpit } from "../../cockpit";
import { RolesScreen } from "./roles-screen";

export const dynamic = "force-static";

export default function RolesPage() {
  return (
    <Suspense fallback={null}>
      <Cockpit view="Roles">
        <RolesScreen />
      </Cockpit>
    </Suspense>
  );
}
