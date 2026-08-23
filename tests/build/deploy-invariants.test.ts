import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = (p: string) => resolve(process.cwd(), 'dist', p);

describe('deployment invariants', () => {
  // If this test ever fails, grovetrace.com stops resolving. It is the single
  // highest-consequence assertion in the repo.
  it('emits CNAME into dist so the custom domain survives the build', () => {
    expect(existsSync(dist('CNAME'))).toBe(true);
    expect(readFileSync(dist('CNAME'), 'utf8').trim()).toBe('grovetrace.com');
  });

  it('emits a sitemap index', () => {
    expect(existsSync(dist('sitemap-index.xml'))).toBe(true);
  });

  it('never references the Google Fonts CDN', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });
});

describe('SEO output', () => {
  it('gives the home page a canonical URL with a trailing slash', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    expect(html).toContain('<link rel="canonical" href="https://grovetrace.com/"');
  });

  it('gives the home page a non-empty meta description', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    const match = html.match(/<meta name="description" content="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1].length).toBeGreaterThan(50);
  });

  it('emits Organization JSON-LD that parses', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    const blocks = [...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    )].map((m) => JSON.parse(m[1]));
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b['@type'] === 'Organization')).toBe(true);
  });

  it('has exactly one h1 on the home page', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  });
});

describe('image assets', () => {
  // A broken explicit favicon link is worse than none: it suppresses the
  // browser's implicit /favicon.ico fallback. Both must exist in dist,
  // not just be referenced — and existsSync alone would let an empty or
  // truncated file pass, so also check it's non-trivially sized and
  // actually parses as SVG.
  it('ships the favicon referenced by Seo.astro', () => {
    const path = dist('img/favicon.svg');
    expect(existsSync(path)).toBe(true);
    const svg = readFileSync(path, 'utf8');
    expect(svg.length).toBeGreaterThan(200);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    const html = readFileSync(dist('index.html'), 'utf8');
    expect(html).toContain('<link rel="icon" href="/img/favicon.svg"');
  });

  it('ships the Organization logo referenced by jsonld.ts', () => {
    const path = dist('img/grovetrace-mark.svg');
    expect(existsSync(path)).toBe(true);
    const svg = readFileSync(path, 'utf8');
    expect(svg.length).toBeGreaterThan(200);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('ships a default OG image at 1200x630 with text actually rendered', () => {
    const path = dist('img/og-default.png');
    expect(existsSync(path)).toBe(true);

    const buf = readFileSync(path);
    // PNG IHDR: width/height are the four bytes at offsets 16 and 20.
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);

    // resvg silently renders zero glyphs when handed a .woff2 (see
    // scripts/make-og.mjs) — it emits an image byte-identical to the bare
    // background instead of throwing. A bare #0B1D1C 1200x630 rect PNG is
    // ~4.4KB; a render with the "Grovetrace" headline and subtitle actually
    // shaped is ~29KB. This threshold catches a silent-textless regression.
    expect(statSync(path).size).toBeGreaterThan(15000);

    const html = readFileSync(dist('index.html'), 'utf8');
    expect(html).toContain('https://grovetrace.com/img/og-default.png');
  });
});

describe('home page positioning', () => {
  it('names cocoa in the hero lede, not just in a feature list', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    // [^>]* tolerates Astro's scoped-CSS data-astro-cid-* attribute, which
    // lands right after class= on any element styled by a <style> block.
    const lede = html.match(/<p class="lede"[^>]*>([\s\S]*?)<\/p>/);
    expect(lede).not.toBeNull();
    expect(lede![1].toLowerCase()).toContain('cocoa');
  });

  it('does not claim a company location in the footer', () => {
    const html = readFileSync(dist('index.html'), 'utf8');
    expect(html).not.toContain('Toronto');
  });

  it('ships no fabricated social proof', () => {
    const html = readFileSync(dist('index.html'), 'utf8').toLowerCase();
    expect(html).not.toContain('trusted by');
    expect(html).not.toContain('our customers say');
  });
});

