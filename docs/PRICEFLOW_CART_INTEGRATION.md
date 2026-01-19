# PriceFlow LocalStorage Cart - Téma Integráció Dokumentáció

Ez a dokumentáció leírja, hogyan kell egy Shopify témát módosítani, hogy a PriceFlow LocalStorage alapú kosár rendszert használja a Shopify natív kosár helyett.

## Áttekintés

A PriceFlow rendszer a kosár adatokat a böngésző `localStorage`-ában tárolja (`custom-cart-items` kulcs alatt), nem a Shopify natív kosár API-jában. Ez lehetővé teszi az egyedi árazást és a kliens-oldali kosár kezelést.

### Fő különbségek a natív kosártól

| Shopify Natív | PriceFlow LocalStorage |
|---------------|------------------------|
| Szerver-oldali tárolás | Kliens-oldali (localStorage) |
| `cart` Liquid objektum | JavaScript API |
| `cart.items` | `localStorage.getItem('custom-cart-items')` |
| `cart.empty?` | JavaScript ellenőrzés |
| Section Rendering API frissít | `cartUpdated` custom event |

---

## 1. Szükséges JavaScript Modulok

### 1.1 Fő kosár modul (`priceflow-cart.js`)

```javascript
// assets/priceflow-cart.js
const STORAGE_KEY = 'custom-cart-items';

window.PriceflowCart = {
  getCartItems() {
    try {
      const items = localStorage.getItem(STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Failed to load cart items:', error);
      return [];
    }
  },

  saveCartItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      this.dispatchCartUpdated();
    } catch (error) {
      console.error('Failed to save cart items:', error);
    }
  },

  getCartItemCount() {
    return this.getCartItems().reduce((sum, item) => sum + (item.quantity || 0), 0);
  },

  getCartTotal() {
    return this.getCartItems().reduce((sum, item) => sum + (item.final_line_price || 0), 0);
  },

  updateItemQuantity(itemId, quantity) {
    let items = this.getCartItems();
    if (quantity <= 0) {
      items = items.filter(item => item.id !== itemId);
    } else {
      items = items.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity, final_line_price: item.final_price * quantity };
        }
        return item;
      });
    }
    this.saveCartItems(items);
  },

  removeItem(itemId) {
    this.updateItemQuantity(itemId, 0);
  },

  clearCart() {
    this.saveCartItems([]);
  },

  dispatchCartUpdated() {
    const items = this.getCartItems();
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: {
        items,
        itemCount: this.getCartItemCount(),
        total: this.getCartTotal()
      }
    }));
  },

  formatPrice(price) {
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(price * 100);
    }
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(price);
  },

  STORAGE_KEY
};
```

---

## 2. Morph/Section Renderer Védelem

### 2.1 A probléma

A Shopify témák gyakran használnak "Section Rendering API"-t és "DOM morphing"-ot az oldal dinamikus frissítéséhez. Ez felülírja a localStorage-ból renderelt tartalmat, mert a szerver nem látja a localStorage adatokat.

### 2.2 Megoldás: `data-skip-subtree-update` attribútum

A `morph.js` fájl tartalmaz egy beépített "escape hatch"-et:

```javascript
// morph.js - ez a rész már létezik a legtöbb modern Shopify témában
if (oldNode.hasAttribute('data-skip-subtree-update') &&
    newNode.hasAttribute('data-skip-subtree-update')) {
  return; // NEM frissíti a gyerekeket!
}
```

### 2.3 Hol kell alkalmazni

Minden localStorage-ból renderelt elemre tedd rá a `data-skip-subtree-update` attribútumot:

```liquid
<!-- Cart bubble (kosár ikon melletti szám) -->
<div data-priceflow-cart-bubble data-skip-subtree-update>
  ...
</div>

<!-- Cart icon komponens -->
<cart-icon data-skip-subtree-update>
  ...
</cart-icon>

<!-- Cart drawer / minicart -->
<cart-items-component data-skip-subtree-update>
  ...
</cart-items-component>

<!-- Cart products lista -->
<div data-priceflow-cart-products data-skip-subtree-update>
  ...
</div>

<!-- Cart summary -->
<div data-priceflow-cart-summary data-skip-subtree-update>
  ...
</div>
```

---

## 3. Snippet Módosítások

### 3.1 Cart Bubble (`snippets/cart-bubble.liquid`)

A kosár ikon melletti termékszám megjelenítése.

