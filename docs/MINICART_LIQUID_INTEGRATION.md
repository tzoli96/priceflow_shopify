# Minicart Liquid Integration Guide

**Date:** 2026-01-11
**Approach:** Embed Storefront App in Liquid Theme
**Status:** Ready for Implementation

---

## Overview

Ez az útmutató leírja, hogyan kell betölteni a PriceFlow minicart-ot (`/minicart` oldal) a Shopify Liquid témában iframe vagy App Block használatával.

---

## Minicart URL

```
https://app.teszt.uk/storefront/minicart
```

Például:
- Development: `http://localhost:3001/minicart`
- Production: `https://app.teszt.uk/storefront/minicart`

---

## Megoldás 1: Drawer + Iframe (Ajánlott - Egyszerű)

### 1. Liquid Section létrehozása: `sections/priceflow-minicart.liquid`

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
  // Open cart drawer
  function openPriceflowCart() {
    const drawer = document.getElementById('priceflow-minicart-drawer');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  // Close cart drawer
  function closePriceflowCart() {
    const drawer = document.getElementById('priceflow-minicart-drawer');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Listen for messages from iframe
  window.addEventListener('message', function(event) {
    // Only accept messages from your domain
    // if (event.origin !== 'https://storefront.priceflow.com') return;

    const data = event.data;

    if (data.type === 'CLOSE_CART') {
      closePriceflowCart();
    }

    if (data.type === 'CART_UPDATED') {
      updateCartBadge(data.itemCount);
    }
  });

  // Update cart icon badge
  function updateCartBadge(itemCount) {
    const cartIcon = document.querySelector('a[href="/cart"], [data-cart-icon]');
    if (cartIcon) {
      let badge = cartIcon.querySelector('.priceflow-cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'priceflow-cart-badge';
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        `;
        cartIcon.style.position = 'relative';
        cartIcon.appendChild(badge);
      }
      badge.textContent = itemCount;
      badge.style.display = itemCount > 0 ? 'flex' : 'none';
    }
  }

  // Override cart link clicks
  document.addEventListener('click', function(e) {
    const cartLink = e.target.closest('a[href="/cart"], [data-cart-icon]');
    if (cartLink) {
      e.preventDefault();
      openPriceflowCart();
    }
  });

  // Initial cart badge update
  document.addEventListener('DOMContentLoaded', function() {
    try {
      const items = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      updateCartBadge(totalCount);
    } catch (error) {
      console.error('Failed to load cart items:', error);
    }
  });

  // Listen for localStorage changes (cross-tab sync)
  window.addEventListener('storage', function(e) {
    if (e.key === 'custom-cart-items') {
      try {
        const items = JSON.parse(e.newValue || '[]');
        const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
        updateCartBadge(totalCount);
      } catch (error) {
        console.error('Failed to sync cart:', error);
      }
    }
  });

  // Listen for cartUpdated event (same-page updates)
  window.addEventListener('cartUpdated', function(e) {
    const items = e.detail.items || [];
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    updateCartBadge(totalCount);

    // Reload iframe to reflect changes
    const iframe = document.getElementById('priceflow-minicart-iframe');
    if (iframe && document.getElementById('priceflow-minicart-drawer').classList.contains('is-open')) {
      iframe.contentWindow.location.reload();
    }
  });
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

---

### 2. Section hozzáadása a `layout/theme.liquid`-hez

Nyisd meg a `layout/theme.liquid` fájlt, és add hozzá **a `</body>` tag előtt**:

```liquid
  {% section 'priceflow-minicart' %}
</body>
</html>
```

---

### 3. Minicart URL beállítása

1. **Shopify Admin → Online Store → Themes → Customize**
2. Nyisd meg a Theme Settings panel-t
3. Keresd meg a **"PriceFlow Minicart"** section-t
4. Állítsd be a **Minicart URL**-t:
   - Development: `http://localhost:3001/minicart`
   - Production: `https://app.teszt.uk/storefront/minicart`

---

## Megoldás 2: Natív Minicart Felülírása (Alternatív)

Ha a témában már van egy minicart drawer, azt is felülírhatod:

### Módosítás a témában

Keresd meg a témádban a minicart megnyitó gombot (általában `sections/header.liquid` vagy `snippets/cart-icon.liquid`):

```liquid

{%- comment -%} Eredeti cart link --%}
<a href="/cart" class="header__icon">
  <svg>...</svg>
  <span class="cart-count">{{ cart.item_count }}</span>
</a>
```

Cseréld le vagy add hozzá:

```liquid
{%- comment -%} PriceFlow custom cart --%}
<a href="#" onclick="openPriceflowCart(); return false;" class="header__icon" data-cart-icon>
  <svg>...</svg>
  <span class="cart-count" id="priceflow-cart-count">0</span>
</a>
```

Majd frissítsd a badge update logikát a fenti script-tel.

---

## Tesztelés

### 1. Helyi tesztelés

```bash
# Storefront app indítása
cd apps/storefront
npm run dev
```

**URL:** `http://localhost:3001/minicart`

### 2. Tesztek

1. ✅ Nyisd meg a minicart-ot (kosár ikon kattintás)
2. ✅ Add hozzá a terméket a kosárhoz (AddToCartButton)
3. ✅ Minicart mutatja az új terméket
4. ✅ Frissítsd a mennyiséget → LocalStorage update
5. ✅ Távolítsd el a terméket → LocalStorage update
6. ✅ Cart badge frissül
7. ✅ Cross-tab sync (nyiss új tab-ot)
8. ✅ "View Full Cart" link működik
9. ✅ Overlay kattintás bezárja a drawer-t

---

## PostMessage API

A `/minicart` oldal küld üzeneteket a szülő ablaknak:

### Üzenetek a minicart-ból

```javascript
// Cart frissült
{
  type: 'CART_UPDATED',
  itemCount: 3,
  subtotal: 199.99
}

// Drawer bezárása kérés
{
  type: 'CLOSE_CART'
}
```

### Üzenetek fogadása a Liquid-ben

```javascript
window.addEventListener('message', function(event) {
  const data = event.data;

  if (data.type === 'CART_UPDATED') {
    updateCartBadge(data.itemCount);
  }

  if (data.type === 'CLOSE_CART') {
    closePriceflowCart();
  }
});
```

---

## Biztonsági megfontolások

### 1. Origin Check

Production-ben ellenőrizd az origin-t:

```javascript
window.addEventListener('message', function(event) {
  // Csak a saját domain-edből fogadj üzeneteket
  if (event.origin !== 'https://app.teszt.uk') {
    return;
  }

  // Process message...
});
```

### 2. CORS Headers

Biztosítsd, hogy a storefront app engedélyezi az iframe beágyazást:

```javascript
// Next.js middleware vagy headers config
{
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "frame-ancestors 'self' *.myshopify.com"
}
```

---

## Testreszabás

### Drawer szélesség módosítása

```css
.priceflow-drawer__container {
  max-width: 500px; /* Alapértelmezett: 400px */
}
```

### Animáció sebesség

```css
.priceflow-drawer__container {
  transition: transform 0.5s ease; /* Alapértelmezett: 0.3s */
}
```

### Mobile fullscreen

```css
@media (max-width: 640px) {
  .priceflow-drawer__container {
    max-width: 100%; /* Teljes szélesség mobile-on */
  }
}
```

---

## Troubleshooting

### Minicart nem jelenik meg

1. Ellenőrizd, hogy a section hozzá van-e adva a `theme.liquid`-hez
2. Ellenőrizd a Minicart URL beállítást a Customizer-ben
3. Nézd meg a browser console-t hibákért

### Cart badge nem frissül

1. Ellenőrizd, hogy a `cartUpdated` esemény ki van-e váltva az AddToCartButton-ban
2. Nézd meg a LocalStorage-t: `localStorage.getItem('custom-cart-items')`
3. Ellenőrizd a postMessage kommunikációt a DevTools-ban

### Iframe nem töltődik be

1. CORS hiba → Állítsd be a megfelelő headers-t
2. Mixed content (HTTP/HTTPS) → Használj HTTPS-t mindenhol
3. X-Frame-Options → Engedélyezd az iframe beágyazást

---

## Production Deployment

### 1. Storefront App Deploy

```bash
# Build production
npm run build

# Deploy (pl. Vercel, Netlify)
vercel --prod
```

### 2. Liquid Frissítés

Frissítsd a Minicart URL-t a production domain-re:

```liquid
"default": "https://app.teszt.uk/storefront/minicart"
```

### 3. Domain Whitelist

A storefront app-ban engedélyezd a Shopify domain-eket:

```javascript
const ALLOWED_ORIGINS = [
  'https://yourstore.myshopify.com',
  'https://yourstore.com'
];
```

---

## Következő lépések (Iteration 02)

- Checkout gomb engedélyezése
- Draft Order létrehozása a minicart-ból
- Shopify invoice URL-re redirect

---

**Last Updated:** 2026-01-11
**Status:** ✅ Kész implementációra