describe('internal links', () => {
  /**
   * The nav and footer once linked /blog/ and /rss.xml while the blog was
   * still deferred, so every page shipped two 404s. Walk every built page and
   * resolve each internal href against dist/ — the same directory-index rule
   * the site is deployed under (`trailingSlash: 'always'`).
   */
  const pages = ['index.html', 'demo/index.html', 'privacy/index.html'];

  function resolves(href: string): boolean {
    const path = href.split('#')[0].split('?')[0];
    if (path === '' || path === '/') return existsSync(dist('index.html'));
    const rel = path.replace(/^\//, '');
    return (
      existsSync(dist(rel)) ||
      existsSync(dist(`${rel.replace(/\/$/, '')}/index.html`))
    );
  }

  for (const page of pages) {
    it(`has no dead internal links on /${page.replace(/index\.html$/, '')}`, () => {
      const html = readFileSync(dist(page), 'utf8');
      const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      const internal = hrefs.filter(
        (h) => h.startsWith('/') && !h.startsWith('//'),
      );
      // Guard against a vacuous pass if the regex or page ever goes empty.
      expect(internal.length).toBeGreaterThan(0);
      expect(internal.filter((h) => !resolves(h))).toEqual([]);
    });
  }
});

describe('third-party scripts', () => {
  it('keeps Cal.com off the home page', () => {
    // Only /demo/ may embed the scheduler. Home-page embedding would load a
    // third-party script for every visitor, most of whom never book.
    const html = readFileSync(dist('index.html'), 'utf8');
    expect(html).not.toContain('cal.com');
  });

  it('does embed Cal.com on the booking page', () => {
    // Negative control for the assertion above: if the embed vanished entirely
    // that test would still pass while the site quietly lost its booking flow.
    const html = readFileSync(dist('demo/index.html'), 'utf8');
    expect(html).toContain('cal.com');
  });

  it('discloses the Cal.com embed in the privacy notice', () => {
    // The page loads a third-party script on view, so saying so is not
    // optional — and the notice previously described a form that no longer
    // exists.
    const html = readFileSync(dist('privacy/index.html'), 'utf8');
    expect(html).toContain('Cal.com');
    expect(html).not.toContain('Web3Forms');
  });
});

describe('404', () => {
  it('emits a custom 404.html — GitHub Pages serves it for any unmatched path', () => {
    // Without this the visitor gets GitHub's generic page: off-brand, and a
    // dead end with no route back to the site.
    expect(existsSync(dist('404.html'))).toBe(true);
    const html = readFileSync(dist('404.html'), 'utf8');
    expect(html).toContain('Grovetrace');
    // It must offer a way onward, not just apologise.
    expect(html).toContain('href="/demo/"');
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });

  it('keeps 404 out of the sitemap', () => {
    const files = ['sitemap-0.xml', 'sitemap-index.xml']
      .filter((f) => existsSync(dist(f)))
      .map((f) => readFileSync(dist(f), 'utf8'))
      .join('');
    expect(files).not.toContain('404');
    expect(files).toContain('/demo/');
  });
});

describe('scroll motion safety', () => {
  /**
   * The severe failure mode for scroll-driven animation: an element parked at
   * `opacity: 0` waiting for an animation that never runs is permanently
   * invisible. `animation-timeline` is unsupported in Safari at time of
   * writing, so an unguarded rule would ship a blank "How it works" section to
   * every Mac and iPhone visitor.
   *
   * Every hiding rule must therefore sit inside `@supports (animation-timeline:
   * view())`. This walks the built CSS and fails if any `opacity:0` appears
   * outside such a block.
   */
  function builtCss(): string {
    const dir = resolve(process.cwd(), 'dist', '_astro');
    const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
    expect(files.length).toBeGreaterThan(0);
    return files.map((f) => readFileSync(resolve(dir, f), 'utf8')).join('\n');
  }

  /** Strip every @supports(animation-timeline) block, brace-matched. */
  function withoutTimelineSupports(css: string): string {
    let out = '';
    let i = 0;
    while (i < css.length) {
      const at = css.indexOf('@supports', i);
      if (at === -1) { out += css.slice(i); break; }
      const open = css.indexOf('{', at);
      const cond = css.slice(at, open);
      if (!/animation-timeline/.test(cond)) { out += css.slice(i, open + 1); i = open + 1; continue; }
      out += css.slice(i, at);
      let depth = 1, j = open + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      i = j;
    }
    return out;
  }

  it('never hides content outside an animation-timeline @supports block', () => {
    const css = builtCss();
    // Negative control: the guarded rule must actually exist, or the assertion
    // below passes simply because no motion shipped at all.
    expect(css).toMatch(/@supports\s*\(animation-timeline/);
    expect(css).toMatch(/opacity\s*:\s*0\b/);

    const unguarded = withoutTimelineSupports(css);
    expect(unguarded).not.toMatch(/opacity\s*:\s*0[;\}]/);
  });

  it('gates motion on prefers-reduced-motion', () => {
    expect(builtCss()).toMatch(/prefers-reduced-motion/);
  });
});
