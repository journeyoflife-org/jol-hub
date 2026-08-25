/**
 * E2E flow 10 — SEO: structured data, meta tags, canonical.
 * (STEP 15, critical flow 10)
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('SEO: meta + structured data', () => {
  test('home page carries meta, canonical and JSON-LD', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);

    // Title + description present and non-empty.
    await expect(page).toHaveTitle(/./);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect((description ?? '').length).toBeGreaterThan(0);

    // Canonical must be absolute and locale-scoped.
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical ?? '').toMatch(/^https:\/\/.+\/lt\//);

    // Open Graph basics.
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);

    // JSON-LD structured data — STEP 12 output.
    const jsonLd = page.locator('script[type="application/ld+json"]');
    expect(await jsonLd.count()).toBeGreaterThan(0);
    const parsed = JSON.parse((await jsonLd.first().innerText()).trim());
    const types = Array.isArray(parsed)
      ? parsed.map((node: { ['@type']?: string }) => node['@type'])
      : [parsed['@type']];
    expect(types.some((t: string) => typeof t === 'string')).toBe(true);

    // Robots policy is present and deliberate (pilot tenants are noindexed
    // by design; production flips via tenant settings — assert structure,
    // not the value).
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(typeof robots).toBe('string');
  });

  test('html lang matches the locale segment', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'lt');
    await page.goto(`/en/${TENANT}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
