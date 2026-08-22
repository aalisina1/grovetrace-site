import { test, expect } from '@playwright/test';

/** Fill the qualifying form with a valid answer set. */
async function fillForm(page: import('@playwright/test').Page) {
  await page.fill('#name', 'Ada Bloom');
  await page.fill('#email', 'ada@example.com');
  await page.fill('#company', 'Example Cocoa BV');
  await page.fill('#role', 'Sustainability Manager');
  await page.check('input[name="commodities"][value="Cocoa"]');
}

function stubWeb3Forms(page: import('@playwright/test').Page, ok: boolean) {
  return page.route('https://api.web3forms.com/submit', (route) =>
    route.fulfill({
      status: ok ? 200 : 400,
      contentType: 'application/json',
      body: JSON.stringify({ success: ok, body: { message: ok ? 'ok' : 'Invalid access key' } }),
    }),
  );
}

test.describe('demo booking form', () => {
  test('reveals the calendar step after a successful submit', async ({ page }) => {
    await stubWeb3Forms(page, true);
    await page.goto('/demo/');
    await fillForm(page);
    await page.fill('#question', 'Plot polygons from our co-ops overlap.');
    await page.click('button[type="submit"]');

    await expect(page.locator('#cal-step')).toBeVisible();
    await expect(page.locator('#demo-form')).toBeHidden();
  });

  test('offers a mailto fallback when the form service fails', async ({ page }) => {
    await stubWeb3Forms(page, false);
    await page.goto('/demo/');
    await fillForm(page);
    await page.click('button[type="submit"]');

    const fallback = page.locator('#form-error a');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute('href', /^mailto:/);
    // The answers must survive into the mailto body, or the lead is lost.
    const href = await fallback.getAttribute('href');
    expect(decodeURIComponent(href ?? '')).toContain('Example Cocoa BV');
  });

  test('keeps the form usable without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/demo/');
    // A native submit needs a real action and the access key as a field.
    await expect(page.locator('#demo-form')).toHaveAttribute(
      'action',
      'https://api.web3forms.com/submit',
    );
    await expect(page.locator('#demo-form')).toHaveAttribute('method', /post/i);
    await expect(page.locator('input[name="access_key"]')).toHaveCount(1);
    await ctx.close();
  });

  test('carries a honeypot field that is hidden from people', async ({ page }) => {
    await page.goto('/demo/');
    const honeypot = page.locator('input[name="botcheck"]');
    await expect(honeypot).toHaveCount(1);
    // Deliberately positioned off-screen rather than display:none — bots skip
    // display:none fields, so Playwright still calls it "visible". Assert the
    // properties that actually matter: out of the viewport, out of the a11y
    // tree, and unreachable by keyboard.
    await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    const box = await honeypot.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThan(0);
  });
});

test.describe('calendar step', () => {
  test('loads no third-party script before the form is submitted', async ({ page }) => {
    const thirdParty: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('cal.com')) thirdParty.push(r.url());
    });
    await page.goto('/demo/');
    await page.waitForLoadState('networkidle');
    expect(thirdParty).toEqual([]);
  });

  test('falls back to a plain link when the embed script is blocked', async ({ page }) => {
    await stubWeb3Forms(page, true);
    await page.route('**/embed/embed.js', (route) => route.abort());

    await page.goto('/demo/');
    await fillForm(page);
    await page.click('button[type="submit"]');

    const fallback = page.locator('#cal-fallback a');
    await expect(fallback).toBeVisible({ timeout: 15_000 });
    await expect(fallback).toHaveAttribute('href', /cal\.com/);
  });
});
