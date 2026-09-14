/**
 * CartShell — STEP 8 (shop).
 *
 * Slide-out cart drawer: line items with quantity adjust + remove, a
 * VAT-INCLUSIVE subtotal with the LT 21% VAT breakdown, and the required
 * terms & refund-policy links before checkout.
 *
 * PCI-DSS (SAQ A, ADR-0005): the checkout button hands off to the internal
 * payment API / Stripe-hosted Checkout — this shell NEVER collects card data.
 * In the pilot (no commerce backend) checkout is disabled with a notice.
 */
'use client';

import { formatEur, vatBreakdown } from '@jol-hub/commerce';
import { isCommerceConfigured } from '@jol-hub/commerce';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { Button } from '@jol-hub/ui/components/primitives';
import { useCart } from './cart-context';

export interface CartShellProps {
  locale?: string;
  /** Terms & conditions + refund policy URLs (tenant-scoped). */
  termsUrl?: string;
  refundUrl?: string;
}

export function CartShell({ locale = 'lt', termsUrl = '#', refundUrl = '#' }: CartShellProps) {
  const t = useTranslations('commerce');
  const { cart, isOpen, closeCart, removeItem, setQuantity, subtotalCents, isEmpty } = useCart();

  if (!isOpen) return null;

  const breakdown = vatBreakdown(subtotalCents);
  const checkoutReady = isCommerceConfigured();

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('cartTitle')}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t('closeCart')}
        onClick={closeCart}
        className="absolute inset-0 h-full w-full bg-black/40"
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {t('cartTitle')}
          </h2>
          <Button variant="ghost" size="sm" onClick={closeCart} aria-label={t('closeCart')}>
            ✕
          </Button>
        </div>

        {isEmpty ? (
          <p className="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('cartEmpty')}</p>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-200 overflow-y-auto p-4 dark:divide-neutral-800">
              {cart.items.map((item) => {
                const key = item.variant ? `${item.productId}::${item.variant}` : item.productId;
                return (
                  <li key={key} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {item.name}
                      </p>
                      {item.variant ? (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.variant}</p>
                      ) : null}
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {formatEur(item.unitPrice, locale)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1" aria-label={t('quantity')}>
                      <Button
                        variant="secondary"
                        size="xs"
                        aria-label={t('decrease')}
                        onClick={() => setQuantity(item.productId, item.quantity - 1, item.variant)}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm" aria-live="polite">
                        {item.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="xs"
                        aria-label={t('increase')}
                        onClick={() => setQuantity(item.productId, item.quantity + 1, item.variant)}
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${t('remove')}: ${item.name}`}
                      onClick={() => removeItem(item.productId, item.variant)}
                    >
                      {t('remove')}
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-600 dark:text-neutral-300">{t('subtotalLabel')}</dt>
                  <dd className="font-medium">{formatEur(breakdown.totalInclusive, locale)}</dd>
                </div>
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <dt>{t('vatIncluded', { rate: Math.round(breakdown.rate * 100) })}</dt>
                  <dd>{formatEur(breakdown.vat, locale)}</dd>
                </div>
              </dl>

              <Button className="mt-4 w-full" disabled={!checkoutReady}>
                {t('checkout')}
              </Button>

              {!checkoutReady ? (
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t('paymentsPending')}</p>
              ) : null}

              <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
                <a href={termsUrl} className="underline">
                  {t('termsLink')}
                </a>
                {' · '}
                <a href={refundUrl} className="underline">
                  {t('refundLink')}
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
