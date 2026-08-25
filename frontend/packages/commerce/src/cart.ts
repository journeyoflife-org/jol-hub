/**
 * Cart logic — STEP 8.
 *
 * Pure, immutable cart operations (add / remove / set-quantity / subtotal).
 * Prices are VAT-inclusive cents; the VAT breakdown is derived at display time
 * (money.ts). No side effects — the React binding (template renderer) owns
 * persistence. Fully unit-testable.
 */
import type { Cart, CartItem, Cents } from './types';
import { lineTotal } from './money';

/** An empty cart. */
export function emptyCart(): Cart {
  return { items: [] };
}

/** Composite key so the same product with different variants stays separate. */
function itemKey(productId: string, variant?: string): string {
  return variant ? `${productId}::${variant}` : productId;
}

/**
 * Add a product to the cart (increments quantity if the line already exists).
 * Returns a NEW cart (immutable).
 */
export function addItem(
  cart: Cart,
  item: Omit<CartItem, 'quantity'> & { quantity?: number },
): Cart {
  const add = Math.max(1, item.quantity ?? 1);
  const key = itemKey(item.productId, item.variant);
  const existing = cart.items.find((it) => itemKey(it.productId, it.variant) === key);

  if (existing) {
    return {
      items: cart.items.map((it) =>
        itemKey(it.productId, it.variant) === key
          ? { ...it, quantity: it.quantity + add }
          : it,
      ),
    };
  }
  return { items: [...cart.items, { ...item, quantity: add }] };
}

/** Remove a line from the cart. Returns a NEW cart. */
export function removeItem(cart: Cart, productId: string, variant?: string): Cart {
  const key = itemKey(productId, variant);
  return { items: cart.items.filter((it) => itemKey(it.productId, it.variant) !== key) };
}

/**
 * Set a line's quantity. Quantities < 1 remove the line. Returns a NEW cart.
 */
export function setQuantity(cart: Cart, productId: string, quantity: number, variant?: string): Cart {
  const key = itemKey(productId, variant);
  if (quantity < 1) return removeItem(cart, productId, variant);
  return {
    items: cart.items.map((it) =>
      itemKey(it.productId, it.variant) === key ? { ...it, quantity } : it,
    ),
  };
}

/** Number of distinct lines in the cart. */
export function lineCount(cart: Cart): number {
  return cart.items.length;
}

/** Total units across all lines. */
export function unitCount(cart: Cart): number {
  return cart.items.reduce((sum, it) => sum + it.quantity, 0);
}

/** VAT-inclusive subtotal (cents). */
export function subtotal(cart: Cart): Cents {
  return cart.items.reduce((sum, it) => sum + lineTotal(it.unitPrice, it.quantity), 0);
}

/** True when the cart has no lines. */
export function isEmpty(cart: Cart): boolean {
  return cart.items.length === 0;
}
