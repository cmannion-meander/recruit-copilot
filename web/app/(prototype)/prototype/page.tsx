import { Suspense } from "react";
import { Cockpit } from "../cockpit";
import { DeskScreen } from "./desk-screen";

/* Static. Nothing on this route depends on a request, and the state it renders lives in
 * the browser. The Suspense boundary is for useSearchParams in the shell. */
export const dynamic = "force-static";

export default function PrototypeDeskPage() {
  return (
    <Suspense fallback={null}>
      <Cockpit view="The Desk">
        <DeskScreen />
      </Cockpit>
    </Suspense>
  );
}
