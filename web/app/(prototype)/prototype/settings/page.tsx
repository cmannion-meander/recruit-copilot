import { Suspense } from "react";
import { Cockpit } from "../../cockpit";

export const dynamic = "force-static";

/* There is no source for a settings section in the repository, and nothing is
 * invented for one. */
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <Cockpit view="Settings">
        <h1 className="text-22 text-ink font-medium tracking-[-.01em]">Settings</h1>
        <p className="text-16 text-ink-secondary mt-3">Nothing is open yet.</p>
      </Cockpit>
    </Suspense>
  );
}
