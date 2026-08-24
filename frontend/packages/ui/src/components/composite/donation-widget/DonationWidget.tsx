/**
 * DonationWidget — SHELL ONLY (STEP 3).
 *
 * Amount selection + recurring toggle are implemented; the charge path is a
 * placeholder.
 *
 * TODO(payments, ADR-007 payments-boundary): integrate Stripe Payment
 * Links / Checkout Session here. Until then the button only reports the
 * configured selection via `onConfigure`.
 *
 * PCI-DSS COMPLIANCE NOTE — this widget MUST remain SAQ A eligible:
 * - Card data may never touch this codebase (no raw PAN fields, no
 *   handleCard* APIs). Use Stripe-hosted fields / Checkout / Payment Links.
 * - The only permitted client-side Stripe surface is `stripe-js` loading
 *   Stripe-hosted surfaces; server-side secret keys stay in the backend.
 * - See `scripts/check-payment-boundary.sh` at the repository root, which
 *   guards this boundary in CI.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { useLocale } from '@jol-hub/i18n/use-locale';

import { cn } from '../../../lib/utils';
import { accentBgClass } from '../../../lib/tenant-theme';
import { Button } from '../../primitives/button';
import type { DonationWidgetProps } from './DonationWidget.types';

const DEFAULT_PRESETS = [10, 20, 50, 100];

export function DonationWidget({
  presets = DEFAULT_PRESETS,
  onConfigure,
  title,
  tenant,
  className,
}: DonationWidgetProps) {
  const tCommerce = useTranslations('commerce');
  const { formatCurrency } = useLocale();
  const [selected, setSelected] = useState<number | 'custom'>(presets[0] ?? 10);
  const [customAmount, setCustomAmount] = useState('');
  const [recurring, setRecurring] = useState(false);

  const amount =
    selected === 'custom' ? Number(customAmount) || 0 : selected;

  return (
    <div className={cn('rounded-lg border border-neutral-200 p-6 dark:border-neutral-800', className)}>
      <h2 className="mb-4 font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        {title ?? tCommerce('donateCta')}
      </h2>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {tCommerce('amountLegend')}
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tCommerce('amountLabel')}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={selected === preset}
              onClick={() => setSelected(preset)}
              className={cn(
                'h-10 min-w-16 rounded-md border px-4 text-sm font-medium focus-ring transition-colors motion-reduce:transition-none',
                selected === preset
                  ? cn('border-transparent text-neutral-50', accentBgClass(tenant))
                  : 'border-neutral-300 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          {tCommerce('customAmount')}
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step="0.01"
            placeholder={tCommerce('customPlaceholder')}
            value={customAmount}
            onFocus={() => setSelected('custom')}
            onChange={(event) => {
              setSelected('custom');
              setCustomAmount(event.target.value);
            }}
            className="h-10 w-28 rounded-md border border-neutral-300 bg-neutral-50 px-3 text-sm focus-ring dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </fieldset>

      <div className="mb-4 flex items-center gap-2">
        <input
          id="donation-recurring"
          type="checkbox"
          checked={recurring}
          onChange={(event) => setRecurring(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-primary focus-ring dark:border-neutral-700"
        />
        <label htmlFor="donation-recurring" className="text-sm text-neutral-700 dark:text-neutral-200">
          {tCommerce('monthly')}
        </label>
      </div>

      <Button
        tenant={tenant}
        disabled={amount <= 0}
        onClick={() => onConfigure?.({ amount, recurring })}
        className="w-full"
      >
        {amount > 0
          ? tCommerce('donateAmountCta', { amount: formatCurrency(amount) })
          : tCommerce('donateCta')}
      </Button>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        {tCommerce('paymentsPending')}
      </p>
    </div>
  );
}