```liquid
<div
  ref="cartBubble"
  class="cart-bubble visually-hidden"
  data-priceflow-cart-bubble
  data-maintain-ratio
  data-skip-subtree-update
>
  <span class="cart-bubble__background"></span>
  <span ref="cartBubbleText" class="cart-bubble__text">
    <span class="visually-hidden">
      Total items in cart: <span data-priceflow-cart-count-sr>0</span>
    </span>
    <span class="cart-bubble__text-count" data-priceflow-cart-count>0</span>
  </span>
</div>

<script>
(function() {
  const STORAGE_KEY = 'custom-cart-items';

  function getCartItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function updateCartBubble() {
    const items = getCartItems();
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

    document.querySelectorAll('[data-priceflow-cart-bubble]').forEach(bubble => {
      const countElement = bubble.querySelector('[data-priceflow-cart-count]');
      const countSR = bubble.querySelector('[data-priceflow-cart-count-sr]');

      if (itemCount === 0) {
        bubble.classList.add('visually-hidden');
      } else {
        bubble.classList.remove('visually-hidden');
        if (countElement) countElement.textContent = itemCount;
        if (countSR) countSR.textContent = itemCount;
      }
    });
  }

  if (!window._priceflowCartBubbleInitialized) {
    window._priceflowCartBubbleInitialized = true;
    updateCartBubble();
    document.addEventListener('DOMContentLoaded', updateCartBubble);
    window.addEventListener('cartUpdated', updateCartBubble);
    window.addEventListener('storage', e => e.key === STORAGE_KEY && updateCartBubble());
  }

  window.updatePriceflowCartBubble = updateCartBubble;
})();
</script>
```

### 3.2 Cart Products (`snippets/cart-products.liquid`)

A kosár termékek listázása.

**Fontos elemek:**
- `data-priceflow-cart-products` - fő konténer
- `data-priceflow-empty-cart` - üres kosár állapot
- `data-priceflow-cart-items-container` - termékek konténer
- `data-priceflow-cart-items-body` - tbody ahol a termékek renderelődnek
- `data-skip-subtree-update` - morph védelem

```liquid
<div
  class="cart-items__wrapper"
  data-priceflow-cart-products
  data-skip-subtree-update
>
  <!-- Üres kosár állapot -->
  <div data-priceflow-empty-cart style="display: none;">
    <p>Your cart is empty</p>
    <a href="/collections/all">Continue shopping</a>
  </div>

  <!-- Termékek -->
  <div data-priceflow-cart-items-container style="display: none;">
    <table class="cart-items__table">
      <tbody data-priceflow-cart-items-body>
        <!-- JavaScript rendereli a termékeket -->
      </tbody>
    </table>
  </div>
</div>

<script>
(function() {
  const STORAGE_KEY = 'custom-cart-items';

  // ... lásd a teljes implementációt a snippets/cart-products.liquid fájlban
})();
</script>
```

### 3.3 Cart Summary (`snippets/cart-summary.liquid`)

A kosár összesítő (végösszeg, checkout gomb).

**Fontos elemek:**
- `data-priceflow-cart-summary` - fő konténer
- `data-priceflow-cart-total` - végösszeg megjelenítése
- `data-priceflow-checkout-button` - checkout gomb

```liquid
<div class="cart__summary-totals" data-priceflow-cart-summary>
  <div class="cart__total-container">
    <span class="cart__total">
      <span class="cart__total-label">Estimated total</span>
      <span class="cart__total-value" data-priceflow-cart-total>0 Ft</span>
    </span>
  </div>
</div>

<div class="cart__ctas">
  <button type="button" class="cart__checkout-button button" data-priceflow-checkout-button>
    Checkout
  </button>
</div>

<script>
(function() {
  const STORAGE_KEY = 'custom-cart-items';

  function getCartItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function getCartTotal() {
    return getCartItems().reduce((sum, item) => sum + (item.final_line_price || 0), 0);
  }

  function formatPrice(price) {
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(price * 100);
    }
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency', currency: 'HUF', minimumFractionDigits: 0
    }).format(price);
  }

  function updateCartSummary() {
    const items = getCartItems();
    const total = getCartTotal();
    const isEmpty = items.length === 0;

    document.querySelectorAll('[data-priceflow-cart-total]').forEach(el => {
      el.textContent = formatPrice(total);
    });

    document.querySelectorAll('[data-priceflow-checkout-button]').forEach(btn => {
      btn.disabled = isEmpty;
    });
  }

  if (!window._priceflowCartSummaryInitialized) {
    window._priceflowCartSummaryInitialized = true;
    setTimeout(updateCartSummary, 50);
    window.addEventListener('cartUpdated', updateCartSummary);
    window.addEventListener('storage', e => e.key === STORAGE_KEY && updateCartSummary());
  }
})();
</script>
```

---

## 4. Section/Block Módosítások

### 4.1 Main Cart Section (`sections/main-cart.liquid`)

**Fontos változtatások:**

