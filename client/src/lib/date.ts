/**
 * Local-timezone date helpers.
 *
 * Why: `Date.prototype.toISOString()` always formats in UTC, which rolls
 * the calendar back by 1 day whenever the user is east of UTC+0 before
 * UTC midnight (e.g. any time before 09:00 KST on the Korean calendar).
 * Using ISO-split for a "YYYY-MM-DD" made the streak/heatmap jump to the
 * wrong cell and caused writes to hit the wrong date row in study_sessions.
 *
 * These helpers keep everything on the user's *local* clock so that the
 * date the student sees on their device is the date we store and compare
 * against.
 */

/** Format a Date as `YYYY-MM-DD` in local time. Defaults to now. */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a `YYYY-MM-DD` string as a local-midnight Date. */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** True if two Dates fall on the same local calendar day. */
export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
