import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The palette is a set of contrast decisions, not a set of nice colours. Every
 * value below was chosen against a specific surface — see the comments in
 * tokens.css — and a later "let's brighten the green" would silently take text
 * under WCAG AA with nothing to catch it. So parse the real token file and
 * check the pairs.
 *
 * --muted-foreground in particular shipped for months at 3.8:1 on the cream
 * and 4.2:1 on a card, which is what this exists to prevent recurring.
 */
const css = readFileSync(
  resolve(process.cwd(), 'src/styles/tokens.css'),
  'utf8',
);

/** Read a token out of the `:root` or `.dark` block, whichever is asked for. */
function token(block: ':root' | '.dark', name: string): string {
  const start = css.indexOf(`${block} {`);
  expect(start, `${block} block missing from tokens.css`).toBeGreaterThan(-1);
  const body = css.slice(start, css.indexOf('\n}', start));
  const m = body.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  expect(m, `--${name} not found in ${block}`).not.toBeNull();
  return m![1];
}

const channel = (v: number) =>
  v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

function luminance(hex: string): number {
  const [r, g, b] = hex
    .match(/[0-9A-Fa-f]{2}/g)!
    .map((h) => channel(parseInt(h, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('contrast helper', () => {
  // Negative control: without this the assertions below could all be passing
  // because the maths returns something uselessly large for every input.
  it('computes known ratios', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    // A pair that must FAIL, so a broken parser cannot make the suite vacuous.
    expect(contrast('#C7956D', '#F6F3ED')).toBeLessThan(4.5);
  });
});

describe('light theme meets WCAG AA', () => {
  const bg = token(':root', 'background');
  const alt = token(':root', 'surface-alt');
  const card = token(':root', 'card');
  const deep = token(':root', 'surface-deep');

  // Body copy sits on all three light surfaces.
  it.each([
    ['background', () => bg],
    ['surface-alt', () => alt],
    ['card', () => card],
  ])('--muted-foreground on --%s', (_name, surface) => {
    expect(contrast(token(':root', 'muted-foreground'), surface())).toBeGreaterThanOrEqual(4.5);
  });

  it('--foreground on every light surface', () => {
    for (const s of [bg, alt, card]) {
      expect(contrast(token(':root', 'foreground'), s)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('--primary is legible as eyebrow and link text on light surfaces', () => {
    for (const s of [bg, alt, card]) {
      expect(contrast(token(':root', 'primary'), s)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('--primary-foreground on --primary-strong (the button fill)', () => {
    expect(
      contrast(token(':root', 'primary-foreground'), token(':root', 'primary-strong')),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('--accent clears AA on the deep band, where it is the eyebrow colour', () => {
    expect(contrast(token(':root', 'accent'), deep)).toBeGreaterThanOrEqual(4.5);
  });

  it('--accent must NOT be used on light surfaces', () => {
    // Documents the constraint rather than the colour: the tan is decorative
    // warmth that only earns text contrast against the dark band. If someone
    // darkens it enough to pass here, this test should be deleted along with
    // the "deep band only" comment in tokens.css.
    expect(contrast(token(':root', 'accent'), bg)).toBeLessThan(4.5);
  });

  it('--emerald carries dark text on the deep band', () => {
    expect(contrast(deep, token(':root', 'emerald'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('dark theme meets WCAG AA', () => {
  const bg = token('.dark', 'background');
  const alt = token('.dark', 'surface-alt');
  const card = token('.dark', 'card');

  it('--muted-foreground on every dark surface', () => {
    for (const s of [bg, alt, card]) {
      expect(contrast(token('.dark', 'muted-foreground'), s)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('--foreground and --primary on every dark surface', () => {
    for (const name of ['foreground', 'primary'] as const) {
      for (const s of [bg, alt, card]) {
        expect(contrast(token('.dark', name), s)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('--primary-foreground on --primary-strong (the button fill)', () => {
    expect(
      contrast(token('.dark', 'primary-foreground'), token('.dark', 'primary-strong')),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('surfaces are distinguishable from each other', () => {
    // The whole point of the alternation. Too close and the bands vanish;
    // this is the 3:1 non-text boundary threshold.
    expect(contrast(bg, alt)).toBeGreaterThan(1.06);
    expect(contrast(card, alt)).toBeGreaterThan(1.1);
  });
});

describe('light surfaces are distinguishable', () => {
  it('the alt band reads as a different surface from the cream', () => {
    const d = contrast(token(':root', 'background'), token(':root', 'surface-alt'));
    // The first attempt at this shipped at 1.05, which was invisible on screen.
    expect(d).toBeGreaterThan(1.06);
  });
});
