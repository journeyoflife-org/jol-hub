/**
 * DonationForm — STEP 8 (donations).
 *
 * Amount presets (5/10/20/50/100/custom) + frequency (one-time/monthly/annual),
 * GDPR consent, anonymous option and tax-receipt eligibility info.
 *
 * PCI-DSS (SAQ A, ADR-0005 Model A): card data NEVER touches this component.
 * The charge path is Stripe-hosted (Payment Links / Elements via js.stripe.com);
 * intent creation is delegated to the internal payment API. Until ADR-007
 * lands (payments pending) the submit path shows the pending notice — it does
 * NOT simulate a successful charge.
 */
'use client';

import { useState } from 'react';
import { formatEur, MIN_DONATION_CENTS } from '@jol-hub/commerce';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { Button } from '@jol-hub/ui/components/primitives';
import { useTenantFeature } from '@/lib/tenant-context';

const PRESETS = [5, 10, 20, 50, 100];
type Frequency = 'one-time' | 'monthly' | 'annual';

export interface DonationFormProps {
  locale?: string;
  title?: string;
}

export function DonationForm({ locale = 'lt', title }: DonationFormProps) {
  const t = useTranslations('commerce');
  const entitled = useTenantFeature('donations');

  const [selected, setSelected] = useState<number | 'custom'>(PRESETS[1] ?? 10);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('one-time');
  const [anonymous, setAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);

  // Hide entirely when the tenant's package does not include donations.
  if (!entitled) return null;

  const amountEur = selected === 'custom' ? Number(customAmount) || 0 : selected;
  const amountCents = Math.round(amountEur * 100);
  const meetsMinimum = amountCents >= MIN_DONATION_CENTS;

  const frequencies: { value: Frequency; label: string }[] = [
    { value: 'one-time', label: t('oneTime') },
    { value: 'monthly', label: t('monthly') },
    { value: 'annual', label: t('annual') },
  ];

  return (
    <section
      aria-label={title ?? t('donateTitle')}
      className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-4 font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        {title ?? t('donateTitle')}
      </h2>

      {/* Amount presets */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('amountLegend')}
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('amountLabel')}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={selected === preset}
              onClick={() => setSelected(preset)}
              className={
                selected === preset
                  ? 'h-10 min-w-16 rounded-md border border-transparent bg-neutral-900 px-4 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'h-10 min-w-16 rounded-md border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
              }
            >
              {formatEur(preset * 100, locale)}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          {t('customAmount')}
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step="0.01"
            placeholder={t('customPlaceholder')}
            value={customAmount}
            onFocus={() => setSelected('custom')}
            onChange={(event) => {
              setSelected('custom');
              setCustomAmount(event.target.value);
            }}
            className="h-10 w-28 rounded-md border border-neutral-300 bg-neutral-50 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        {!meetsMinimum ? (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t('minDonationNote')}</p>
        ) : null}
      </fieldset>

      {/* Frequency */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('frequencyLabel')}
        </legend>
        <div className="flex gap-2" role="radiogroup" aria-label={t('frequencyLabel')}>
          {frequencies.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={frequency === option.value}
              onClick={() => setFrequency(option.value)}
              className={
                frequency === option.value
                  ? 'rounded-full bg-neutral-900 px-3 py-1 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Anonymous option */}
      <label className="mb-2 flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(event) => setAnonymous(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
        />
        <span>
          {t('anonymousLabel')}
          <span className="block text-xs text-neutral-500 dark:text-neutral-400">{t('anonymousDescription')}</span>
        </span>
      </label>

      {/* Tax-receipt eligibility */}
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">{t('taxReceiptInfo')}</p>

      {/* GDPR consent */}
      <label className="mb-4 flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
        />
        <span>{t('consentDonation')}</span>
      </label>

      <Button
        className="w-full"
        disabled={!meetsMinimum || !consent}
        onClick={() => {
          // ADR-007 (payments pending): the charge path is not wired yet.
          // Once live this calls createDonationIntent() then confirms via
          // Stripe-hosted Elements. No card data reaches this codebase.
        }}
      >
        {meetsMinimum ? t('donateAmountCta', { amount: formatEur(amountCents, locale) }) : t('donateCta')}
      </Button>

      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t('paymentsPending')}</p>
    </section>
  );
}
