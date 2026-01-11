# LocalStorage Cart Override - 5 Megközelítés

**Dátum:** 2026-01-11
**Projekt:** PriceFlow Shopify
**Cél:** LocalStorage-ban tárolt custom pricing termékek megjelenítése Shopify cart és minicart oldalon

---

## Probléma Definíció

**Követelmények:**
- LocalStorage-ban vannak custom pricing-os termékek
- Shopify natív cart (`/cart`) és minicart megjelenítése CSAK LocalStorage items-szel
- Natív Shopify cart funkcionalitás kikapcsolása/felülírása
- Checkout flow: LocalStorage → Draft Order → Shopify invoice

**Technikai Kihívás:**
Shopify natív cart API-ja nem ismeri a LocalStorage-ban tárolt termékeket, ezért alternatív megoldás kell a cart UI override-olásához.

---

## Megközelítés 1: DOM Manipuláció (Client-side JavaScript)

### Koncept

JavaScript futtatása a Shopify cart oldalon, amely:
1. Olvas LocalStorage-ből
2. Manipulálja a DOM-ot (beszúr, módosít, töröl HTML elemeket)
3. Frissíti árakat és totalt
4. Override-olja a checkout gombot

### Implementáció Vázlat

```javascript
// Betöltődés után
document.addEventListener('DOMContentLoaded', () => {
  const customCartItems = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');

  // 1. Töröld a natív cart tartalmát
  const cartItemsContainer = document.querySelector('.cart-items');
  cartItemsContainer.innerHTML = '';

  // 2. Beszúrd a LocalStorage items-eket
  customCartItems.forEach(item => {
    const itemHTML = `
      <div class="cart-item">
        <img src="${item.image}" />
        <h3>${item.product_title}</h3>
        <p>Price: $${item.final_price}</p>
        <p>Qty: ${item.quantity}</p>
      </div>
    `;
    cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
  });

  // 3. Frissítsd a végösszeget
  const total = customCartItems.reduce((sum, item) => sum + item.final_line_price, 0);
  document.querySelector('.cart-total').textContent = `$${total.toFixed(2)}`;

  // 4. Checkout gomb override
  document.querySelector('.checkout-button').addEventListener('click', (e) => {
    e.preventDefault();
    createDraftOrderAndRedirect(customCartItems);
  });
});
```

### Fájl Struktúra

```
theme/
├── assets/
│   └── custom-cart-override.js     # NEW - DOM manipulation script
└── layout/
    └── theme.liquid                # MODIFY - Add script tag
```

### Előnyök

| Előny | Leírás |
|-------|--------|
| ✅ **Gyors implementáció** | ~2-3 nap fejlesztés |
| ✅ **Nincs theme módosítás** | Csak JS fájl hozzáadása (script tag) |
| ✅ **Kompatibilis minden témával** | Általános DOM selector-ok használata |
| ✅ **Real-time frissítés** | localStorage change event listener |
| ✅ **Nincs Shopify approval** | Csak asset fájl, nem app extension |

### Hátrányok

| Hátrány | Leírás |
|---------|--------|
| ❌ **Törékeny kód** | Téma frissítés → selector változás → breaking |
| ❌ **SEO probléma** | Content JS-sel töltődik, crawler nem látja |
| ❌ **FOUC (Flash)** | Natív cart látszik, majd eltűnik |
| ❌ **Accessibility issues** | Screen reader nem érti a DOM változást |
| ❌ **Maintenance hell** | Minden téma update-nél tesztelni kell |
| ❌ **Race condition** | Ha lassú a script, user látja natív cart-ot |

### Mikor Használd

- ✅ **Gyors MVP** (1-2 hét)
- ✅ **Nincs theme code hozzáférés**
- ✅ **Proof of concept** tesztelés
- ✅ **Kevés termék** a kosárban (< 10)
- ❌ **NEM production long-term megoldás**

### Implementációs Idő

**2-3 nap**

---

## Megközelítés 2: Shopify Liquid Template Override

### Koncept

