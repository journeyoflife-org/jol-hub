/**
 * E2E flows 5–7 — admin/editor/moderation gates.
 * (STEP 15, critical flows 5, 6, 7 — pilot variant)
 *
 * Pilot reality: jol-auth runs in OPEN MODE while unconfigured — the
 * editor surfaces render with explicit pilot notices and NO live
 * moderation data, instead of OIDC redirects. These specs lock that
 * safe pilot behavior; the redirect/403 variant activates once jol-auth
 * is configured (see testing.md "E2E pilot expectations"). The RBAC
 * bypass matrix itself is enforced + tested at the unit/integration
 * tiers (security.test.tsx) regardless of auth mode.
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('editor surfaces in pilot mode', () => {
  test('editor renders with the local-draft pilot notice', async ({ page }) => {
    await page.goto(`/lt/${TENANT}/editor`);
    // saveUnconfigured copy — drafts stay local until the backend lands.
    await expect(page.locator('main')).toContainText('redagavimo posistemė dar neaktyvuota');
    // Publish path announces the moderation queue, never direct publish.
    await expect(page.locator('main')).toContainText('moderavim');
  });

  test('moderation queue exposes no items and no decision surface', async ({ page }) => {
    await page.goto(`/lt/${TENANT}/editor/moderation`);
    await expect(page.locator('main')).toContainText('Moderavimo eilė');
    // No live queue data in the pilot.
    await expect(page.locator('main')).toContainText('neaktyvuota');
    await expect(page.locator('button:has-text("Patvirtinti")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Atmesti")')).toHaveCount(0);
  });

  test('admin dashboard stays inert without the auth plane', async ({ page }) => {
    const response = await page.goto(`/lt/${TENANT}/admin`);
    // Either the pilot notice or a hard 403 — never live admin data.
    const body = (await page.locator('body').textContent()) ?? '';
    const inert =
      body.includes('neaktyvuota') ||
      body.includes('Prieiga nesuteikta') ||
      response?.status() === 403;
    expect(inert).toBe(true);
    await expect(page.locator('body')).not.toContainText('colStatus');
  });
});
