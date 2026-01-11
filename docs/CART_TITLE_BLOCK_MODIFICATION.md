# Cart Title Block - LocalStorage Modification

**File:** `sections/main-cart.liquid` → Cart Title Block
**Purpose:** Replace `cart.empty?` check with LocalStorage-based check
**Date:** 2026-01-12

---

## Original Code

```liquid
{%- if cart.empty? -%}
  {{ 'content.your_cart_is_empty' | t }}
{%- else -%}
  {{ block_settings.title }}
  {%- if block_settings.show_count -%}{% render 'cart-bubble' %}{%- endif -%}
{%- endif -%}
```

**Problem:** Uses `cart.empty?` which checks Shopify native cart, not LocalStorage.

---

## Modified Code

Replace the entire block with this:

```liquid
{% assign block_settings = block.settings %}

<div
  class="cart-title spacing-style text-{{ block_settings.alignment }}"
  style="{% render 'spacing-style', settings: block_settings %}"
  {{ block.shopify_attributes }}
>
  <h1 class="{{ block_settings.type_preset | default: 'h2' }}">
    <span data-priceflow-cart-title>
      {{ block_settings.title }}
      {%- if block_settings.show_count -%}{% render 'cart-bubble' %}{%- endif -%}
    </span>
    <span data-priceflow-empty-cart-title style="display: none;">
      {{ 'content.your_cart_is_empty' | t }}
    </span>
  </h1>
</div>

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
        console.error('Failed to load cart items:', error);
        return [];
      }
    }

    /**
     * Update cart title based on LocalStorage
     */
    function updateCartTitle() {
      const items = getCartItems();
      const isEmpty = items.length === 0;

      const titleElement = document.querySelector('[data-priceflow-cart-title]');
      const emptyTitleElement = document.querySelector('[data-priceflow-empty-cart-title]');

      if (titleElement && emptyTitleElement) {
        if (isEmpty) {
          // Show empty cart message
          titleElement.style.display = 'none';
          emptyTitleElement.style.display = 'inline';
        } else {
          // Show cart title with count
          titleElement.style.display = 'inline';
          emptyTitleElement.style.display = 'none';
        }
      }
    }

    // Initial update on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCartTitle);
    } else {
      updateCartTitle();
    }

    // Listen for cart updates
    window.addEventListener('cartUpdated', function() {
      updateCartTitle();
    });

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', function(event) {
      if (event.key === STORAGE_KEY) {
        updateCartTitle();
      }
    });
  })();
</script>

{% stylesheet %}
  .cart-title h1 {
    margin-block-end: 0;
    display: inline-flex;
    align-items: center;
    gap: var(--gap-sm);
  }

  .cart-title .cart-bubble {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--style-border-radius-buttons-primary);
    aspect-ratio: auto;
    padding: var(--cart-padding);
  }

  .cart-title .cart-bubble[data-maintain-ratio] {
    aspect-ratio: 1;
    min-width: 26px;
  }

  .cart-title .cart-bubble__background {
    background-color: rgb(var(--color-foreground-rgb) / var(--opacity-10-25));
  }

  .cart-title .cart-bubble__text {
    color: var(--color-foreground);
    font-family: var(--font-paragraph--family);
    font-size: clamp(var(--cart-font-size--2xs), 0.7lh, var(--cart-font-size--xs));
  }
{% endstylesheet %}

{% schema %}
{
  "name": "t:names.title",
  "tag": null,
  "settings": [
    {
      "type": "inline_richtext",
      "id": "title",
      "label": "t:settings.cart_title",
      "default": "t:text_defaults.cart"
    },
    {
      "type": "checkbox",
      "id": "show_count",
      "label": "t:settings.cart_count",
      "default": true
    },
    {
      "type": "header",
      "content": "t:content.typography"
    },
    {
      "type": "select",
      "id": "type_preset",
      "label": "t:settings.preset",
      "options": [
        {
          "value": "",
          "label": "t:options.default"
        },
        {
          "value": "paragraph",
          "label": "t:options.paragraph"
        },
        {
          "value": "h1",
          "label": "t:options.h1"
        },
        {
          "value": "h2",
          "label": "t:options.h2"
        },
        {
          "value": "h3",
          "label": "t:options.h3"
        },
        {
          "value": "h4",
          "label": "t:options.h4"
        },
        {
          "value": "h5",
          "label": "t:options.h5"
        },
        {
          "value": "h6",
          "label": "t:options.h6"
        }
      ],
      "default": "",
      "info": "t:info.edit_presets_in_theme_settings"
    },
    {
      "type": "text_alignment",
      "id": "alignment",
      "label": "t:settings.alignment",
      "default": "left"
    },
    {
      "type": "header",
      "content": "t:content.padding"
    },
    {
      "type": "range",
      "id": "padding-block-start",
      "label": "t:settings.top",
      "min": 0,
      "max": 100,
      "step": 1,
      "unit": "px",
      "default": 16
    },
    {
      "type": "range",
      "id": "padding-block-end",
      "label": "t:settings.bottom",
      "min": 0,
      "max": 100,
      "step": 1,
      "unit": "px",
      "default": 0
    },
    {
      "type": "range",
      "id": "padding-inline-start",
      "label": "t:settings.left",
      "min": 0,
      "max": 100,
      "step": 1,
      "unit": "px",
      "default": 0
    },
    {
      "type": "range",
      "id": "padding-inline-end",
      "label": "t:settings.right",
      "min": 0,
      "max": 100,
      "step": 1,
      "unit": "px",
      "default": 0
    }
  ],
  "presets": [
    {
      "name": "t:names.title"
    }
  ]
}
{% endschema %}
```