Módosítod a Shopify téma Liquid fájljait:
1. `cart.liquid` és `cart-drawer.liquid` átírása
2. Backend (Liquid) rendereli a strukúrát
3. JavaScript inject-eli a custom items-eket
4. Hybrid approach (Liquid structure + JS data)

### Implementáció Vázlat

```liquid
<!-- theme/sections/main-cart.liquid -->
<div class="cart-container">
  <!-- Shopify natív cart items (hidden) -->
  <div id="shopify-native-cart" style="display: none;">
    {% for item in cart.items %}
      <!-- Natív items (nem használjuk) -->
    {% endfor %}
  </div>

  <!-- Custom cart items (JavaScript tölti be) -->
  <div id="custom-cart-items">
    <!-- JavaScript inject target -->
  </div>

  <!-- Cart summary -->
  <div class="cart-summary">
    <p>Subtotal: <span id="cart-subtotal">$0.00</span></p>
    <button id="checkout-button">Checkout</button>
  </div>
</div>

<script src="{{ 'custom-cart.js' | asset_url }}"></script>
```

```javascript
// assets/custom-cart.js
function renderCustomCart() {
  const customItems = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');
  const container = document.getElementById('custom-cart-items');

  const html = customItems.map(item => `
    <div class="cart-item">
      <img src="${item.image}" />
      <h3>${item.product_title}</h3>
      <p>$${item.final_price} × ${item.quantity}</p>
    </div>
  `).join('');

  container.innerHTML = html;
  updateCartTotals(customItems);
}
```

### Fájl Struktúra

```
theme/
├── sections/
│   ├── main-cart-custom.liquid       # NEW - Custom cart section
│   └── cart-drawer-custom.liquid    # NEW - Custom minicart
├── assets/
│   ├── custom-cart.js                # NEW - Cart render logic
│   └── custom-cart.css               # NEW - Styling
└── templates/
    └── cart.json                     # MODIFY - Use custom section
```

### Előnyök

| Előny | Leírás |
|-------|--------|
| ✅ **Teljes UI kontroll** | Custom HTML struktúra |
| ✅ **Téma-specifikus styling** | Brand consistency |
| ✅ **Jobb performance** | Optimalizált DOM render |
| ✅ **Könnyebb maintenance** | Saját kód, nem hack |
| ✅ **Accessibility compliance** | Proper ARIA labels |
| ✅ **Mobile responsive** | Téma mobile CSS |

### Hátrányok

| Hátrány | Leírás |
|---------|--------|
| ❌ **Theme editor access kell** | Nem minden merchant-nak van |
| ❌ **Lassabb implementáció** | ~5-7 nap |
| ❌ **Téma-specifikus** | Minden témához külön adaptálás |
| ❌ **Theme update breaking** | Új verzió felülírhatja |
| ❌ **Nem portable** | Más shop-ra nem vihető át |

### Mikor Használd

- ✅ **Saját téma** vagy theme code access
- ✅ **Brand consistency** fontos
- ✅ **Long-term megoldás** (nem hack)
- ✅ **Single shop** vagy kis számú shop
- ❌ **NEM multi-shop SaaS**-hoz

### Implementációs Idő

**5-7 nap**

---

## Megközelítés 3: Shopify Theme App Extension (Injection)

### Koncept

Theme app extension használata:
1. Extension block-okat injektálsz a cart oldalba
2. Merchant bekapcsolja a theme editor-ban
3. JavaScript + Liquid hybrid (app-ként)
4. Portable solution (minden témában működik)

### Implementáció Vázlat

```toml
# extensions/custom-cart-extension/shopify.extension.toml
[[extensions]]
type = "theme"
name = "PriceFlow Custom Cart"

[[extensions.blocks]]
type = "custom-cart-items"
name = "Custom Cart Items Block"
target = "main-cart-items"
```

