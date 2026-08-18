import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
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
