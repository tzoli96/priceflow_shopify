/**
 * Cart Storage Utilities
 * LocalStorage operations for cart management
 */

import { CartItem } from '@/types/cart';

const CART_STORAGE_KEY = 'custom-cart-items';

/**
 * Get all cart items from LocalStorage
 */
export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const items = localStorage.getItem(CART_STORAGE_KEY);
    if (!items) return [];

    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load cart items from LocalStorage:', error);
    return [];
  }
}

/**
 * Save cart items to LocalStorage
 */
export function saveCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(
      new CustomEvent('cartUpdated', {
        detail: { items },
      })
    );
  } catch (error) {
    console.error('Failed to save cart items to LocalStorage:', error);
    throw new Error('Cart storage failed. Your cart may be full.');
  }
}

/**
 * Clear all cart items from LocalStorage
 */
export function clearCartStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CART_STORAGE_KEY);

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('cartUpdated', {
        detail: { items: [] },
      })
    );
  } catch (error) {
    console.error('Failed to clear cart from LocalStorage:', error);
  }
}

/**
 * Check if two items are duplicates (same variant + properties)
 */
export function isDuplicateItem(
  item1: Pick<CartItem, 'variant_id' | 'properties'>,
  item2: Pick<CartItem, 'variant_id' | 'properties'>
): boolean {
  if (item1.variant_id !== item2.variant_id) return false;

  // Compare properties (deep equality check)
  return JSON.stringify(item1.properties) === JSON.stringify(item2.properties);
}