```liquid
<!-- extensions/custom-cart-extension/blocks/custom-cart-items.liquid -->
{% schema %}
{
  "name": "Custom Cart Items",
  "target": "section",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_custom_items",
      "label": "Show Custom Pricing Items",
      "default": true
    }
  ]
}
{% endschema %}

<div class="custom-cart-items" data-block-type="custom-cart">
  <div id="custom-cart-container"></div>
</div>

<script>
  (function() {
    const renderCustomCart = () => {
      // LocalStorage betöltés és render
      const items = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');
      // ... render logic
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderCustomCart);
    } else {
      renderCustomCart();
    }
  })();
</script>
```

### Fájl Struktúra

```
extensions/
└── priceflow-cart-extension/
    ├── shopify.extension.toml
    ├── blocks/
    │   ├── custom-cart-items.liquid
    │   └── custom-cart-drawer.liquid
    └── assets/
        └── custom-cart.js
```

### Előnyök

| Előny | Leírás |
|-------|--------|
| ✅ **Portable** | Minden témában működik |
| ✅ **Merchant control** | Ki/be kapcsolható theme editor-ban |
| ✅ **Automatic updates** | App update → minden shop frissül |
| ✅ **Theme-agnostic** | Nem kell téma-specifikus kód |
| ✅ **Shopify best practice** | Hivatalos extension API |
| ✅ **Analytics support** | Shopify App Bridge events |
| ✅ **Multi-shop support** | Egy kódbázis, több shop |

### Hátrányok

| Hátrány | Leírás |
|---------|--------|
| ❌ **Shopify app szükséges** | (már van ✅ - PriceFlow) |
| ❌ **Extension approval** | Shopify review process (~1-2 hét) |
| ❌ **Merchant setup required** | Be kell kapcsolni theme editor-ban |
| ❌ **Limitált styling control** | CSS csak scoped lehet |
| ❌ **JS bundle size limit** | Max 1MB |
| ❌ **Debugging nehezebb** | Extension sandbox environment |

### Mikor Használd

- ✅ **Már van Shopify app** (van ✅ - PriceFlow)
- ✅ **Több merchant** (SaaS)
- ✅ **Long-term, scalable** megoldás
- ✅ **Shopify best practice** követése fontos
- ✅ **Production-ready** feature

### Implementációs Idő

**7-10 nap** (+ 1-2 hét Shopify approval)

---

## Megközelítés 4: Ajax API Cart Override (Advanced)

### Koncept

Shopify Ajax Cart API override-olás:
1. Nem módosítod a natív cart UI-t vizuálisan
2. Override-olod a Shopify Ajax Cart API-t (`/cart.js`)
3. JavaScript merge-eli a LocalStorage items-eket
4. Visszaküld egy "fake" cart JSON-t
5. Shopify cart UI rendereli (nem tudja, hogy fake data)

### Implementáció Vázlat

```javascript
// assets/cart-api-override.js

// Intercept fetch/XMLHttpRequest
(function() {
  const originalFetch = window.fetch;

  window.fetch = function(...args) {
    const url = args[0];

    // Ha cart.js endpoint
    if (url.includes('/cart.js') || url.includes('/cart/update.js')) {
      return originalFetch(...args).then(async response => {
        const nativeCart = await response.clone().json();

        // Merge custom items
        const customItems = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');
        const mergedCart = mergeCartData(nativeCart, customItems);

        // Return fake Response
        return new Response(JSON.stringify(mergedCart), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }

    return originalFetch(...args);
  };
})();

function mergeCartData(nativeCart, customItems) {
  // Convert custom items to Shopify cart format
  const shopifyFormatItems = customItems.map(item => ({
    id: item.variant_id,
    quantity: item.quantity,
    title: item.product_title,
    price: item.final_price * 100, // Shopify uses cents
    line_price: item.final_line_price * 100,
    image: item.image,
    properties: item.properties
  }));

  return {
    ...nativeCart,
    items: [...nativeCart.items, ...shopifyFormatItems],
    item_count: nativeCart.item_count + customItems.reduce((sum, i) => sum + i.quantity, 0),
    total_price: nativeCart.total_price + customItems.reduce((sum, i) => sum + i.final_line_price * 100, 0)
  };
}
```

### Fájl Struktúra

