/**
 * PriceFlow Cart Icon Component
 *
 * MODIFIED: Uses LocalStorage (custom-cart-items) instead of Shopify native cart.
 * Cart count is calculated from LocalStorage data.
 *
 * NOTE: The actual cart bubble updates are handled by cart-bubble.liquid inline script.
 * This component just provides the custom element wrapper and animation support.
 */

console.log('[CartIcon Module] Loading cart-icon.js...');

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
    console.error('[Cart Icon] Failed to load cart items:', error);
    return [];
  }
}

/**
 * Get total item count from LocalStorage cart
 * @returns {number} Total item count
 */
function getCartItemCount() {
  const items = getCartItems();
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/**
 * A custom element that displays a cart icon with item count bubble.
 * Modified to work with LocalStorage instead of Shopify cart API.
 *
 * The actual bubble updates are handled by the global updatePriceflowCartBubble function
 * from cart-bubble.liquid to prevent duplicate/conflicting updates.
 */
class CartIcon extends HTMLElement {
  constructor() {
    super();
    this._cartBubble = null;
  }

  connectedCallback() {
    console.log('[CartIcon] connectedCallback - element connected');

    // Get reference to cart bubble
    this._cartBubble = this.querySelector('[data-priceflow-cart-bubble]');

    // Listen for cart updates to trigger animation
    window.addEventListener('cartUpdated', this._handleCartUpdate);

    // Trigger global cart bubble update to ensure correct initial state
    if (window.updatePriceflowCartBubble) {
      console.log('[CartIcon] Triggering global cart bubble update');
      window.updatePriceflowCartBubble();
    }
  }

  disconnectedCallback() {
    window.removeEventListener('cartUpdated', this._handleCartUpdate);
  }

  /**
   * Handle cart update event - only triggers animation
   * The actual count update is handled by cart-bubble.liquid
   */
  _handleCartUpdate = (event) => {
    console.log('[CartIcon] cartUpdated event - triggering animation');

    // Trigger animation on the bubble
    if (this._cartBubble && this._cartBubble.classList) {
      const itemCount = getCartItemCount();
      if (itemCount > 0) {
        this._cartBubble.classList.add('cart-bubble--animating');
        setTimeout(() => {
          this._cartBubble.classList.remove('cart-bubble--animating');
        }, 300);
      }
    }
  };
}

// Register custom element
if (!customElements.get('cart-icon')) {
  customElements.define('cart-icon', CartIcon);
}

// Export for global access
window.PriceflowCartIcon = {
  getCartItems,
  getCartItemCount
};
