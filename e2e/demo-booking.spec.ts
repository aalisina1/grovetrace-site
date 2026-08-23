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
