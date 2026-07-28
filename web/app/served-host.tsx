"use client";

import { useEffect, useState } from "react";

/** The hostname the browser actually resolved. Read on the client so the page
 * stays statically rendered — during a DNS cutover this is the value that tells
 * you whether you reached the custom domain or the default App Service host. */
export function ServedHost() {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    setHost(window.location.host);
  }, []);

  return <span className="tabular">{host ?? "—"}</span>;
}
