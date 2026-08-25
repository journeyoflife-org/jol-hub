/**
 * Hook unit tests — STEP 15 (vitest + RTL).
 *
 * useTranslations (i18n lookup + missing-key contract) and the renderer's
 * tenant/cart hooks (feature gating + tenant-namespaced persistence —
 * GDPR Art. 9 cross-tenant isolation at the storage layer).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { renderWithProviders, mockTenant, mockCheapTenant } from '@jol-hub/testing';
import { toPublicTenant } from '@jol-hub/tenant-resolver';
import { TenantProvider, useTenant, useTenantFeature } from '@/lib/tenant-context';
import { CartProvider, useCart } from '@/components/commerce/cart-context';

describe('useTranslations', () => {
  it('useTranslations.should.resolve namespaced keys', () => {
    const { container } = renderWithProviders(<Probe k="navigation.home" />);
    expect(container.textContent).toBe('Pradžia');
  });

  it('useTranslations.should.switch language with the locale option', () => {
    const { container } = renderWithProviders(<Probe k="navigation.home" />, { locale: 'en' });
    expect(container.textContent).toBe('Home');
  });

  it('useTranslations.should.return the key path for missing keys (visible regression signal)', () => {
    const { container } = renderWithProviders(<Probe k="navigation.definitelyMissing" />);
    expect(container.textContent).toBe('navigation.definitelyMissing');
  });
});

function Probe({ k }: { k: string }) {
  const t = useTranslations();
  return <output>{t(k)}</output>;
}

describe('tenant feature gating', () => {
  function featureWrapper(tenantSlug: 'test-church' | 'test-cheap') {
    const tenant = tenantSlug === 'test-church' ? mockTenant() : mockCheapTenant();
    return function Wrapper({ children }: { children: ReactNode }) {
      return <TenantProvider tenant={toPublicTenant(tenant)}>{children}</TenantProvider>;
    };
  }

  it('useTenantFeature.should.allow editing on NORMAL tenants', () => {
    const { result } = renderHook(() => useTenantFeature('content-editing'), {
      wrapper: featureWrapper('test-church'),
    });
    expect(result.current).toBe(true);
  });

  it('useTenantFeature.should.deny editing on CHEAP tenants (read-only tier)', () => {
    const { result } = renderHook(() => useTenantFeature('content-editing'), {
      wrapper: featureWrapper('test-cheap'),
    });
    expect(result.current).toBe(false);
  });

  it('useTenant.should.expose the tenant slug without the server schema', () => {
    const { result } = renderHook(() => useTenant(), { wrapper: featureWrapper('test-church') });
    expect(result.current.slug).toBe('test-church');
    expect((result.current as Record<string, unknown>).schema).toBeUndefined();
  });
});

describe('useCart (tenant-namespaced persistence)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function cartWrapper() {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <TenantProvider tenant={toPublicTenant(mockTenant())}>
        <CartProvider>{children}</CartProvider>
      </TenantProvider>
    );
    return Wrapper;
  }

  it('useCart.should.add items and compute VAT-inclusive subtotal', () => {
    const { result } = renderHook(() => useCart(), { wrapper: cartWrapper() });
    act(() => {
      result.current.addItem({ productId: 'p1', name: 'Candles', unitPrice: 1500 });
      result.current.addItem({ productId: 'p1', name: 'Candles', unitPrice: 1500 });
    });
    expect(result.current.itemCount).toBe(2);
    expect(result.current.subtotalCents).toBe(3000);
    expect(result.current.isEmpty).toBe(false);
  });

  it('useCart.should.remove and clear items', () => {
    const { result } = renderHook(() => useCart(), { wrapper: cartWrapper() });
    act(() => {
      result.current.addItem({ productId: 'p1', name: 'Candles', unitPrice: 1500 });
    });
    act(() => {
      result.current.removeItem('p1');
    });
    expect(result.current.isEmpty).toBe(true);
    act(() => {
      result.current.addItem({ productId: 'p2', name: 'Flowers', unitPrice: 2500 });
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.isEmpty).toBe(true);
  });

  it('useCart.should.persist under the tenant namespace only', () => {
    const { result } = renderHook(() => useCart(), { wrapper: cartWrapper() });
    act(() => {
      result.current.addItem({ productId: 'p1', name: 'Candles', unitPrice: 1500 });
    });
    const stored = window.localStorage.getItem('jol.cart.v1.test-church');
    expect(stored).toBeTruthy();
    // Isolation: no other tenant key, no schema/global key.
    const keys = Object.keys(window.localStorage);
    expect(keys.filter((k) => k.startsWith('jol.cart.v1.'))).toEqual(['jol.cart.v1.test-church']);
  });
});
