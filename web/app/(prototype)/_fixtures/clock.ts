/* The prototype's clock is a constant, not the machine's.
 *
 * Every take has to start the same way. If "3 days remaining" is computed against
 * Date.now() it is 3 today, 2 tomorrow, and negative by the time the episode is cut —
 * and the screen that exists to show a deadline would be the one screen that cannot be
 * filmed twice. So NOW is fixed, every fixture date is a literal measured against it,
 * and nothing in the prototype reads the real clock.
 *
 * The real application will of course use the real clock. This is the one place the
 * prototype knowingly differs, which is why it is a file of its own rather than a
 * constant buried in a fixture.
 */
export const NOW = "2026-08-05T09:00:00.000Z";

const MS_PER_DAY = 86_400_000;

/** Whole days from NOW to `at`. Negative once the date is behind us. */
export function daysFromNow(at: string): number {
  const from = Date.parse(NOW);
  const to = Date.parse(at);
  return Math.round((to - from) / MS_PER_DAY);
}

/** Whole days from `at` to NOW. Used for "read 17 months ago" on a sighting. */
export function daysSince(at: string): number {
  return -daysFromNow(at);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** 14 March 2026. No relative phrasing — "recently" is not a date. */
export function formatDate(at: string): string {
  const date = new Date(at);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** 14 Mar 2026, for a provenance line that has to stay on one line. */
export function formatDateShort(at: string): string {
  const date = new Date(at);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)} ${date.getUTCFullYear()}`;
}

/** How long ago a source was read, in the largest honest unit. */
export function formatAge(at: string): string {
  const days = daysSince(at);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 60) return `${days} days ago`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}
