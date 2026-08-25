/**
 * E2E flow 2 — visitor fills the contact form and receives a success
 * message. (STEP 15, critical flow 2; CRM lead is stubbed in pilot.)
 */
import { expect, test } from '@playwright/test';

const TENANT = 'parish-st-john-vilnius';

test.describe('visitor: contact form submission', () => {
  test('valid submission with consent shows the success reference', async ({ page }) => {
    await page.goto(`/lt/${TENANT}/contact`);

    await page.fill('#contact-name', 'E2E Lankytojas');
    await page.fill('#contact-email', 'lankytojas@example.com');
    await page.fill('#contact-message', 'E2E žinutė — pakankamai ilga, kad praeitų validaciją.');
    await page.check('#contact-consent');
    await page.click('button[type="submit"]');

    // Success copy starts with "Ačiū!" (crm.successReference).
    await expect(page.locator('main')).toContainText('Ačiū', { timeout: 10_000 });
  });

  test('submission without consent is blocked', async ({ page }) => {
    await page.goto(`/lt/${TENANT}/contact`);
    await page.fill('#contact-name', 'E2E Lankytojas');
    await page.fill('#contact-email', 'lankytojas@example.com');
    await page.fill('#contact-message', 'E2E žinutė — pakankamai ilga.');
    await page.click('button[type="submit"]');
    // No success state without consent (GDPR Art. 6/7).
    await expect(page.locator('main')).not.toContainText('Ačiū');
  });
});
