/**
 * Cart Calculation Utilities
 * Helper functions for cart calculations and formatting
 */

import { CartItem, CartTotals } from '@/types/cart';

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.final_line_price, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    itemCount,
    formatted: {
      subtotal: formatMoney(subtotal),
    },
  };
}

/**
 * Format money (dollars to formatted string)
 * @param amount Amount in dollars
 * @returns Formatted string (e.g., "$49.99")
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Recalculate line price based on quantity
 */
export function recalculateLinePrice(item: CartItem): CartItem {
  return {
    ...item,
    final_line_price: item.final_price * item.quantity,
  };
}

/**
 * Validate cart item data
 */
export function validateCartItem(item: Partial<CartItem>): boolean {
  if (!item.variant_id || typeof item.variant_id !== 'string') return false;
  if (!item.product_title || typeof item.product_title !== 'string') return false;
  if (typeof item.final_price !== 'number' || item.final_price < 0) return false;
  if (typeof item.quantity !== 'number' || item.quantity < 1) return false;

  return true;
}

/**
 * Generate unique cart item ID
 */
export function generateCartItemId(variantId: string): string {
  return `${variantId}:${Date.now()}`;
}
