import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
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