1. **Távolítsd el a `cart.empty?` Liquid feltételeket** - helyette JavaScript kezeli
2. **Add hozzá `data-skip-subtree-update`** a fő konténerhez
3. **Add hozzá a JavaScript-et** az empty state kezeléséhez

```liquid
{%- comment -%}
  MODIFIED: Uses LocalStorage instead of Shopify native cart.
{%- endcomment -%}

<cart-items-component
  class="cart-items-component"
  data-section-id="{{ section.id }}"
  data-skip-subtree-update
>
  <div class="cart-page" data-priceflow-cart-page>
    <div class="cart-page__title">
      {%- content_for 'block', id: 'cart-page-title', type: '_cart-title' %}
    </div>

    <div class="cart-page__items">
      {%- content_for 'block', id: 'cart-page-items', type: '_cart-products' %}
    </div>

    <!-- NE használj cart.empty? feltételt! -->
    <div class="cart-page__summary" data-priceflow-cart-summary-container>
      {%- content_for 'block', id: 'cart-page-summary', type: '_cart-summary' -%}
    </div>
  </div>
</cart-items-component>

<script>
(function() {
  const STORAGE_KEY = 'custom-cart-items';

  function getCartItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function updateCartPageState() {
    const isEmpty = getCartItems().length === 0;
    const cartPage = document.querySelector('[data-priceflow-cart-page]');
    const summary = document.querySelector('[data-priceflow-cart-summary-container]');

    if (cartPage) {
      cartPage.classList.toggle('cart-page--empty', isEmpty);
    }
    if (summary) {
      summary.style.display = isEmpty ? 'none' : '';
    }
  }

  if (!window._priceflowCartPageInitialized) {
    window._priceflowCartPageInitialized = true;
    setTimeout(updateCartPageState, 50);
    window.addEventListener('cartUpdated', updateCartPageState);
    window.addEventListener('storage', e => e.key === STORAGE_KEY && updateCartPageState());
  }
})();
</script>
```

### 4.2 Cart Title Block (`blocks/_cart-title.liquid`)

```liquid
<div class="cart-title" data-priceflow-cart-title data-skip-subtree-update>
  <!-- Üres kosár cím -->
  <h1 data-priceflow-empty-title style="display: none;">
    {{ 'content.your_cart_is_empty' | t }}
  </h1>

  <!-- Kosár termékekkel cím -->
  <h1 data-priceflow-items-title style="display: none;">
    {{ block_settings.title }}
    {%- if block_settings.show_count -%}{% render 'cart-bubble' %}{%- endif -%}
  </h1>
</div>

<script>
(function() {
  const STORAGE_KEY = 'custom-cart-items';

  function updateCartTitle() {
    const isEmpty = (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).length === 0;
    const emptyTitle = document.querySelector('[data-priceflow-empty-title]');
    const itemsTitle = document.querySelector('[data-priceflow-items-title]');

    if (emptyTitle) emptyTitle.style.display = isEmpty ? '' : 'none';
    if (itemsTitle) itemsTitle.style.display = isEmpty ? 'none' : '';
  }

  if (!window._priceflowCartTitleInitialized) {
    window._priceflowCartTitleInitialized = true;
    setTimeout(updateCartTitle, 10);
    window.addEventListener('cartUpdated', updateCartTitle);
    window.addEventListener('storage', e => e.key === STORAGE_KEY && updateCartTitle());
  }
})();
</script>
```

---

## 5. Cart Drawer / Minicart

### 5.1 CSS Layout (fix footer)

A checkout gomb fix alul, a termékek görgethetők:

```css
/* Dialog alap */
.cart-drawer__dialog.dialog-drawer {
  height: 100dvh !important;
  max-height: 100dvh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* Csak nyitott állapotban flex */
.cart-drawer__dialog.dialog-drawer[open] {
  display: flex !important;
  flex-direction: column !important;
}

/* Header fix */
.cart-drawer__header {
  flex-shrink: 0 !important;
}

/* Content - flex container */
.cart-drawer__content {
  flex: 1 1 0% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  min-height: 0 !important;
}

/* Termékek lista - görgethető */
.cart-drawer__items {
  flex: 1 1 0% !important;
  overflow-y: auto !important;
  min-height: 0 !important;
}

/* Summary/checkout - fix alul */
.cart-drawer__summary {
  flex-shrink: 0 !important;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
```

---

## 6. Cart Item Struktúra

A localStorage-ban tárolt kosár elemek struktúrája:

