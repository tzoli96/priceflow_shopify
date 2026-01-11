/**
 * Cart TypeScript Interfaces
 * LocalStorage-based cart item types
 */

/**
 * Cart item stored in LocalStorage
 */
export interface CartItem {
  /** Unique ID: "{variantId}:{timestamp}" */
  id: string;

  /** Shopify variant ID */
  variant_id: string;

  /** Product name */
  product_title: string;

  /** Product image URL */
  image: string;

  /** Custom calculated price per unit (in dollars) */
  final_price: number;

  /** Total line price (final_price * quantity) */
  final_line_price: number;

  /** Quantity of units */
  quantity: number;

  /** Custom properties (template selections, custom fields) */
  properties: Record<string, any>;
}

/**
 * Cart totals calculation result
 */
export interface CartTotals {
  /** Total price of all items */
  subtotal: number;

  /** Total number of items (sum of quantities) */
  itemCount: number;

  /** Formatted strings */
  formatted: {
    subtotal: string;
  };
}

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification message
 */
export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
