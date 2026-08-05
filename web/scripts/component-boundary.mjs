#!/usr/bin/env node
/* web/components/ may not import from web/app/.
 *
 * The rule exists because of the prototype at app/(prototype)/: everything under it —
 * fixtures, reducer, screens — is deleted when the real workspace lands, and everything
 * in components/ survives. A single import across that line turns a disposable artifact
 * into a dependency, and the deletion stops being possible without a rewrite.
 *
 * CLAUDE.md: prefer a database constraint over application validation, and application
 * validation over a code review convention. There is no database here, so this is the
 * mechanism. Same shape as scripts/tokens.mjs, and it runs in the same `pnpm lint`.
 *
 *   node scripts/component-boundary.mjs      verify, exit 1 on a crossing
 *
 * The direction is deliberately one-way. app/ importing from components/ is the whole
 * point of components/; components/ importing from app/ is the failure.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const COMPONENTS = resolve(here, "../components");
const APP = resolve(here, "../app");

/* Matches the specifier of any static import, dynamic import, or re-export. */
const SPECIFIER = /(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g;

function sourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry)) found.push(path);
  }
  return found;
}

/* A specifier crosses the line if it names the alias for app/, or if it is a relative
 * path that resolves inside app/. The literal names are checked as well so that a
 * crossing is reported by name even when the path spelling is unexpected. */
function crossing(specifier, fromFile) {
  if (specifier.startsWith("@/app/") || specifier === "@/app") return "@/app";
  for (const marker of ["(prototype)", "_fixtures", "_state"]) {
    if (specifier.includes(marker)) return marker;
  }
  if (specifier.startsWith(".")) {
    const resolved = resolve(dirname(fromFile), specifier);
    if (resolved === APP || resolved.startsWith(`${APP}/`)) return "app/";
  }
  return null;
}

const problems = [];

for (const file of sourceFiles(COMPONENTS)) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  for (const line of lines.keys()) {
    SPECIFIER.lastIndex = 0;
    let match = SPECIFIER.exec(lines[line]);
    while (match) {
      const marker = crossing(match[1], file);
      if (marker) {
        problems.push(
          `${relative(resolve(here, ".."), file)}:${line + 1} imports "${match[1]}".\n` +
            `  components/ may not import from ${marker}. Everything under app/(prototype)/ is\n` +
            "  deleted when the real workspace lands. Pass the value in as a prop instead.",
        );
      }
      match = SPECIFIER.exec(lines[line]);
    }
  }
}

if (problems.length === 0) {
  console.log("boundary: components/ imports nothing from app/");
  process.exit(0);
}

for (const problem of problems) console.error(`boundary: ${problem}`);
process.exit(1);