```
theme/
├── assets/
│   └── cart-api-override.js      # NEW - Fetch intercept
└── layout/
    └── theme.liquid              # MODIFY - Add script BEFORE cart scripts
```

### Előnyök

| Előny | Leírás |
|-------|--------|
| ✅ **Zero UI code** | Natív Shopify cart UI változatlan |
| ✅ **Theme compatibility** | Bármilyen témával működik |
| ✅ **Automatic mobile support** | Natív mobile cart |
| ✅ **Discount codes work** | API szinten merge-elhető |
| ✅ **Shipping calculation** | Natív Shopify flow |
| ✅ **Progressive enhancement** | JS fail esetén natív cart működik |

### Hátrányok

| Hátrány | Leírás |
|---------|--------|
| ❌ **Nagyon komplex** | API hooking, fetch override |
| ❌ **Fragile** | Shopify API változás = breaking change |
| ❌ **Security risks** | fetch override = XSS vector |
| ❌ **Performance overhead** | Minden API call intercept |
| ❌ **Debugging nightmare** | Nehéz troubleshoot-olni |
| ❌ **Checkout divergence** | Checkout nem látja a fake cart-ot |
| ❌ **Shopify ToS violation risk** | API manipulation |

### Mikor Használd

- ⚠️ **EGYÁLTALÁN NEM akarod** módosítani a UI-t
- ⚠️ **Minden témával** kompatibilis megoldás kell
- ⚠️ Van **senior fullstack dev** aki maintain-eli
- ❌ **NEM AJÁNLOTT production-ben** (túl sok risk)

### Implementációs Idő

**10-14 nap** (+ maintenance kockázat)

---

## Megközelítés 5: Headless / Fully Custom Cart (Nuclear Option)

### Koncept

Teljesen felülírod a Shopify cart oldalt:
1. Custom React/Next.js alkalmazás (storefront app)
2. Shopify cart kikapcsolva (redirects a custom cart-ra)
3. 100% kontroll a UI, logic, checkout flow felett
4. Modern tech stack (React, Next.js, TypeScript)

### Implementáció Vázlat

```typescript
// apps/storefront/app/cart/page.tsx (Next.js)
'use client';

import { useCart } from '@/hooks/useCart';
import { CartItemsList } from '@/components/cart/CartItemsList';
import { CartSummary } from '@/components/cart/CartSummary';

export default function CustomCartPage() {
  const { items, totalPrice, isLoaded } = useCart();

  if (!isLoaded) return <div>Loading cart...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <EmptyCartState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CartItemsList />
          </div>
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Shopify redirect setup:**

```liquid
<!-- theme/layout/theme.liquid -->
<script>
  // Redirect /cart to custom app
  if (window.location.pathname === '/cart') {
    window.location.href = 'https://storefront.priceflow.app/cart';
  }
</script>
```

### Fájl Struktúra

```
apps/storefront/
├── app/
│   ├── cart/
│   │   └── page.tsx              # Custom cart page
│   └── checkout/
│       └── page.tsx              # Custom checkout flow
├── components/
│   └── cart/
│       ├── CartItemsList.tsx
│       ├── CartSummary.tsx
│       └── AddToCartButton.tsx
├── hooks/
│   └── useCart.ts                # Cart state management
└── lib/
    └── api/
        └── client.ts             # Backend API client
