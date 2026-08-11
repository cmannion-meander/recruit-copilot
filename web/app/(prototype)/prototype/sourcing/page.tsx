import { Suspense } from "react";
import { Cockpit } from "../../cockpit";
import { SourcingScreen } from "./sourcing-screen";

export const dynamic = "force-static";

export default function SourcingPage() {
  return (
    <Suspense fallback={null}>
      <Cockpit view="Sourcing runs">
        <SourcingScreen />
      </Cockpit>
    </Suspense>
  );
}