```typescript
interface CartItem {
  id: string;                    // Egyedi azonosító: "{variantId}:{timestamp}"
  variant_id: string;            // Shopify variant ID
  product_title: string;         // Termék neve
  image: string;                 // Termék kép URL
  final_price: number;           // Egységár (Ft-ban, nem centben!)
  final_line_price: number;      // Sor összeg (final_price * quantity)
  quantity: number;              // Mennyiség
  properties: {                  // Egyedi tulajdonságok
    Variant?: string;            // Variant megjelenítési név
    pricing_template?: string;   // PriceFlow template (rejtett)
    original_price?: number;     // Eredeti ár (rejtett)
    // ... egyéb custom mezők
  };
}
```

### Példa:

```json
[
  {
    "id": "56781476233603:1768651088891",
    "variant_id": "56781476233603",
    "product_title": "1TB External Hard Drive",
    "image": "https://cdn.shopify.com/.../image.jpg",
    "final_price": 399.98,
    "final_line_price": 799.96,
    "quantity": 2,
    "properties": {
      "Variant": "1 Year / Black",
      "pricing_template": "volume-discount"
    }
  }
]
```

---

## 7. Eseménykezelés

### 7.1 `cartUpdated` Custom Event

Minden kosár változáskor dispatch-elődik:

```javascript
window.dispatchEvent(new CustomEvent('cartUpdated', {
  detail: {
    items: CartItem[],
    itemCount: number,
    total: number
  }
}));
```

### 7.2 Listener példa

```javascript
window.addEventListener('cartUpdated', function(event) {
  console.log('Cart updated:', event.detail);
  // Frissítsd a UI-t
});
```

### 7.3 Cross-tab szinkronizáció

```javascript
window.addEventListener('storage', function(event) {
  if (event.key === 'custom-cart-items') {
    // Másik tab módosította a kosarat
    updateUI();
  }
});
```

---

## 8. Ellenőrző Lista

### Új téma integrálásakor:

- [ ] `assets/priceflow-cart.js` - fő kosár modul hozzáadva
- [ ] `snippets/cart-bubble.liquid` - módosítva localStorage-ra
- [ ] `snippets/cart-products.liquid` - módosítva localStorage-ra
- [ ] `snippets/cart-summary.liquid` - módosítva localStorage-ra
- [ ] `snippets/cart-drawer.liquid` - módosítva localStorage-ra (ha van)
- [ ] `snippets/cart-icon-component.liquid` - `data-skip-subtree-update` hozzáadva
- [ ] `sections/main-cart.liquid` - `cart.empty?` eltávolítva, JS hozzáadva
- [ ] `blocks/_cart-title.liquid` - `cart.empty?` eltávolítva, JS hozzáadva
- [ ] `blocks/_cart-products.liquid` - `data-skip-subtree-update` hozzáadva
- [ ] `blocks/_cart-summary.liquid` - `data-skip-subtree-update` hozzáadva
- [ ] CSS layout fix footer-hez (minicart)
- [ ] Morph védelem tesztelve (oldal frissítés után megmaradnak a termékek)

---

## 9. Hibakeresés

### 9.1 Termékek eltűnnek oldal betöltés után

**Ok:** Section Renderer/morph felülírja a DOM-ot.

**Megoldás:** Add hozzá `data-skip-subtree-update` attribútumot a konténer elemekhez.

### 9.2 Üres kosár jelenik meg, pedig vannak termékek

**Ok:** A Liquid `cart.empty?` feltétel a Shopify natív kosarat ellenőrzi.

**Megoldás:** Távolítsd el a `cart.empty?` feltételeket és használj JavaScript-et.

### 9.3 Cart bubble nem frissül

**Ok:** Hiányzó `cartUpdated` event listener.

**Megoldás:** Add hozzá: `window.addEventListener('cartUpdated', updateCartBubble);`

### 9.4 Checkout gomb nem működik

**Ok:** A natív Shopify checkout-ra mutat.

**Megoldás:** Implementálj egyedi checkout flow-t a `priceflowCheckout` event-tel.

---

## 10. Kapcsolódó Fájlok (Horizon téma)

```
themefiles/
├── assets/
│   ├── priceflow-cart.js          # Fő kosár modul
│   ├── cart-drawer.js             # Cart drawer komponens
│   ├── cart-icon.js               # Cart icon komponens
│   └── component-cart-items.js    # Cart items komponens
├── snippets/
│   ├── cart-bubble.liquid         # Kosár számláló
│   ├── cart-products.liquid       # Termékek lista
│   ├── cart-summary.liquid        # Összesítő + checkout
│   ├── cart-drawer.liquid         # Minicart drawer
│   └── cart-icon-component.liquid # Kosár ikon
├── sections/
│   └── main-cart.liquid           # Cart oldal fő section
└── blocks/
    ├── _cart-title.liquid         # Cart cím block
    ├── _cart-products.liquid      # Cart termékek block
    └── _cart-summary.liquid       # Cart összesítő block
```

---

**Verzió:** 1.0
**Utolsó frissítés:** 2026-01-17
