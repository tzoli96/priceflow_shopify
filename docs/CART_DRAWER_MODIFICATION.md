# Cart Drawer Component - LocalStorage Modification

**File:** `snippets/cart-drawer.liquid`
**Purpose:** Replace `cart.empty?` check with LocalStorage-based check
**Date:** 2026-01-12

---

## Modified Code

Replace the entire cart drawer snippet with this:

```liquid
{%- doc -%}
  Renders the cart drawer, a slide-out panel that displays the contents of the cart. It includes the cart icon that acts as a trigger.

  @param {object} [settings] - An object containing theme settings.

  @param {boolean} [settings.auto_open_cart_drawer] - If `true`, the cart drawer opens automatically after an item is
  added.
  @param {string} [settings.drawer_color_scheme] - The color scheme for the drawer.

  MODIFIED: Uses LocalStorage (custom-cart-items) instead of Shopify native cart.
{%- enddoc -%}

<script
  src="{{ 'cart-drawer.js' | asset_url }}"
  type="module"
  fetchpriority="low"
></script>

<cart-drawer-component
  class="cart-drawer"
  {{ block.shopify_attributes }}
  {% if settings.auto_open_cart_drawer %}
    auto-open
  {% endif %}
>
  <button
    class="button header-actions__action button-unstyled"
    on:click="/open"
    aria-haspopup="dialog"
    aria-label="{{ 'accessibility.cart' | t }}"
    aria-describedby="cart-bubble-text"
    data-testid="cart-drawer-trigger"
  >
    {% render 'cart-icon-component' %}
  </button>

  <dialog
    ref="dialog"
    class="cart-drawer__dialog dialog-modal dialog-drawer color-{{ settings.drawer_color_scheme }}"
    data-priceflow-cart-drawer
    aria-labelledby="cart-drawer-heading"
    scroll-lock
  >
    <div class="cart-drawer__inner">
      <cart-items-component
        class="cart-items-component"
        data-section-id="{{ section.id }}"
      >
        {%- comment -%} EMPTY CART STATE {%- endcomment -%}
        <div data-priceflow-empty-state style="display: none;">
          <div class="cart-drawer__header">
            <button
              ref="closeButton"
              on:click="cart-drawer-component/close"
              class="button close-button cart-drawer__close-button button-unstyled"
              aria-label="{{ 'actions.close_dialog' | t }}"
            >
              <span class="svg-wrapper">
                {{- 'icon-close.svg' | inline_asset_content -}}
              </span>
            </button>
          </div>

          <div
            class="cart-drawer__content motion-reduce"
            aria-label="{{ 'accessibility.cart' | t }}"
          >
            <h2
              class="cart-drawer__heading h3 cart-drawer__heading--empty"
              id="cart-drawer-heading-empty"
            >
              {{ 'content.your_cart_is_empty' | t }}
            </h2>

            <div class="cart-drawer__items">
              {% render 'cart-products', drawer_context: 'drawer' %}
            </div>
          </div>
        </div>

        {%- comment -%} CART WITH ITEMS STATE {%- endcomment -%}
        <div data-priceflow-items-state>
          <div
            class="cart-drawer__header"
            id="cart-drawer-header"
          >
            <h2
              class="cart-drawer__heading h3"
              id="cart-drawer-heading"
            >
              {{ 'content.cart_title' | t }}
              {% render 'cart-bubble' %}
            </h2>

            <button
              ref="closeButton"
              on:click="cart-drawer-component/close"
              class="button close-button cart-drawer__close-button button-unstyled"
              aria-label="{{ 'actions.close_dialog' | t }}"
            >
              <span class="svg-wrapper">
                {{- 'icon-close.svg' | inline_asset_content -}}
              </span>
            </button>
          </div>

          <div
            class="cart-drawer__content motion-reduce"
            aria-label="{{ 'accessibility.cart' | t }}"
            style="--header-height: 60px;"
          >
            <scroll-hint
              class="cart-drawer__items"
            >
              {% render 'cart-products', drawer_context: 'drawer' %}
            </scroll-hint>

            <div
              class="cart-drawer__summary"
            >
              {% render 'cart-summary' %}
            </div>
          </div>
        </div>
      </cart-items-component>
    </div>
  </dialog>
</cart-drawer-component>

<script>
  (function() {
    'use strict';

    const STORAGE_KEY = 'custom-cart-items';

    /**
     * Get cart items from LocalStorage
     */
    function getCartItems() {
      try {
        const items = localStorage.getItem(STORAGE_KEY);
        return items ? JSON.parse(items) : [];
      } catch (error) {
        console.error('[Cart Drawer] Failed to load cart items:', error);
        return [];
      }
    }

    /**
     * Update cart drawer state based on LocalStorage
     */
    function updateCartDrawerState() {
      const items = getCartItems();
      const isEmpty = items.length === 0;

      const drawer = document.querySelector('[data-priceflow-cart-drawer]');
      if (!drawer) return;

      const emptyState = drawer.querySelector('[data-priceflow-empty-state]');
      const itemsState = drawer.querySelector('[data-priceflow-items-state]');

      if (emptyState && itemsState) {
        if (isEmpty) {
          // Show empty cart state
          emptyState.style.display = 'block';
          itemsState.style.display = 'none';
          drawer.classList.add('cart-drawer--empty');
          drawer.setAttribute('aria-labelledby', 'cart-drawer-heading-empty');
        } else {
          // Show cart with items
          emptyState.style.display = 'none';
          itemsState.style.display = 'block';
          drawer.classList.remove('cart-drawer--empty');
          drawer.setAttribute('aria-labelledby', 'cart-drawer-heading');
        }
      }
    }

    // Initial update on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCartDrawerState);
    } else {
      updateCartDrawerState();
    }

    // Listen for cart updates
    window.addEventListener('cartUpdated', function() {
      updateCartDrawerState();
    });

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', function(event) {
      if (event.key === STORAGE_KEY) {
        updateCartDrawerState();
      }
    });
  })();
</script>

{% stylesheet %}
  .cart-items-component {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .cart-drawer__heading .cart-bubble {
    width: fit-content;
    border-radius: var(--style-border-radius-buttons-primary);
    aspect-ratio: auto;
    padding: var(--cart-padding);
  }

  .cart-drawer__heading .cart-bubble[data-maintain-ratio] {
    aspect-ratio: 1;
    min-width: 26px;
  }

  .cart-drawer__header {
    background-color: var(--color-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--cart-drawer-padding);
    border-bottom: var(--style-border-width) solid none;
    position: sticky;
    top: 0;
    z-index: 1;

    @media screen and (min-width: 750px) {
      padding: var(--cart-drawer-padding-desktop);
    }
  }

  .cart-drawer__dialog {
    overflow: hidden;
  }

  .cart-drawer__inner {
    height: 100%;
    overflow: hidden;
  }

  .cart-drawer__content {
    height: calc(100% - var(--header-height));
    display: flex;
    flex-direction: column;
  }

  .cart-drawer__summary {
    background-color: var(--color-background);
    position: sticky;
    bottom: 0;
    z-index: 1;
  }
{% endstylesheet %}
```

