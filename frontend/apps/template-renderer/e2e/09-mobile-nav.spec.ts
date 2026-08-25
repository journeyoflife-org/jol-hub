/**
 * E2E flow 9 — mobile navigation. (STEP 15, critical flow 9)
 *
 * Runs in the `mobile-webkit` project (iPhone 13 viewport). Verifies the
 * hamburger menu + skip link — the keyboard/touch entry points.
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('mobile navigation', () => {
  test('hamburger menu opens and exposes navigation', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);

    const toggle = page.getByRole('button', { name: 'Atidaryti meniu' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Menu expanded — nav links reachable by touch.
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Naujienos' }).first()).toBeVisible();

    // Close it again (state toggles, focus stays usable).
    await page.getByRole('button', { name: 'Uždaryti meniu' }).click();
  });

  test('skip link targets the main content', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);
    const skip = page.getByRole('link', { name: 'Pereiti prie pagrindinio turinio' });
    await expect(skip).toHaveCount(1);
    await expect(skip).toHaveAttribute('href', '#main-content');
  });
});
