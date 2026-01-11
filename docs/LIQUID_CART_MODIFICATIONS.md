# Liquid Cart Components Modifications

**Date:** 2026-01-11
**Purpose:** Replace Shopify native cart with LocalStorage cart items
**Status:** Ready for Implementation

---

## Files to Modify

```
shopify-theme/
├── snippets/
│   ├── cart-bubble.liquid     # MODIFY: Read from LocalStorage
│   └── cart-icon.liquid        # MODIFY: Add JavaScript for dynamic updates
```

---

## 1. Modified `snippets/cart-bubble.liquid`

**Original:** Uses `{{ cart.item_count }}`
**Modified:** JavaScript reads from LocalStorage

```liquid
{%- doc -%}
  @param [limit] - {number}
  @param [live_region] - {boolean}

  The maximum number of items in the cart to display. If the number of items in the cart is greater than this limit, the
  count will be displayed as "99+".

  MODIFIED: Reads cart items from LocalStorage (custom-cart-items) instead of Shopify native cart.
{%- enddoc -%}

<div
  ref="cartBubble"
  class="cart-bubble visually-hidden"
  data-priceflow-cart-bubble
  data-maintain-ratio
>
  <span class="cart-bubble__background"></span>
  <span
    ref="cartBubbleText"
    id="cart-bubble-text"
    class="cart-bubble__text"
    {% if live_region %}
      role="status"
    {% endif %}
  >
    <span class="visually-hidden">
      {{- 'accessibility.cart_count' | t -}}
      : <span data-priceflow-cart-count-sr>0</span>
    </span>
    <span
      class="cart-bubble__text-count hidden"
      ref="cartBubbleCount"
      aria-hidden="true"
      data-testid="cart-bubble"
      data-priceflow-cart-count
      data-limit="{{ limit | default: 100 }}"
    >
      0
    </span>
  </span>
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
     * Update cart bubble
     */
    function updateCartBubble() {
      const items = getCartItems();
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      // Find all cart bubble elements
      const bubbles = document.querySelectorAll('[data-priceflow-cart-bubble]');

      bubbles.forEach(function(bubble) {
        const countElement = bubble.querySelector('[data-priceflow-cart-count]');
        const countSR = bubble.querySelector('[data-priceflow-cart-count-sr]');
        const textCount = bubble.querySelector('.cart-bubble__text-count');
        const limit = parseInt(countElement?.dataset.limit || '100', 10);

        if (!countElement) return;

        // Update count
        if (itemCount === 0) {
          // Hide bubble if cart is empty
          bubble.classList.add('visually-hidden');
          textCount?.classList.add('hidden');
          countElement.textContent = '';
        } else {
          // Show bubble with count
          bubble.classList.remove('visually-hidden');
          textCount?.classList.remove('hidden');

          // Display count or 99+ if over limit
          if (itemCount < limit) {
            countElement.textContent = itemCount;
            if (countSR) countSR.textContent = itemCount;
          } else {
            countElement.textContent = limit + '+';
            if (countSR) countSR.textContent = limit + '+';
          }

          // Update data-maintain-ratio based on count
          if (itemCount <= 99) {
            bubble.setAttribute('data-maintain-ratio', '');
          } else {
            bubble.removeAttribute('data-maintain-ratio');
          }
        }
      });
    }

    // Initial update on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCartBubble);
    } else {
      updateCartBubble();
    }

    // Listen for cart updates (same page)
    window.addEventListener('cartUpdated', function(event) {
      updateCartBubble();
    });

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', function(event) {
      if (event.key === STORAGE_KEY) {
        updateCartBubble();
      }
    });

    // Export function for manual updates
    window.updatePriceflowCartBubble = updateCartBubble;
  })();
</script>
```

---

## 2. Modified `snippets/cart-icon.liquid`

**Original:** Opens `/cart` page
**Modified:** Opens PriceFlow minicart drawer

```liquid
{%- doc -%}
  Renders the cart icon, which displays the number of items in the cart via a bubble.

  MODIFIED: Opens PriceFlow minicart drawer instead of native cart page.
{%- enddoc -%}

<cart-icon
  class="
    header-actions__cart-icon
    header-actions__cart-icon--priceflow
  "
  data-testid="cart-icon"
  data-priceflow-cart-icon
>
  <a
    href="#"
    onclick="openPriceflowCart(); return false;"
    aria-label="Open cart"
    class="cart-icon__link"
  >
    <span
      class="svg-wrapper"
      aria-hidden="true"
    >
      {{ 'icon-cart.svg' | inline_asset_content }}
    </span>

    {% render 'cart-bubble', limit: 100, live_region: true, test_id: test_id %}
  </a>
</cart-icon>

{% stylesheet %}
  cart-icon:has(.cart-bubble__text-count:empty) {
    --cart-bubble-size: 10px;
    --cart-bubble-top: 9px;
    --cart-bubble-right: 9px;

    .svg-wrapper {
      --cart-bubble-top: 4px;
      --cart-bubble-right: 4px;
    }
  }

  .cart-icon__link {
    display: inline-flex;
    align-items: center;
    position: relative;
    text-decoration: none;
    color: inherit;
  }
{% endstylesheet %}

<script>
  // Global functions for opening/closing cart drawer
  // These will be used by the priceflow-minicart section

  window.openPriceflowCart = function() {
    const drawer = document.getElementById('priceflow-minicart-drawer');
    if (drawer) {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    } else {
      console.warn('PriceFlow minicart drawer not found. Make sure the priceflow-minicart section is included in theme.liquid');
    }
  };

  window.closePriceflowCart = function() {
    const drawer = document.getElementById('priceflow-minicart-drawer');
    if (drawer) {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  };
</script>
```

