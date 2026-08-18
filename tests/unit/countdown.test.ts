import { describe, it, expect } from 'vitest';
import { daysUntil } from '../../src/lib/countdown';

describe('daysUntil', () => {
  it('counts whole days between two UTC dates', () => {
    expect(daysUntil('2026-12-30', new Date('2026-12-20T00:00:00Z'))).toBe(10);
  });

  it('returns 0 on the deadline day itself', () => {
    expect(daysUntil('2026-12-30', new Date('2026-12-30T23:59:59Z'))).toBe(0);
  });

  it('never returns a negative number once the deadline has passed', () => {
    expect(daysUntil('2026-12-30', new Date('2027-01-05T00:00:00Z'))).toBe(0);
  });

  // A local-midnight implementation drifts by a day for anyone west of UTC.
  it('is stable across timezone offsets late in the day', () => {
    expect(daysUntil('2026-12-30', new Date('2026-12-20T23:30:00-08:00'))).toBe(9);
  });

  // Naive (ms / 86_400_000) arithmetic over a DST boundary loses an hour and
  // can round a day away.
  it('is unaffected by DST transitions in the interval', () => {
    expect(daysUntil('2026-12-30', new Date('2026-10-20T12:00:00Z'))).toBe(71);
  });
});
