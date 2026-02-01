/**
 * PriceFlow Cart Items Component
 *
 * MODIFIED: Uses LocalStorage (custom-cart-items) instead of Shopify native cart.
 * All cart operations are performed on LocalStorage data.
 */

const STORAGE_KEY = 'custom-cart-items';

/**
 * Get cart items from LocalStorage
 * @returns {Array} Cart items
 */
function getCartItems() {
  try {
    const items = localStorage.getItem(STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('[Cart Items] Failed to load cart items:', error);
    return [];
  }
}

/**
 * Save cart items to LocalStorage
 * @param {Array} items - Cart items to save
 */
function saveCartItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    dispatchCartUpdated(items);
  } catch (error) {
    console.error('[Cart Items] Failed to save cart items:', error);
  }
}

/**
 * Dispatch cart updated event
 * @param {Array} items - Updated cart items
 */
function dispatchCartUpdated(items) {
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const total = items.reduce((sum, item) => sum + (item.final_line_price || 0), 0);

  window.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: {
      items,
      itemCount,
      total
    }
  }));

  // Also dispatch the theme's CartUpdateEvent for compatibility
  document.dispatchEvent(new CustomEvent('theme:cart:update', {
    detail: {
      data: {
        itemCount,
        items
      }
    }
  }));
}

/**
 * Update item quantity
 * @param {string} itemId - Item ID to update
 * @param {number} quantity - New quantity (0 to remove)
 * @returns {Array} Updated cart items
 */
function updateItemQuantity(itemId, quantity) {
  let items = getCartItems();

  if (quantity <= 0) {
    items = items.filter(item => item.id !== itemId);
  } else {
    items = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          final_line_price: item.final_price * quantity
        };
      }
      return item;
    });
  }

  saveCartItems(items);
  return items;
}

/**
 * Remove item from cart
 * @param {string} itemId - Item ID to remove
 * @returns {Array} Updated cart items
 */
function removeItem(itemId) {
  return updateItemQuantity(itemId, 0);
}

/**
 * A custom element that displays a cart items component.
 * Modified to work with LocalStorage instead of Shopify cart API.
 */
class CartItemsComponent extends HTMLElement {
  constructor() {
    super();
    this._debounceTimer = null;
  }

  connectedCallback() {
    // Listen for cart updates
    window.addEventListener('cartUpdated', this._handleCartUpdate);
    window.addEventListener('storage', this._handleStorageChange);

    // Initial render
    this._renderCartItems();
  }

  disconnectedCallback() {
    window.removeEventListener('cartUpdated', this._handleCartUpdate);
    window.removeEventListener('storage', this._handleStorageChange);
  }

  /**
   * Handle cart update event
   */
  _handleCartUpdate = () => {
    this._renderCartItems();
  };

  /**
   * Handle storage change (cross-tab sync)
   */
  _handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      this._renderCartItems();
    }
  };

  /**
   * Render cart items (triggers re-render of cart-products snippet)
   */
  _renderCartItems() {
    // The actual rendering is handled by the inline script in cart-products.liquid
    // This just ensures the component is aware of changes
    if (window.renderPriceflowCartItems) {
      window.renderPriceflowCartItems();
    }
  }

  /**
   * Handle line item removal (called from cart-products.liquid)
   * @param {number} lineIndex - 1-based line index
   */
  onLineItemRemove(lineIndex) {
    const items = getCartItems();
    const itemToRemove = items[lineIndex - 1];

    if (itemToRemove) {
      removeItem(itemToRemove.id);
    }
  }

  /**
   * Update quantity for a specific line
   * @param {Object} config - Update configuration
   * @param {number} config.line - 1-based line number
   * @param {number} config.quantity - New quantity
   */
  updateQuantity(config) {
    const { line, quantity } = config;
    const items = getCartItems();
    const item = items[line - 1];

    if (item) {
      updateItemQuantity(item.id, quantity);
    }
  }

  /**
   * Get section ID for compatibility
   */
  get sectionId() {
    return this.dataset.sectionId || 'cart-drawer';
  }
}

// Register custom element
if (!customElements.get('cart-items-component')) {
  customElements.define('cart-items-component', CartItemsComponent);
}

// Export functions for global access
window.PriceflowCartItems = {
  getCartItems,
  saveCartItems,
  updateItemQuantity,
  removeItem,
  dispatchCartUpdated
};
