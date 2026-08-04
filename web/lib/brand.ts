/* The brand values needed outside CSS, where a custom property cannot reach.
 *
 * `themeColor` in Next's viewport export is written into a <meta> tag at build time
 * and cannot read var(--rc-paper). This module mirrors brand/tokens.css for that one
 * case. scripts/tokens.mjs checks the mirror against the source, so it cannot drift
 * quietly — see CLAUDE.md on preferring mechanism over convention.
 *
 * Do not add to this file to avoid writing CSS. Anything a stylesheet can express
 * belongs in globals.css against the --rc-* variables.
 */

/** --rc-paper. Tints mobile browser chrome so the page does not sit in a white frame. */
export const PAPER = "#f6f5f2";
