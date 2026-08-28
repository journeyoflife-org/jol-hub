/**
 * E2E flow 1 — visitor views the church home page and navigates to news.
 * (STEP 15, critical flow 1)
 *
 * Pilot reality: collections come from the hub backend, which is not yet
 * wired — the news list renders the honest empty state. Article-reading
 * assertions activate once the backend content plane lands (see
 * testing.md "E2E pilot expectations").
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('visitor: home → news', () => {
  test('home renders the tenant and news navigation works', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);

    // Tenant identity present in the rendered shell.
    await expect(page.locator('body')).toContainText('Šv. Jonų');

    // Navigate to news via the primary navigation.
    await page.getByRole('link', { name: 'Naujienos' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/lt/${TENANT}/news`));

    // Pilot: honest empty state (no fabricated content for real tenants).
    await expect(page.locator('main')).toContainText('Naujienų kol kas nėra');
  });
});
