/**
 * E2E flow 4 — donation surface. (STEP 15, critical flow 4)
 *
 * Pilot reality: payments are NOT live (ADR-007). The donation module
 * surfaces the honest "payments pending" notice instead of a fake Stripe
 * flow. This spec locks that behavior — a live Stripe checkout test
 * replaces it when the payment boundary opens.
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('donor: donation surface', () => {
  test('home shows the payments-pending notice, never a fake checkout', async ({ page }) => {
    await page.goto(`/lt/${TENANT}`);
    // ADR-007 pilot copy (commerce.paymentsPending).
    await expect(page.locator('body')).toContainText('Mokėjimai dar neaktyvuoti');
    // No live Stripe elements may leak into the pilot DOM.
    await expect(page.locator('iframe[src*="stripe"]')).toHaveCount(0);
    await expect(page.locator('form[action*="stripe"]')).toHaveCount(0);
  });
});