---

## 3. Ellenőrzés: Header vagy Theme fájlban

Keresd meg, hol van a `cart-icon` snippet renderelve. Általában:

- `sections/header.liquid`
- `sections/announcement-bar.liquid`
- `layout/theme.liquid`

**Keresés:**

```liquid
{% render 'cart-icon' %}
```

**Nincs módosítás szükséges**, de győződj meg róla, hogy a snippet renderelve van valahol a témában.

---

## 4. Minicart Section hozzáadása (Ha még nincs)

Ha még nem adtad hozzá a minicart drawer section-t, hozd létre:

### `sections/priceflow-minicart.liquid`

```liquid
{% comment %}
  PriceFlow Minicart Drawer
  Betölti a /minicart oldalt iframe-ben
{% endcomment %}

<div id="priceflow-minicart-drawer" class="priceflow-drawer" style="display: none;">
  <!-- Overlay -->
  <div class="priceflow-drawer__overlay" onclick="closePriceflowCart()"></div>

  <!-- Drawer Container -->
  <div class="priceflow-drawer__container">
    <iframe
      id="priceflow-minicart-iframe"
      src="{{ section.settings.minicart_url }}"
      style="width: 100%; height: 100%; border: none;"
      allow="clipboard-write"
    ></iframe>
  </div>
</div>

<style>
  .priceflow-drawer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }

  .priceflow-drawer__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }

  .priceflow-drawer__container {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 400px;
    background: white;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }

  .priceflow-drawer.is-open {
    display: block;
  }

  .priceflow-drawer.is-open .priceflow-drawer__container {
    transform: translateX(0);
  }

  @media (max-width: 640px) {
    .priceflow-drawer__container {
      max-width: 100%;
    }
  }
</style>

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
     * Save cart items to LocalStorage
     */
    function saveCartItems(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items } }));

        // Update cart bubble
        if (window.updatePriceflowCartBubble) {
          window.updatePriceflowCartBubble();
        }

        // Notify iframe of cart update
        const iframe = document.getElementById('priceflow-minicart-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'CART_DATA',
            items: items
          }, '*');
        }
      } catch (error) {
        console.error('Failed to save cart items:', error);
      }
    }

    /**
     * Add item to cart
     */
    function addItemToCart(item) {
      const items = getCartItems();

      // Generate unique ID
      const newItem = {
        id: item.variant_id + ':' + Date.now(),
        variant_id: item.variant_id,
        product_title: item.product_title,
        image: item.image,
        final_price: item.final_price,
        final_line_price: item.final_price * item.quantity,
        quantity: item.quantity,
        properties: item.properties || {}
      };

      // Check for duplicate (same variant + properties)
      const existingIndex = items.findIndex(function(i) {
        return i.variant_id === newItem.variant_id &&
               JSON.stringify(i.properties) === JSON.stringify(newItem.properties);
      });

      if (existingIndex !== -1) {
        // Update quantity of existing item
        items[existingIndex].quantity += newItem.quantity;
        items[existingIndex].final_line_price = items[existingIndex].final_price * items[existingIndex].quantity;
      } else {
        // Add new item
        items.push(newItem);
      }

      saveCartItems(items);
    }

    /**
     * Update item quantity
     */
    function updateItemQuantity(itemId, quantity) {
      const items = getCartItems();
      const itemIndex = items.findIndex(function(i) { return i.id === itemId; });

      if (itemIndex !== -1) {
        items[itemIndex].quantity = quantity;
        items[itemIndex].final_line_price = items[itemIndex].final_price * quantity;
        saveCartItems(items);
      }
    }

    /**
     * Remove item from cart
     */
    function removeItemFromCart(itemId) {
      const items = getCartItems();
      const filteredItems = items.filter(function(i) { return i.id !== itemId; });
      saveCartItems(filteredItems);
    }

    /**
     * Listen for messages from iframes
     */
    window.addEventListener('message', function(event) {
      // TODO: Add origin check in production
      // if (event.origin !== 'https://app.teszt.uk') return;

      const data = event.data;

      // Handle different message types
      if (data.type === 'CLOSE_CART') {
        closePriceflowCart();
      }

      if (data.type === 'ADD_TO_CART') {
        addItemToCart(data.item);
      }

      if (data.type === 'UPDATE_QUANTITY') {
        updateItemQuantity(data.itemId, data.quantity);
      }

      if (data.type === 'REMOVE_ITEM') {
        removeItemFromCart(data.itemId);
      }

      if (data.type === 'REQUEST_CART_DATA') {
        // Minicart iframe requests cart data
        const iframe = document.getElementById('priceflow-minicart-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'CART_DATA',
            items: getCartItems()
          }, '*');
        }
      }

      if (data.type === 'CART_UPDATED') {
        // Update cart bubble when minicart reports changes
        if (window.updatePriceflowCartBubble) {
          window.updatePriceflowCartBubble();
        }
      }
    });

    // When drawer opens, send current cart data to iframe
    const originalOpen = window.openPriceflowCart;
    window.openPriceflowCart = function() {
      if (originalOpen) originalOpen();

      // Send cart data to iframe after a short delay
      setTimeout(function() {
        const iframe = document.getElementById('priceflow-minicart-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'CART_DATA',
            items: getCartItems()
          }, '*');
        }
      }, 100);
    };
  })();
</script>

{% schema %}
{
  "name": "PriceFlow Minicart",
  "settings": [
    {
      "type": "text",
      "id": "minicart_url",
      "label": "Minicart URL",
      "default": "https://app.teszt.uk/storefront/minicart",
      "info": "URL of the PriceFlow storefront minicart page"
    }
  ]
}
{% endschema %}
```

