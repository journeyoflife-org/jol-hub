/**
 * SubscriptionManager — STEP 8 (subscriptions).
 *
 * Plan selection (monthly/annual) with a feature comparison table and
 * upgrade/downgrade actions. Creation redirects to Stripe-hosted Checkout and
 * management to the Stripe Billing Portal — hub never hosts the card form
 * (SAQ A). The backend receives Stripe webhooks; the frontend polls status.
 *
 * PILOT (ADR-007, payments pending): with no commerce backend configured the
 * manager shows a "subscriptions being prepared" notice rather than fabricating
 * plans. Gated by the `subscriptions` capability.
 */
'use client';

import { useEffect, useState } from 'react';
import { formatEur, getSubscriptionPlans, isCommerceConfigured, type SubscriptionPlan } from '@jol-hub/commerce';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { Button } from '@jol-hub/ui/components/primitives';
import { useTenant, useTenantFeature } from '@/lib/tenant-context';

export interface SubscriptionManagerProps {
  locale?: string;
}

export function SubscriptionManager({ locale = 'lt' }: SubscriptionManagerProps) {
  const t = useTranslations('commerce');
  const tenant = useTenant();
  const entitled = useTenantFeature('subscriptions');

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entitled || !isCommerceConfigured()) return;
    let cancelled = false;
    setLoading(true);
    getSubscriptionPlans(tenant.slug)
      .then((result) => {
        if (!cancelled && result.ok) setPlans(result.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entitled, tenant.slug]);

  // Hide entirely when the tenant's package does not include subscriptions.
  if (!entitled) return null;

  return (
    <section
      aria-label={t('subscriptionTitle')}
      className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-4 font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        {t('subscriptionTitle')}
      </h2>

      {!isCommerceConfigured() ? (
        // Pilot: no commerce backend — no fabricated plans.
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('subscriptionPending')}</p>
      ) : loading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('loading')}</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('noPlans')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
            >
              <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {plan.name}
              </h3>
              <p className="mt-1 text-lg font-semibold">
                {formatEur(plan.amount, locale)}
                <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                  {plan.interval === 'month' ? ` / ${t('perMonth')}` : ` / ${t('perYear')}`}
                </span>
              </p>
              <ul className="mt-2 flex-1 list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  // Stripe-hosted Checkout redirect (SAQ A). Handled by the
                  // backend which returns a checkoutUrl. Not wired in pilot.
                }}
              >
                {t('choosePlan')}
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        {t('subscriptionManageHint')}
      </p>
    </section>
  );
}
