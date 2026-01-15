/**
 * PriceFlow Cart Icon Component
 *
 * MODIFIED: Uses LocalStorage (custom-cart-items) instead of Shopify native cart.
 * Cart count is calculated from LocalStorage data.
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
 */
class CartIcon extends HTMLElement {
  constructor() {
    super();
    this._cartBubble = null;
    this._cartBubbleText = null;
    this._cartBubbleCount = null;
  }

  connectedCallback() {
    // Get references to child elements
    this._cartBubble = this.querySelector('[ref="cartBubble"]') || this.querySelector('[data-priceflow-cart-bubble]');
    this._cartBubbleText = this.querySelector('[ref="cartBubbleText"]');
    this._cartBubbleCount = this.querySelector('[ref="cartBubbleCount"]') || this.querySelector('[data-priceflow-cart-count]');

    // Listen for cart updates
    window.addEventListener('cartUpdated', this._handleCartUpdate);
    window.addEventListener('storage', this._handleStorageChange);
    window.addEventListener('pageshow', this._handlePageShow);

    // Initial render
    this._updateCartBubble();
  }

  disconnectedCallback() {
    window.removeEventListener('cartUpdated', this._handleCartUpdate);
    window.removeEventListener('storage', this._handleStorageChange);
    window.removeEventListener('pageshow', this._handlePageShow);
  }

  /**
   * Handle cart update event
   */
  _handleCartUpdate = (event) => {
    const itemCount = event.detail?.itemCount ?? getCartItemCount();
    this._renderCartBubble(itemCount, false, true);
  };

  /**
   * Handle storage change (cross-tab sync)
   */
  _handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      this._updateCartBubble();
    }
  };

  /**
   * Handle page show (restore from bfcache)
   */
  _handlePageShow = (event) => {
    if (event.persisted) {
      this._updateCartBubble();
    }
  };

  /**
   * Update cart bubble from LocalStorage
   */
  _updateCartBubble() {
    const itemCount = getCartItemCount();
    this._renderCartBubble(itemCount, false, false);
  }

  /**
   * Get current cart count from display
   * @returns {number} Current displayed count
   */
  get currentCartCount() {
    if (!this._cartBubbleCount) return 0;
    const text = this._cartBubbleCount.textContent || '0';
    return parseInt(text.replace('+', ''), 10) || 0;
  }

  /**
   * Set current cart count display
   * @param {number} value - New count value
   */
  set currentCartCount(value) {
    if (!this._cartBubbleCount) return;
    this._cartBubbleCount.textContent = value < 100 ? String(value) : '99+';
  }

  /**
   * Render the cart bubble with count
   * @param {number} itemCount - Number of items in cart
   * @param {boolean} isAddition - Whether this is adding to current count
   * @param {boolean} animate - Whether to animate the bubble
   */
  _renderCartBubble(itemCount, isAddition = false, animate = true) {
    if (!this._cartBubble || !this._cartBubbleCount) return;

    // Update visibility
    const isEmpty = itemCount === 0;

    if (this._cartBubbleCount.classList) {
      this._cartBubbleCount.classList.toggle('hidden', isEmpty);
    }

    if (this._cartBubble.classList) {
      this._cartBubble.classList.toggle('visually-hidden', isEmpty);

      if (animate && !isEmpty) {
        this._cartBubble.classList.add('cart-bubble--animating');

        // Remove animation class after animation completes
        setTimeout(() => {
          this._cartBubble.classList.remove('cart-bubble--animating');
        }, 300);
      }
    }

    // Update count
    this.currentCartCount = isAddition ? this.currentCartCount + itemCount : itemCount;

    // Update has-cart class
    this.classList.toggle('header-actions__cart-icon--has-cart', !isEmpty);

    // Store in session for quick recovery
    sessionStorage.setItem('cart-count', JSON.stringify({
      value: String(this.currentCartCount),
      timestamp: Date.now()
    }));
  }
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