```

### Előnyök

| Előny | Leírás |
|-------|--------|
| ✅ **Teljes kontroll** | UI, UX, logic minden felett |
| ✅ **Modern tech stack** | React, Next.js, TypeScript |
| ✅ **Nem törékeny** | Nem függ Shopify theme frissítésektől |
| ✅ **Custom animations** | Smooth UX |
| ✅ **Complex logic** | Validation, discount calc, stb. |
| ✅ **A/B testing** | Könnyen változtatható |
| ✅ **Analytics** | Custom tracking |
| ✅ **Scalable** | Microservice architecture |

### Hátrányok

| Hátrány | Leírás |
|---------|--------|
| ❌ **Legnagyobb fejlesztési idő** | ~3-4 hét |
| ❌ **Separate hosting** | Next.js app hosting cost |
| ❌ **SEO complexity** | Custom cart page indexing |
| ❌ **Brand disconnect** | Külön app, nem Shopify-on |
| ❌ **Maintenance overhead** | 2 app helyett 1 |
| ❌ **Authentication complexity** | Session management |
| ❌ **Checkout flow break** | Redirect back to Shopify |

### Mikor Használd

- ✅ **Teljes custom experience** kell
- ✅ **Long-term product** (nem MVP)
- ✅ Van **dedikált frontend team**
- ✅ **Egyedi features** kellenek (AI, 3D preview)
- ✅ **Multi-brand** vagy **white-label** solution
- ✅ **Shopify Hydrogen** jövőbeli átállás

### Implementációs Idő

**15-20 nap**

---

## Összehasonlító Táblázat

| Megközelítés | Implementációs Idő | Komplexitás | Maintenance | Theme Compatibility | Scalability | Production Ready | Ajánlott Fázis |
|--------------|-------------------|-------------|-------------|---------------------|-------------|------------------|----------------|
| **1. DOM Manipulation** | 2-3 nap | 🟢 Alacsony | 🔴 Magas | 🟡 Közepes | 🔴 Alacsony | 🟡 MVP only | MVP |
| **2. Liquid Override** | 5-7 nap | 🟡 Közepes | 🟡 Közepes | 🔴 Alacsony | 🟡 Közepes | 🟢 Igen | Single Shop |
| **3. Theme Extension** | 7-10 nap | 🟡 Közepes | 🟢 Alacsony | 🟢 Magas | 🟢 Magas | 🟢 Igen (best) | Multi-Shop SaaS |
| **4. Ajax API Override** | 10-14 nap | 🔴 Magas | 🔴 Magas | 🟢 Magas | 🔴 Alacsony | 🔴 Nem ajánlott | Soha |
| **5. Headless/Custom** | 15-20 nap | 🔴 Nagyon magas | 🟡 Közepes | 🟢 N/A | 🟢 Nagyon magas | 🟢 Igen (long-term) | Enterprise |

---

## Döntési Fa (Decision Tree)

```
Van theme code hozzáférés?
├─ IGEN
│  ├─ Csak 1-2 shop?
│  │  └─ → Megközelítés 2: Liquid Override (5-7 nap)
│  │
│  └─ Több shop (SaaS)?
│     └─ → Megközelítés 3: Theme Extension (7-10 nap)
│
└─ NEM
   ├─ Gyors MVP kell (1-2 hét)?
   │  └─ → Megközelítés 1: DOM Manipulation (2-3 nap)
   │
   └─ Long-term, teljes kontroll?
      └─ → Megközelítés 5: Headless Custom (15-20 nap)
