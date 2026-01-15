/**
 * PriceFlow Cart Module
 * Handles all cart operations using LocalStorage (custom-cart-items)
 */

const STORAGE_KEY = 'custom-cart-items';

/**
 * @typedef {Object} CartItemProperties
 * @property {string} [variant] - Variant name
 * @property {string} [sku] - SKU
 * @property {string} [pricing_template] - Pricing template name
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - Unique item ID (variant_id:timestamp)
 * @property {string} variant_id - Shopify variant ID
 * @property {string} product_title - Product title
 * @property {string} [image] - Product image URL
 * @property {number} quantity - Item quantity
 * @property {number} final_price - Price per unit
 * @property {number} final_line_price - Total price for this line
 * @property {CartItemProperties} [properties] - Custom properties
 */

/**
 * Get all cart items from LocalStorage
 * @returns {CartItem[]}
 */
export function getCartItems() {
  try {
    const items = localStorage.getItem(STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('[PriceFlow Cart] Failed to load cart items:', error);
    return [];
  }
}

/**
 * Save cart items to LocalStorage
 * @param {CartItem[]} items
 */
export function saveCartItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    dispatchCartUpdated();
  } catch (error) {
    console.error('[PriceFlow Cart] Failed to save cart items:', error);
  }
}

/**
 * Get total item count in cart
 * @returns {number}
 */
export function getCartItemCount() {
  const items = getCartItems();
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/**
 * Get cart total price
 * @returns {number}
 */
export function getCartTotal() {
  const items = getCartItems();
  return items.reduce((sum, item) => sum + (item.final_line_price || 0), 0);
}

/**
 * Update item quantity by ID
 * @param {string} itemId - The unique item ID
 * @param {number} quantity - New quantity (0 to remove)
 * @returns {CartItem[]} Updated cart items
 */
export function updateItemQuantity(itemId, quantity) {
  let items = getCartItems();

  if (quantity <= 0) {
    // Remove item
    items = items.filter(item => item.id !== itemId);
  } else {
    // Update quantity
    items = items.map(item => {
      if (item.id === itemId) {
        const newLinePrice = item.final_price * quantity;
        return {
          ...item,
          quantity,
          final_line_price: newLinePrice
        };
      }
      return item;
    });
  }

  saveCartItems(items);
  return items;
}

/**
 * Remove item from cart by ID
 * @param {string} itemId - The unique item ID
 * @returns {CartItem[]} Updated cart items
 */
export function removeItem(itemId) {
  return updateItemQuantity(itemId, 0);
}

/**
 * Clear all items from cart
 * @returns {CartItem[]} Empty array
 */
export function clearCart() {
  saveCartItems([]);
  return [];
}

/**
 * Format price for display
 * @param {number} price - Price in currency units
 * @param {string} [currency='HUF'] - Currency code
 * @returns {string} Formatted price
 */
export function formatPrice(price, currency = 'HUF') {
  // Check if Shopify's formatMoney is available
  if (window.Shopify?.formatMoney) {
    return window.Shopify.formatMoney(price * 100);
  }

  // Fallback formatting
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Dispatch cart updated event
 */
export function dispatchCartUpdated() {
  window.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: {
      items: getCartItems(),
      itemCount: getCartItemCount(),
      total: getCartTotal()
    }
  }));
}

/**
 * Check if cart is empty
 * @returns {boolean}
 */
export function isCartEmpty() {
  return getCartItems().length === 0;
}

// Export for global access
window.PriceflowCart = {
  getCartItems,
  saveCartItems,
  getCartItemCount,
  getCartTotal,
  updateItemQuantity,
  removeItem,
  clearCart,
  formatPrice,
  dispatchCartUpdated,
  isCartEmpty,
  STORAGE_KEY
};
