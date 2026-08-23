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

/**
 * Wiring for `Countdown.astro`: turns the raw `data-deadline` attribute value
 * into display text, or `null` when the countdown span should stay hidden.
 * Extracted as a pure function (rather than left inline in the component's
 * `<script>`) specifically so both fail-safe paths are unit-tested, not just
 * read from the code:
 *  - no attribute at all (`deadline` is `undefined`/`''`) → hidden.
 *  - a malformed date → `Date.UTC` in `daysUntil` produces `NaN`, which
 *    fails every numeric comparison, so `days > 0` is `false` → hidden.
 *  - zero (or negative, pre-floor) days left → nothing to count down to.
 */
export function countdownText(deadline: string | undefined | null, now: Date): string | null {
  if (!deadline) return null;
  const days = daysUntil(deadline, now);
  return days > 0 ? ` · ${days} days` : null;
}
