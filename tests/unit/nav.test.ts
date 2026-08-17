import { describe, it, expect } from 'vitest';
import { buildNavLinks } from '../../src/lib/nav';

describe('buildNavLinks', () => {
  it('omits the login link when APP_URL is not configured', () => {
    const labels = buildNavLinks(undefined).map((l) => l.label);
    expect(labels).not.toContain('Log in');
  });

  it('includes a login link pointing at the app when APP_URL is set', () => {
    const links = buildNavLinks('https://app.grovetrace.com');
    const login = links.find((l) => l.label === 'Log in');
    expect(login).toBeDefined();
    expect(login!.href).toBe('https://app.grovetrace.com/login');
  });

  it('does not double a slash when APP_URL has a trailing slash', () => {
    const links = buildNavLinks('https://app.grovetrace.com/');
    expect(links.find((l) => l.label === 'Log in')!.href)
      .toBe('https://app.grovetrace.com/login');
  });

  it('always offers the marketing links with trailing slashes', () => {
    const hrefs = buildNavLinks(undefined).map((l) => l.href);
    expect(hrefs).toContain('/blog/');
    expect(hrefs).toContain('/demo/');
  });
});
