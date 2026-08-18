/**
 * Whole days from `now` until `deadlineIso`, floored at zero.
 * Both sides are normalised to UTC midnight so the result cannot drift by a
 * day with the viewer's timezone or across a DST transition.
 */
export function daysUntil(deadlineIso: string, now: Date): number {
  const [y, m, d] = deadlineIso.split('-').map(Number);
  const deadline = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((deadline - today) / 86_400_000);
  return Math.max(0, days);
}
