import { test, expect } from '@playwright/test';

test.describe('booking page', () => {
  test('renders the Cal.com scheduler inline', async ({ page }) => {
    // The only test here that genuinely depends on cal.com being reachable.
    // A flaky deploy gate is worse than a narrower one, so it is skipped in CI
    // and the hermetic fallback test below carries the regression cover.
    test.skip(!!process.env.CI, 'requires network access to cal.com');
    await page.goto('/demo/');
    // The embed injects into #cal-inline; a blank box is the failure we care
    // about, so assert it actually filled rather than merely that it exists.
    await expect
      .poll(
        () => page.locator('#cal-inline').evaluate((el) => el.childElementCount),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);
    await expect(page.locator('#cal-fallback')).toBeHidden();
  });

  test('falls back to a plain link when the embed script is blocked', async ({ page }) => {
    await page.route('**/embed/embed.js', (route) => route.abort());

    await page.goto('/demo/');
    const fallback = page.locator('#cal-fallback a');
    await expect(fallback).toBeVisible({ timeout: 20_000 });
    await expect(fallback).toHaveAttribute('href', /cal\.com/);
  });

  test('offers a booking link with JavaScript disabled', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/demo/');
    // The embed cannot run, so the <noscript> link is the only route to booking.
    const html = await page.content();
    expect(html).toContain('cal.com/ali-ahmadi-yp5bv1/grovetrace-demo');
    await ctx.close();
  });

  test('always offers an email route as well as the calendar', async ({ page }) => {
    await page.goto('/demo/');
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  });
});

test.describe('home page', () => {
  test('loads no Cal.com script — only /demo/ embeds it', async ({ page }) => {
    // Embedding on the front page would hand a third-party script and its
    // cookies to every visitor, including everyone who never books. On a site
    // selling EU compliance that is a posture worth keeping.
    const thirdParty: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('cal.com')) thirdParty.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(thirdParty).toEqual([]);
  });

  test('sends people to the booking page', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('a[href="/demo/"]').first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/demo\/$/);
  });
});

test.describe('scroll motion', () => {
  test('shows every step with reduced motion, without scrolling', async ({ browser }) => {
    // With prefers-reduced-motion the reveal never runs. If any hiding rule
    // escaped its guard, content below the fold would be invisible forever.
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');

    for (const heading of [
      'Connect the systems you already run',
      'Log in and see exactly where you stand',
      'Work one action at a time',
      'Every batch ties back to the land',
    ]) {
      const el = page.getByRole('heading', { name: heading });
      await expect(el).toHaveCount(1);
      // Not toBeVisible(): an element can be "visible" to Playwright while its
      // opacity is 0. Check the computed value that actually matters.
      const opacity = await el.evaluate((n) =>
        getComputedStyle(n.closest('.copy') ?? n).opacity,
      );
      expect(Number(opacity)).toBe(1);
    }
    await ctx.close();
  });

  test('renders all four product screenshots', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await page.waitForFunction(() =>
      [...document.images].every((i) => i.complete && i.naturalWidth > 0),
    );
    expect(await page.locator('#how-it-works img').count()).toBe(4);
  });
});

test.describe('interface maturity', () => {
  test('every interactive element has a visible focus state', async ({ page }) => {
    // A page that only works with a mouse is not a well-built one, and
    // keyboard operability is something regulated-procurement buyers check.
    await page.goto('/');
    const targets = page.locator('a[href], button, summary');
    const n = await targets.count();
    expect(n).toBeGreaterThan(5);

    for (let i = 0; i < n; i++) {
      const el = targets.nth(i);
      if (!(await el.isVisible())) continue;
      await el.focus();
      const ring = await el.evaluate((node) => {
        const cs = getComputedStyle(node);
        return { width: cs.outlineWidth, style: cs.outlineStyle };
      });
      // outline-style: none, or a zero-width outline, means no visible ring.
      expect(
        ring.style !== 'none' && parseFloat(ring.width) > 0,
        `no focus ring on element ${i}`,
      ).toBe(true);
    }
  });

  test('states no social proof it does not have', async ({ page }) => {
    // The page is explicit elsewhere that Grovetrace is early. Claiming
    // customers it does not have would undercut that and, once spotted, every
    // other claim with it.
    await page.goto('/');
    const text = (await page.locator('body').innerText()).toLowerCase();
    for (const phrase of ['trusted by', 'our customers', 'testimonial', 'join thousands', 'loved by']) {
      expect(text).not.toContain(phrase);
    }
  });

  test('the capability strip states checkable facts', async ({ page }) => {
    await page.goto('/');
    const strip = page.locator('section[aria-label="Platform capabilities"]');
    await expect(strip).toBeVisible();
    await expect(strip.locator('li')).toHaveCount(5);
    await expect(strip).toContainText('Points and polygons');
    await expect(strip).toContainText('Acceptance round trip');
  });

  test('the nav reacts to scroll', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('.nav');
    await expect(nav).not.toHaveClass(/is-scrolled/);
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(nav).toHaveClass(/is-scrolled/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(nav).not.toHaveClass(/is-scrolled/);
  });
});