---

## What Changed

### 1. Removed Liquid Conditionals
**Before:**
```liquid
{%- if cart.empty? -%}
  <!-- Empty state -->
{%- else -%}
  <!-- Items state -->
{%- endif -%}
```

**After:**
```liquid
<!-- Both states rendered in HTML -->
<div data-priceflow-empty-state style="display: none;">
  <!-- Empty state -->
</div>

<div data-priceflow-items-state>
  <!-- Items state -->
</div>
```

### 2. Added JavaScript State Management
```javascript
function updateCartDrawerState() {
  const items = getCartItems();
  const isEmpty = items.length === 0;

  if (isEmpty) {
    emptyState.style.display = 'block';
    itemsState.style.display = 'none';
    drawer.classList.add('cart-drawer--empty');
    drawer.setAttribute('aria-labelledby', 'cart-drawer-heading-empty');
  } else {
    emptyState.style.display = 'none';
    itemsState.style.display = 'block';
    drawer.classList.remove('cart-drawer--empty');
    drawer.setAttribute('aria-labelledby', 'cart-drawer-heading');
  }
}
```

### 3. Dynamic `aria-labelledby`
- Updates based on cart state
- `cart-drawer-heading-empty` when empty
- `cart-drawer-heading` when has items

### 4. Dynamic `cart-drawer--empty` Class
- Adds class when empty for styling
- Removes class when has items

---

## How It Works

### Initial Load
1. Page loads
2. JavaScript reads `custom-cart-items` from LocalStorage
3. If empty → shows "Your cart is empty" state
4. If has items → shows cart with products

### Add Item
1. PostMessage handler saves to LocalStorage
2. Dispatches `cartUpdated` event
3. `updateCartDrawerState()` runs
4. Toggles between empty/items state

### Open Drawer
1. User clicks cart icon
2. Drawer opens
3. Shows correct state based on LocalStorage

### Cross-Tab Sync
1. User opens 2 tabs
2. Adds item in Tab 1
3. Tab 2 listens to `storage` event
4. Drawer state updates in both tabs

---

## Testing

### Test Empty State
```javascript
// In browser console
localStorage.removeItem('custom-cart-items');
window.dispatchEvent(new CustomEvent('cartUpdated'));
// Open drawer → should show "Your cart is empty"
```

### Test Items State
```javascript
localStorage.setItem('custom-cart-items', JSON.stringify([
  {
    id: '1',
    product_title: 'Test Product',
    quantity: 2,
    final_price: 29.99,
    final_line_price: 59.98
  }
]));
window.dispatchEvent(new CustomEvent('cartUpdated'));
// Open drawer → should show cart with items
```

### Test State Toggle
```javascript
// Toggle between states
function toggleCartState() {
  const items = localStorage.getItem('custom-cart-items');
  if (items && JSON.parse(items).length > 0) {
    localStorage.removeItem('custom-cart-items');
  } else {
    localStorage.setItem('custom-cart-items', JSON.stringify([
      { id: '1', product_title: 'Test', quantity: 1, final_price: 10, final_line_price: 10 }
    ]));
  }
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

toggleCartState();
```

---

## Where to Find This File

**Shopify Admin:**
1. Online Store → Themes
2. Actions → Edit code
3. Snippets → `cart-drawer.liquid`

---

## Dependencies

This modification works with:
- ✅ `snippets/cart-bubble.liquid` (modified for LocalStorage)
- ✅ `snippets/cart-products.liquid` (should be modified separately)
- ✅ `snippets/cart-summary.liquid` (should be modified separately)

---

## Notes

- Both states are rendered in HTML on page load
- JavaScript toggles visibility based on LocalStorage
- Fully accessible with dynamic `aria-labelledby`
- Works with existing cart drawer JavaScript (`cart-drawer.js`)
- Auto-open functionality preserved

---

**Status:** ✅ Ready to implement
**Last Updated:** 2026-01-12
