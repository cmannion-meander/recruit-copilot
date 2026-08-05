import { DeskScreen } from "./desk-screen";

/* Static. Nothing on this route depends on a request, and the state it renders lives in
 * the browser. */
export const dynamic = "force-static";

export default function PrototypeDeskPage() {
  return <DeskScreen />;
}
