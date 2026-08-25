/**
 * E2E flow 3 — booking service surface. (STEP 15, critical flow 3)
 *
 * Pilot reality: the services collection flows from the hub backend; with
 * no backend the list renders the honest empty state. The full booking
 * flow (BookingWidget: service → slot → details → confirmation) is
 * exercised at the integration tier until services are seeded — see
 * testing.md "E2E pilot expectations".
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('visitor: services surface', () => {
  test('services page renders with the honest empty state', async ({ page }) => {
    await page.goto(`/lt/${TENANT}/services`);
    await expect(page.locator('main')).toContainText('Paslaugų kol kas nėra');
  });

  test('unknown service slug yields a soft 404, not a crash', async ({ page }) => {
    const response = await page.goto(`/lt/${TENANT}/services/does-not-exist`);
    expect(response?.status()).toBe(404);
  });
});