### Add hozzá a `layout/theme.liquid`-hez (ha még nincs):

```liquid
  {% section 'priceflow-minicart' %}
</body>
</html>
```

---

## Összefoglaló módosítások

### 1. **`cart-bubble.liquid` módosítások:**

- ❌ Removed: `{{ cart.item_count }}`
- ✅ Added: JavaScript LocalStorage olvasás
- ✅ Added: `data-priceflow-cart-count` attribute
- ✅ Added: Auto-update on `cartUpdated` event
- ✅ Added: Cross-tab sync (storage event)
- ✅ Added: Dynamic visibility (visually-hidden class)

### 2. **`cart-icon.liquid` módosítások:**

- ❌ Removed: Direct link to `/cart`
- ✅ Added: `onclick="openPriceflowCart()"`
- ✅ Added: Global functions (openPriceflowCart, closePriceflowCart)
- ✅ Added: `data-priceflow-cart-icon` attribute

### 3. **`priceflow-minicart.liquid` (új section):**

- ✅ Drawer overlay + container
- ✅ Iframe minicart betöltés
- ✅ PostMessage kommunikáció
- ✅ Responsive design

---

## Tesztelési lépések

1. ✅ **Deploy módosítások:**
   - Módosítsd a `cart-bubble.liquid` snippet-et
   - Módosítsd a `cart-icon.liquid` snippet-et
   - Hozd létre a `priceflow-minicart.liquid` section-t
   - Add hozzá a section-t a `theme.liquid`-hez

2. ✅ **Ellenőrzés:**
   - Nyisd meg a storefront-ot
   - Cart bubble 0-t mutat (üres cart)
   - Add hozzá egy terméket az AddToCartButton-nal
   - Cart bubble frissül (1, 2, 3...)
   - Kattints a cart icon-ra → Minicart drawer kinyílik

3. ✅ **Cross-tab sync teszt:**
   - Nyiss meg 2 browser tab-ot
   - Add hozzá terméket az egyik tab-on
   - Másik tab cart badge automatikusan frissül

4. ✅ **Minicart funkciók:**
   - Quantity update → Badge frissül
   - Remove item → Badge frissül
   - Empty cart → Badge eltűnik (visually-hidden)

---

## Troubleshooting

### Badge nem frissül

**Probléma:** Cart bubble nem mutatja a helyes számot.

**Megoldás:**
1. Ellenőrizd a browser console-t hibákért
2. Nézd meg a LocalStorage-t: `localStorage.getItem('custom-cart-items')`
3. Teszteld manuálisan: `window.updatePriceflowCartBubble()`

### Minicart nem nyílik meg

**Probléma:** Cart icon kattintásra nem történik semmi.

**Megoldás:**
1. Ellenőrizd, hogy a `priceflow-minicart` section hozzá van-e adva a `theme.liquid`-hez
2. Console-ban: `openPriceflowCart()` működik?
3. Ellenőrizd a `priceflow-minicart-drawer` elem létezik-e a DOM-ban

### Számláló 99+-nál elromlik

**Probléma:** 99+ helyett csak 100 jelenik meg.

**Megoldás:**
Ellenőrizd a `data-limit` attributumot a `cart-bubble.liquid`-ben:
```liquid
data-limit="{{ limit | default: 100 }}"
```

---

## Production Checklist

- [ ] `cart-bubble.liquid` módosítva
- [ ] `cart-icon.liquid` módosítva
- [ ] `priceflow-minicart.liquid` létrehozva
- [ ] Section hozzáadva a `theme.liquid`-hez
- [ ] Minicart URL beállítva production domain-re (`https://app.teszt.uk/storefront/minicart`)
- [ ] Origin check engedélyezve a postMessage-ben
- [ ] Cross-tab sync tesztelve
- [ ] Mobile responsiveness ellenőrizve
- [ ] Browser compatibility tesztelve (Chrome, Safari, Firefox)

---

**Last Updated:** 2026-01-11
**Status:** ✅ Kész implementációra
