import { describe, it, expect } from 'vitest';
import { FAQ, faqPlainText } from '../../src/lib/faq';

describe('FAQ content', () => {
  it('has a question and at least one answer paragraph for every entry', () => {
    expect(FAQ.length).toBeGreaterThan(0);
    for (const item of FAQ) {
      expect(item.q.trim().length).toBeGreaterThan(0);
      expect(item.a.length).toBeGreaterThan(0);
      expect(item.a.every((p) => p.trim().length > 0)).toBe(true);
    }
  });

  it('strips inline markup for the structured-data projection', () => {
    const item = { q: 'x', a: ['A <strong>bold</strong> claim.', 'And <em>more</em>.'] };
    expect(faqPlainText(item)).toBe('A bold claim. And more.');
  });

  it('leaves no angle brackets in any structured-data answer', () => {
    for (const item of FAQ) {
      expect(faqPlainText(item)).not.toMatch(/[<>]/);
    }
  });

  it('states both enforcement cohorts, not just the headline date', () => {
    // The site's urgency rests on 30 December 2026, but that date is only
    // correct for large and medium operators. Claiming it universally would be
    // wrong for exactly the smaller companies most likely to read the page.
    const all = FAQ.map(faqPlainText).join(' ');
    expect(all).toContain('30 December 2026');
    expect(all).toContain('30 June 2027');
  });

  it('never claims TRACES acceptance without naming the acceptance environment', () => {
    // The one phrase that must not drift: "accepted by TRACES" unqualified is a
    // claim a compliance officer can puncture.
    for (const item of FAQ) {
      const text = faqPlainText(item);
      if (/TRACES/.test(text) && /accept/i.test(text)) {
        expect(text).toMatch(/acceptance environment/);
      }
    }
  });
});
