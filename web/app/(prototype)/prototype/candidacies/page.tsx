import { Suspense } from "react";
import { Cockpit } from "../../cockpit";
import { CandidaciesScreen } from "./candidacies-screen";

export const dynamic = "force-static";

export default function CandidaciesPage() {
  return (
    <Suspense fallback={null}>
      <Cockpit view="Candidacies">
        <CandidaciesScreen />
      </Cockpit>
    </Suspense>
  );
}
