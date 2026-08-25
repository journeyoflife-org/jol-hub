/**
 * Cart React binding — STEP 8.
 *
 * Wraps the pure cart logic from `@jol-hub/commerce` with React state +
 * localStorage persistence so the cart survives client navigation.
 *
 * GDPR Art. 9 / tenant isolation: the persisted cart is NAMESPACED by the
 * tenant slug, so one tenant's cart can never be read by another. The cart
 * holds only product lines (no personal/special-category data).
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addItem as addToCart,
  emptyCart,
  isEmpty as cartIsEmpty,
  removeItem as removeFromCart,
  setQuantity as setCartQuantity,
  subtotal as cartSubtotal,
  unitCount,
  type Cart,
  type CartItem,
} from '@jol-hub/commerce';
import { useTenant } from '@/lib/tenant-context';

const STORAGE_PREFIX = 'jol.cart.v1.';

interface CartContextValue {
  cart: Cart;
  /** Add a line (increments quantity if the line exists). */
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variant?: string) => void;
  setQuantity: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
  /** VAT-inclusive subtotal in cents. */
  subtotalCents: number;
  /** Total units across all lines. */
  itemCount: number;
  isEmpty: boolean;
  /** Slide-out drawer state. */
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const storageKey = `${STORAGE_PREFIX}${tenant.slug}`;

  const [cart, setCart] = useState<Cart>(() => {
    if (typeof window === 'undefined') return emptyCart();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return emptyCart();
      const parsed = JSON.parse(raw) as Cart;
      return Array.isArray(parsed.items) ? parsed : emptyCart();
    } catch {
      return emptyCart();
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // Persist on change (tenant-namespaced).
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      // Storage unavailable (private mode) — cart still works in-memory.
    }
  }, [cart, storageKey]);

  const addItem = useCallback<CartContextValue['addItem']>(
    (item) => setCart((prev) => addToCart(prev, item)),
    [],
  );
  const removeItem = useCallback<CartContextValue['removeItem']>(
    (productId, variant) => setCart((prev) => removeFromCart(prev, productId, variant)),
    [],
  );
  const setQuantity = useCallback<CartContextValue['setQuantity']>(
    (productId, quantity, variant) => setCart((prev) => setCartQuantity(prev, productId, quantity, variant)),
    [],
  );
  const clear = useCallback(() => setCart(emptyCart()), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      addItem,
      removeItem,
      setQuantity,
      clear,
      subtotalCents: cartSubtotal(cart),
      itemCount: unitCount(cart),
      isEmpty: cartIsEmpty(cart),
      isOpen,
      openCart,
      closeCart,
    }),
    [cart, addItem, removeItem, setQuantity, clear, isOpen, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Cart access hook — must be used within <CartProvider>. */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within <CartProvider>');
  }
  return ctx;
}