---

## What Changed

### 1. HTML Structure
**Before:**
```liquid
{%- if cart.empty? -%}
  {{ 'content.your_cart_is_empty' | t }}
{%- else -%}
  {{ block_settings.title }}
  {%- if block_settings.show_count -%}{% render 'cart-bubble' %}{%- endif -%}
{%- endif -%}
```

**After:**
```liquid
<span data-priceflow-cart-title>
  {{ block_settings.title }}
  {%- if block_settings.show_count -%}{% render 'cart-bubble' %}{%- endif -%}
</span>
<span data-priceflow-empty-cart-title style="display: none;">
  {{ 'content.your_cart_is_empty' | t }}
</span>
```

- Both titles are rendered in HTML
- JavaScript toggles visibility based on LocalStorage

### 2. JavaScript Logic
```javascript
function updateCartTitle() {
  const items = getCartItems();
  const isEmpty = items.length === 0;

  if (isEmpty) {
    // Show "Your cart is empty"
    titleElement.style.display = 'none';
    emptyTitleElement.style.display = 'inline';
  } else {
    // Show "Cart" with count bubble
    titleElement.style.display = 'inline';
    emptyTitleElement.style.display = 'none';
  }
}
```

### 3. Event Listeners
- `DOMContentLoaded` - Initial update on page load
- `cartUpdated` - Update when items added/removed
- `storage` - Cross-tab sync when LocalStorage changes

---

## How It Works

1. **Page Load:**
   - Reads `custom-cart-items` from LocalStorage
   - If empty → shows "Your cart is empty"
   - If has items → shows "Cart" with bubble count

2. **Add Item:**
   - PostMessage handler saves to LocalStorage
   - Dispatches `cartUpdated` event
   - Title updates automatically

3. **Cross-Tab Sync:**
   - User opens 2 tabs
   - Adds item in Tab 1
   - Tab 2 listens to `storage` event
   - Title updates in both tabs

---

## Testing

1. **Empty Cart:**
```javascript
localStorage.removeItem('custom-cart-items');
location.reload();
// Should show "Your cart is empty"
```

2. **Add Items:**
```javascript
localStorage.setItem('custom-cart-items', JSON.stringify([
  { id: '1', product_title: 'Test', quantity: 1, final_price: 10 }
]));
window.dispatchEvent(new CustomEvent('cartUpdated'));
// Should show "Cart" with bubble showing "1"
```

3. **Cross-Tab:**
- Open 2 tabs
- Clear cart in Tab 1: `localStorage.removeItem('custom-cart-items')`
- Tab 2 should update to "Your cart is empty"

---

## Where to Find This File

**Shopify Admin:**
1. Online Store → Themes
2. Actions → Edit code
3. Sections → `main-cart.liquid`
4. Find the cart title block (usually around line 50-100)
5. Look for:
```liquid
{% when 'title' %}
  <!-- This is the cart title block -->
```

---

## Notes

- The `{% render 'cart-bubble' %}` already uses LocalStorage (modified separately)
- This modification works with the existing cart-bubble JavaScript
- No conflicts with Shopify native cart
- Fully backward compatible

---

**Status:** ✅ Ready to implement
**Last Updated:** 2026-01-12
