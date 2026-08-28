/**
 * E2E flow 8 — language switch updates content. (STEP 15, critical flow 8)
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('i18n: locale switching', () => {
  test('switching LT → EN translates the navigation', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);
    await expect(page.locator('body')).toContainText('Pradžia');

    // LocaleSwitcher is a labeled <select> (accessible, keyboard-usable).
    await page.getByLabel('Kalba').selectOption('en');

    await expect(page).toHaveURL(new RegExp(`^/en/${TENANT}`));
    await expect(page.locator('body')).toContainText('Home');
    await expect(page.locator('body')).toContainText('News');
  });

  test('locale persists across navigation (cookie)', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);
    await page.getByLabel('Kalba').selectOption('en');
    await expect(page).toHaveURL(new RegExp(`^/en/`));
    // Follow an internal link — stays in EN.
    await page.getByRole('link', { name: 'News' }).first().click();
    await expect(page).toHaveURL(new RegExp(`^/en/${TENANT}/news`));
  });
});
