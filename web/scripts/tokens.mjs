#!/usr/bin/env node
/* Keeps web/app/tokens.css identical to brand/tokens.css.
 *
 * The duplication is forced: App Service deploys the web/ subtree on its own
 * (.vscode/settings.json, appService.deploySubpath), so brand/ is not present at
 * build time in production and an `@import "../../brand/tokens.css"` would work
 * locally and fail there. A copy plus a check beats a convention — see CLAUDE.md
 * on preferring mechanism over code review.
 *
 *   node scripts/tokens.mjs           verify, exit 1 on drift
 *   node scripts/tokens.mjs --write   rewrite the copy from the source
 *
 * When brand/ is absent the source cannot be consulted, so verification is
 * skipped rather than failed. That is the deployed build, where there is nothing
 * to drift from.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, "../../brand/tokens.css");
const COPY = resolve(here, "../app/tokens.css");
const MIRROR = resolve(here, "../lib/brand.ts");

/* The handful of values that also exist in TypeScript, because a <meta> tag written
 * at build time cannot read a custom property. Each is checked against the source. */
const MIRRORED = [{ token: "--rc-paper", constant: "PAPER" }];

const HEADER = `/* GENERATED FILE — do not edit.
 *
 * Verbatim copy of brand/tokens.css, which is the source of truth.
 * The copy exists because App Service deploys the web/ subtree alone, so a
 * build-time import of ../brand/tokens.css would resolve locally and fail in
 * production. \`pnpm tokens\` rewrites it; \`pnpm lint\` fails if it has drifted.
 */

`;

let source;
try {
  source = readFileSync(SOURCE, "utf8");
} catch {
  console.log("tokens: brand/tokens.css not present — skipping (deployed subtree)");
  process.exit(0);
}

const expected = HEADER + source;

if (process.argv.includes("--write")) {
  writeFileSync(COPY, expected);
  console.log("tokens: web/app/tokens.css rewritten from brand/tokens.css");
  process.exit(0);
}

const problems = [];

if (readFileSync(COPY, "utf8") !== expected) {
  problems.push(
    "web/app/tokens.css has drifted from brand/tokens.css.\n" +
      "  Run `pnpm tokens` to regenerate it, or revert the edit if it was made in the copy.",
  );
}

const mirror = readFileSync(MIRROR, "utf8");
for (const { token, constant } of MIRRORED) {
  const inSource = source.match(new RegExp(`${token}\\s*:\\s*(#[0-9a-fA-F]{3,8})`))?.[1];
  const inMirror = mirror.match(new RegExp(`${constant}\\s*=\\s*"(#[0-9a-fA-F]{3,8})"`))?.[1];
  if (!inSource) {
    problems.push(`${token} is no longer declared in brand/tokens.css.`);
  } else if (!inMirror) {
    problems.push(`${constant} is no longer exported from web/lib/brand.ts.`);
  } else if (inSource.toLowerCase() !== inMirror.toLowerCase()) {
    problems.push(
      `web/lib/brand.ts exports ${constant} = ${inMirror}, but ${token} is ${inSource}.\n` +
        `  brand/tokens.css is the source of truth. Update the constant to match.`,
    );
  }
}

if (problems.length === 0) {
  console.log("tokens: web/ matches brand/tokens.css");
  process.exit(0);
}

for (const problem of problems) console.error(`tokens: ${problem}`);
process.exit(1);