```

---

## Költség-Haszon Elemzés

### Fejlesztési Költség (Developer Hours)

| Megközelítés | Junior Dev | Mid Dev | Senior Dev | Total Hours |
|--------------|-----------|---------|------------|-------------|
| 1. DOM Manipulation | 16h | - | - | 16h (~$800) |
| 2. Liquid Override | 24h | 16h | - | 40h (~$2,400) |
| 3. Theme Extension | - | 32h | 24h | 56h (~$4,200) |
| 4. Ajax API Override | - | 24h | 56h | 80h (~$6,800) |
| 5. Headless Custom | - | 64h | 96h | 160h (~$14,400) |

### Maintenance Költség (Évente)

| Megközelítés | Maintenance Hours/Year | Költség/Év |
|--------------|----------------------|-----------|
| 1. DOM Manipulation | 80h (theme updates) | $4,000 |
| 2. Liquid Override | 40h | $2,400 |
| 3. Theme Extension | 16h | $1,200 |
| 4. Ajax API Override | 120h (bug fixes) | $10,000 |
| 5. Headless Custom | 60h | $5,400 |

### ROI (Return on Investment)

| Megközelítés | 1 Év Total Cost | 3 Év Total Cost | Scalability Score |
|--------------|----------------|-----------------|-------------------|
| 1. DOM Manipulation | $4,800 | $12,800 | 2/10 |
| 2. Liquid Override | $4,800 | $9,600 | 5/10 |
| 3. Theme Extension | $5,400 | $7,800 | 9/10 ⭐ |
| 4. Ajax API Override | $16,800 | $36,800 | 3/10 |
| 5. Headless Custom | $19,800 | $30,600 | 10/10 |

---

## Ajánlások Fázis Szerint

### MVP Fázis (1-2 hónap)

**🥇 Elsődleges:** Megközelítés 1 - DOM Manipulation
- Gyors proof of concept
- Tesztelhető merchant-okkal
- Később migrálható

**🥈 Alternatíva:** Megközelítés 2 - Liquid Override
- Ha van theme access
- Jobb long-term foundation

### Beta Fázis (3-6 hónap)

**🥇 Elsődleges:** Megközelítés 3 - Theme Extension
- Shopify best practice
- Portable (multi-shop)
- Official support

**🥈 Alternatíva:** Megközelítés 2 - Liquid Override
- Ha még nem kész az extension
- Single shop esetén

### Production Fázis (6+ hónap)

**🥇 Elsődleges:** Megközelítés 3 - Theme Extension
- Production-ready
- Scalable
- Maintainable

**🥈 Long-term:** Megközelítés 5 - Headless Custom
- Ha enterprise features kellenek
- Ha Shopify Hydrogen migration tervezett

---

## Gyakori Kérdések (FAQ)

### Q1: Kombinálható több megközelítés?

**A:** Igen, fokozatos migráció lehetséges:
1. Start: Megközelítés 1 (DOM Manipulation) - MVP
2. Migráció: Megközelítés 2 (Liquid Override) - Beta
3. Final: Megközelítés 3 (Theme Extension) - Production

### Q2: Melyik a legbiztonságosabb?

**A:** Megközelítés 3 (Theme Extension) - Shopify officially supported API

### Q3: Melyik a leggyorsabb implementálni?

**A:** Megközelítés 1 (DOM Manipulation) - 2-3 nap

### Q4: Melyik a legjobb multi-shop SaaS-hoz?

**A:** Megközelítés 3 (Theme Extension) - portable, theme-agnostic

### Q5: Kell-e Shopify Plus a Draft Order-höz?

**A:** NEM, Draft Order API minden Shopify plan-en elérhető

### Q6: Mi van ha merchant változtat témát?

| Megközelítés | Téma Váltás Impact |
|--------------|-------------------|
| 1. DOM Manipulation | 🔴 Breaking - újra kell írni |
| 2. Liquid Override | 🔴 Breaking - újra kell írni |
| 3. Theme Extension | 🟢 Működik - merchant bekapcsolja |
| 4. Ajax API Override | 🟡 Működik - de tesztelni kell |
| 5. Headless Custom | 🟢 Független |

### Q7: Van cookie consent compliance?

**A:** LocalStorage-ot használunk (nem tracking célra), de GDPR compliance érdekében cookie banner-ben disclaimer ajánlott.

---

## Következő Lépések

1. **Válassz megközelítést** a projekt fázis alapján
2. **Olvasd el a részletes spec-et** a kiválasztott megközelítéshez
3. **Implementáld fázisokban** (cart page → minicart → checkout)
4. **Teszteld alaposan** minden fázis után
5. **Dokumentáld** a változásokat STATE.md-ben

---

## Kapcsolódó Dokumentumok

- **PRD:** `docs/prd/01-STOREFRONT-ADD-TO-CART-LOCALSTORAGE.md`
- **Implementation Spec:** `docs/CART_IMPLEMENTATION_SPEC.md` (ezt követően létrehozható)
- **Context Engineering:** `CONTEXT_ENGINEERING.md`
- **Agent State:** `docs/agent/STATE.md`

---

**Dokumentum verzió:** 1.0
**Utolsó frissítés:** 2026-01-11
**Szerző:** PriceFlow Engineering Team

**Következő review:** Megközelítés kiválasztása után részletes implementációs spec készítése
