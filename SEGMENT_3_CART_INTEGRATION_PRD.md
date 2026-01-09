# Segment 3: Cart Integration PRD
**PriceFlow - Custom Pricing Draft Orders via Cart**

---

## Executive Summary

Ez a dokumentum leírja a PriceFlow alkalmazás 3. szegmensét, amely a termék kosárba helyezést LocalStorage alapú megoldással oldja meg, és a cart/checkout oldalon létrehoz egy új draft order-t custom árazással.

### Jelenlegi Állapot (Segment 2 után)
- ✅ Backend Draft Orders API működik
- ✅ Storefront app működik egyedi termék oldalon
- ✅ 2x-es árazás működik custom line items-zel
- ❌ Nincs multi-product kosár
- ❌ Nincs cart oldal integráció
- ❌ Nincs mini cart integráció

### Cél Állapot (Segment 3 után)
- ✅ Multi-product cart LocalStorage-ben
- ✅ Cart oldal extension custom checkout gombbal
- ✅ Mini cart drawer custom árak megjelenítése
- ✅ Batch draft order creation cart-ból

---

## 1. Technical Architecture

### 1.1 High-Level Flow

```
[Product Page]
    → Add to Cart gomb
    → LocalStorage mentés (eredeti + custom ár)
    → Mini cart update (DOM manipulation vagy event)

[Cart Page / Mini Cart]
    → LocalStorage-ból olvasás
    → Custom árak megjelenítése
    → "Checkout with Custom Pricing" gomb
    → API hívás (batch draft order)
    → Átirányítás draft order invoice URL-re
```

### 1.2 Technology Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Product tracking | LocalStorage | Persistent, egyszerű, theme-től független |
| Cart UI Extension | Theme App Extension | Shopify 2025 best practice, merchant installable |
| Mini Cart Update | Theme App Extension + DOM events | Native cart integration |
| Backend | NestJS API (existing) | Batch draft order creation endpoint |
| Data sync | Custom events + localStorage | Cross-component communication |

---

## 2. LocalStorage Schema

### 2.1 Data Structure

```typescript
// Key: 'priceflow_cart'
interface PriceFlowCart {
  version: string;              // "1.0.0" - schema versioning
  shopDomain: string;           // "test-dekormunka.myshopify.com"
  items: PriceFlowCartItem[];
  multiplier: number;           // 2 (global, vagy item-specific)
  createdAt: string;            // ISO timestamp
  expiresAt: string;            // ISO timestamp (24h)
}

interface PriceFlowCartItem {
  variantId: string;            // "15453650518403"
  productId: string;            // "123456789"
  title: string;                // "Premium Headphones"
  variantTitle: string;         // "Black / Large"
  imageUrl: string;             // Product image
  sku: string;                  // "WH-001-BLK-L"

  quantity: number;             // 1

  originalPrice: string;        // "100.00" - Shopify eredeti ár
  customPrice: string;          // "200.00" - Kalkulált custom ár
  multiplier: number;           // 2 - Item-specific multiplier

  addedAt: string;              // ISO timestamp
}
```

### 2.2 Storage Management

**Utility Functions:**
```typescript
// apps/storefront/lib/cart/localStorage.ts

export function getCart(): PriceFlowCart | null
export function saveCart(cart: PriceFlowCart): void
export function addItem(item: PriceFlowCartItem): void
export function removeItem(variantId: string): void
export function updateQuantity(variantId: string, quantity: number): void
export function clearCart(): void
export function isExpired(): boolean
```

**Expiration Policy:**
- Cart items expire after 24 hours
- Auto-clear on expiration check
- Warning message if items are about to expire (< 1 hour)

---

## 3. Product Page Integration

### 3.1 "Add to Cart" Button Changes

**Current Behavior (Segment 2):**
```
Click → Create Draft Order → Show checkout button
```

**New Behavior (Segment 3):**
```
Click → Add to LocalStorage → Show "Added!" message → Continue shopping
```

### 3.2 Implementation

**File:** `apps/storefront/components/draft-orders/AddToCartButton.tsx`

```typescript
const handleClick = async () => {
  // 1. Build cart item
  const cartItem: PriceFlowCartItem = {
    variantId: product.variantId,
    productId: product.productId,
    title: product.title,
    variantTitle: product.variantTitle,
    imageUrl: product.imageUrl,
    sku: product.sku,
    quantity: quantity,
    originalPrice: product.price,
    customPrice: (parseFloat(product.price) * multiplier).toFixed(2),
    multiplier: multiplier,
    addedAt: new Date().toISOString(),
  };

  // 2. Add to LocalStorage
  addItemToCart(cartItem);

  // 3. Emit custom event for mini cart
  window.dispatchEvent(new CustomEvent('priceflow:cart:updated', {
    detail: { cart: getCart() }
  }));

  // 4. Show success message
  setShowSuccess(true);
};
```

### 3.3 Success Message UI

```
┌─────────────────────────────────┐
│ ✓ Termék hozzáadva a kosárhoz! │
│   100 Ft → 200 Ft (2x ár)      │
├─────────────────────────────────┤
│ [Tovább vásárolok]  [Kosár →] │
└─────────────────────────────────┘
```

---

## 4. Cart Page Extension

### 4.1 Shopify Theme App Extension

**Dokumentáció:** [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)

**Target:** Cart page (`/cart`)

**Extension Type:** `cart-footer` or `cart-footer-actions`

### 4.2 Extension Structure

```
apps/extensions/cart-checkout/
├── shopify.extension.toml
├── blocks/
│   └── priceflow-checkout-button.liquid
├── assets/
│   ├── priceflow-cart.js
│   └── priceflow-cart.css
└── locales/
    ├── en.default.json
    └── hu.json
```

### 4.3 Extension Configuration

**shopify.extension.toml:**
```toml
[[extensions]]
type = "theme"
name = "PriceFlow Cart Checkout"

[[extensions.blocks]]
type = "cart-checkout-button"
name = "Custom Pricing Checkout"
target = "cart"
```

### 4.4 Button Implementation

**priceflow-checkout-button.liquid:**
```liquid
{% schema %}
{
  "name": "PriceFlow Checkout Button",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Checkout with Custom Pricing"
    }
  ]
}
{% endschema %}

<div class="priceflow-cart-actions" data-priceflow-cart>
  <div class="priceflow-cart-summary" data-summary>
    <!-- Populated by JavaScript -->
  </div>

  <button
    type="button"
    class="priceflow-checkout-btn"
    data-checkout-button
    disabled>
    {{ block.settings.button_text }}
  </button>

  <div class="priceflow-cart-error" data-error hidden>
    <!-- Error messages -->
  </div>
</div>

<script src="{{ 'priceflow-cart.js' | asset_url }}" defer></script>
```

**priceflow-cart.js:**
```javascript
(function() {
  'use strict';

  const API_URL = 'https://app.teszt.uk/api';

  // 1. Load cart from localStorage
  function loadCart() {
    const cartData = localStorage.getItem('priceflow_cart');
    return cartData ? JSON.parse(cartData) : null;
  }

  // 2. Render cart summary
  function renderSummary(cart) {
    const summary = document.querySelector('[data-summary]');
    if (!cart || cart.items.length === 0) {
      summary.innerHTML = '<p>Nincs custom áras termék a kosárban.</p>';
      return;
    }

    const totalOriginal = cart.items.reduce((sum, item) =>
      sum + parseFloat(item.originalPrice) * item.quantity, 0
    );
    const totalCustom = cart.items.reduce((sum, item) =>
      sum + parseFloat(item.customPrice) * item.quantity, 0
    );

    summary.innerHTML = `
      <div class="priceflow-summary">
        <h3>Custom Pricing Summary</h3>
        <p>${cart.items.length} termék custom árazással</p>
        <div class="price-comparison">
          <span class="original-price">${totalOriginal.toFixed(0)} Ft</span>
          <span class="arrow">→</span>
          <span class="custom-price">${totalCustom.toFixed(0)} Ft</span>
        </div>
      </div>
    `;

    // Enable button
    document.querySelector('[data-checkout-button]').disabled = false;
  }

  // 3. Handle checkout button click
  async function handleCheckout(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const errorDiv = document.querySelector('[data-error]');

    button.disabled = true;
    button.textContent = 'Rendelés létrehozása...';
    errorDiv.hidden = true;

    try {
      const cart = loadCart();
      if (!cart || cart.items.length === 0) {
        throw new Error('Nincs termék a kosárban');
      }

      // Build payload
      const payload = {
        shopDomain: cart.shopDomain,
        lineItems: cart.items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          originalPrice: item.originalPrice,
          customPrice: item.customPrice,
          title: item.title,
          variantTitle: item.variantTitle,
          sku: item.sku,
          imageUrl: item.imageUrl,
        })),
        note: `PriceFlow Cart - ${cart.items.length} items with custom pricing`,
        tags: ['priceflow', 'cart-checkout', `multiplier-${cart.multiplier}`],
      };

      // Create draft order
      const response = await fetch(`${API_URL}/draft-orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop': cart.shopDomain,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const draftOrder = await response.json();

      // Clear cart
      localStorage.removeItem('priceflow_cart');

      // Redirect to checkout
      window.location.href = draftOrder.invoiceUrl;

    } catch (error) {
      console.error('Checkout error:', error);
      errorDiv.textContent = `Hiba: ${error.message}`;
      errorDiv.hidden = false;
      button.disabled = false;
      button.textContent = 'Próbáld újra';
    }
  }

  // 4. Initialize
  document.addEventListener('DOMContentLoaded', () => {
    const cart = loadCart();
    renderSummary(cart);

    const button = document.querySelector('[data-checkout-button]');
    button.addEventListener('click', handleCheckout);

    // Listen for cart updates
    window.addEventListener('priceflow:cart:updated', (e) => {
      renderSummary(e.detail.cart);
    });
  });
})();
```

---

## 5. Mini Cart Integration

### 5.1 Problem Analysis

**Shopify Mini Cart Types:**
1. **Theme-native drawer** - Liquid által generált
2. **Ajax Cart (ShopifyAPI)** - JavaScript által frissített
3. **Third-party apps** - Kaching, Upcart, stb.

**Challenge:** Minden theme különbözőképpen implementálja a mini cart-ot.

### 5.2 Kutatási Eredmények

#### Cart Drawer Apps (2025)
A legnépszerűbb megoldások ([forrás](https://instant.so/blog/best-shopify-cart-drawer-apps)):
- **Kaching Cart Drawer** - UX-focused, no coding required
- **Upcart** - Full featured drawer cart builder
- **AMP** - Cart as promotional hub
- **Instant** - Full theme builder with custom cart drawer

#### Theme App Extension Cart/Drawer Support
Dokumentáció szerint ([forrás](https://community.shopify.dev/t/injecting-theme-app-extension-block-to-cart-and-cart-drawer-pages/3833)):
- Theme app extension block-ok renderelhetők cart és cart drawer oldalakon
- `target: "cart"` és `target: "cart-drawer"` támogatott

### 5.3 Javasolt Megoldások

#### 5.3.1 Megoldás A: Theme App Extension Block (Preferált)

**Előnyök:**
- ✅ Native Shopify integráció
- ✅ Merchant által engedélyezhető
- ✅ Nem igényel DOM manipulation
- ✅ Theme-kompatibilis

**Implementáció:**
```liquid
{%- # apps/extensions/cart-checkout/blocks/mini-cart-summary.liquid -%}
{% schema %}
{
  "name": "PriceFlow Mini Cart Summary",
  "target": "cart-drawer",
  "settings": []
}
{% endschema %}

<div class="priceflow-mini-cart" data-priceflow-mini-cart>
  <!-- JavaScript által populált -->
</div>

<script>
  // LocalStorage cart items render
  // Hasonló a cart page logikához
</script>
```

#### 5.3.2 Megoldás B: JavaScript Event Injection (Fallback)

Ha a theme nem támogatja a cart drawer extension-t:

**Stratégia:**
```javascript
// apps/storefront/lib/cart/miniCartInjector.ts

// 1. Detect mini cart type
function detectMiniCartType() {
  if (document.querySelector('.cart-drawer')) return 'native-drawer';
  if (document.querySelector('[data-kaching-cart]')) return 'kaching';
  if (document.querySelector('[data-upcart]')) return 'upcart';
  return 'unknown';
}

// 2. Inject custom pricing display
function injectCustomPricing() {
  const cartType = detectMiniCartType();

  switch(cartType) {
    case 'native-drawer':
      injectToNativeDrawer();
      break;
    case 'kaching':
      injectToKaching();
      break;
    // ... stb
  }
}

// 3. Listen to cart open events
function hookCartEvents() {
  // Listen to Shopify cart drawer open
  document.addEventListener('cart:open', injectCustomPricing);

  // MutationObserver for dynamic carts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList.contains('cart-drawer--open')) {
        injectCustomPricing();
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class']
  });
}
```

#### 5.3.3 Megoldás C: Custom Mini Cart Widget

**Ha minden más megoldás sikertelen:**

Saját mini cart indicator widget:
```
┌────────────────────┐
│ 🛒 PriceFlow Cart │
│ 3 items • 600 Ft  │
│ [Kosár megtekintése]│
└────────────────────┘
```

Floating widget a jobb alsó sarokban, amely:
- LocalStorage-ból olvas
- Mindig látható
- Átirányít a cart page-re

---

## 6. Backend API Extension

### 6.1 New Endpoint: Batch Draft Order Creation

**Endpoint:** `POST /api/draft-orders/create-from-cart`

**Különbség a jelenlegi `/create` endpoint-tól:**
- Több line item egy hívásban
- Cart metadata támogatás
- Batch validation

**Implementation:**

```typescript
// apps/api/src/domains/draft-order/dto/create-from-cart.dto.ts

export class CreateFromCartDto {
  @IsNotEmpty()
  @IsString()
  shopDomain: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartLineItemDto)
  lineItems: CartLineItemDto[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  cartMetadata?: {
    createdAt: string;
    multiplier: number;
    itemCount: number;
  };
}

export class CartLineItemDto extends LineItemDto {
  // Same as LineItemDto but with additional validation

  @IsNotEmpty()
  @IsString()
  productId: string; // Track product ID too
}
```

**Controller:**
```typescript
// apps/api/src/domains/draft-order/controllers/draft-order.controller.ts

@Post('create-from-cart')
async createFromCart(
  @ShopId() shopDomain: string,
  @Body() createDto: CreateFromCartDto,
): Promise<DraftOrderResponse> {
  const accessToken = await this.getAccessToken(shopDomain);

  // Validate cart items
  if (createDto.lineItems.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

  if (createDto.lineItems.length > 100) {
    throw new BadRequestException('Too many items (max 100)');
  }

  return this.draftOrderService.createDraftOrder(
    shopDomain,
    accessToken,
    createDto,
  );
}
```

---

## 7. Implementation Roadmap

### Phase 1: LocalStorage Infrastructure (Week 1)
- [ ] Create LocalStorage utility functions
- [ ] Define cart schema and types
- [ ] Implement expiration logic
- [ ] Add cart state management hook
- [ ] Unit tests for storage layer

### Phase 2: Product Page Integration (Week 1)
- [ ] Modify AddToCartButton component
- [ ] Implement "Add to Cart" → LocalStorage flow
- [ ] Create success message UI
- [ ] Add "Continue Shopping" + "View Cart" buttons
- [ ] Emit custom events for cart updates
- [ ] Test with multiple products

### Phase 3: Cart Page Extension (Week 2)
- [ ] Create theme app extension structure
- [ ] Implement cart-checkout-button block
- [ ] Build JavaScript cart reader
- [ ] Create checkout button handler
- [ ] API integration for batch draft order
- [ ] Error handling and loading states
- [ ] Test installation and merchant experience

### Phase 4: Backend API (Week 2)
- [ ] Create `create-from-cart` endpoint
- [ ] Implement batch validation
- [ ] Add cart metadata support
- [ ] Update error handling
- [ ] Integration tests
- [ ] Performance testing (100 items)

### Phase 5: Mini Cart Integration (Week 3)
- [ ] Research theme compatibility
- [ ] Implement Theme App Extension for cart drawer
- [ ] Create fallback injection strategy
- [ ] Test with popular themes (Dawn, Debut, etc.)
- [ ] Test with popular cart apps (Kaching, Upcart)
- [ ] Document compatibility matrix

### Phase 6: Testing & Polish (Week 3-4)
- [ ] End-to-end testing flow
- [ ] Multi-browser testing
- [ ] Mobile responsive testing
- [ ] Performance optimization
- [ ] Error recovery testing
- [ ] Documentation and merchant guide

---

## 8. Technical Challenges & Solutions

### 8.1 Cross-Domain LocalStorage

**Problem:** Product pages és cart page különböző domain-ek lehetnek (pl. myshop.com vs checkout.myshop.com)

**Solution:**
- LocalStorage csak main domain-en
- Cart page mindig main domain-en van (`/cart`)
- Checkout URL external (Shopify-hosted)

### 8.2 Cart Sync with Shopify Native Cart

**Problem:** User hozzáad normál terméket is a Shopify cart-hoz, nem csak PriceFlow-n keresztül

**Solution:**
1. **Ne konkuráljunk** - PriceFlow cart külön entitás
2. **Merchant choice** - Vagy PriceFlow checkout, vagy normál Shopify checkout
3. **Clear messaging** - "Custom pricing checkout" vs "Standard checkout"

**UI:**
```
┌─────────────────────────────────────────────┐
│ Kosár (3 termék)                           │
├─────────────────────────────────────────────┤
│ [Standard Checkout]                         │
│                                             │
│ --- vagy ---                                │
│                                             │
│ PriceFlow Custom Pricing (2 termék)        │
│ 200 Ft → 400 Ft                            │
│ [Checkout with Custom Pricing]             │
└─────────────────────────────────────────────┘
```

### 8.3 Theme Compatibility

**Problem:** 1000+ Shopify themes, mindegyik más cart implementációval

**Solution:**
1. **Primary:** Theme App Extension (hivatalos Shopify módszer)
2. **Secondary:** JavaScript injection népszerű theme-ekhez
3. **Tertiary:** Dokumentáció merchant-eknek custom integration-hez
4. **Fallback:** Floating widget mindig működik

### 8.4 localStorage Limits

**Problem:** localStorage ~5-10MB limit, sok termék esetén betölhet

**Solution:**
- Max 100 termék cart-ban (business rule)
- Csak essential data tárolása
- Compression (LZString library) ha szükséges
- Warning ha limit közelében

---

## 9. Security Considerations

### 9.1 Data Validation

- **Backend validation:** Minden API request validálva (DTO-k)
- **Price tampering:** Backend újraszámolja az árakat (ne bízzunk a frontend-ben)
- **XSS prevention:** Sanitize minden user input (termék címek, stb.)

### 9.2 Shop Domain Verification

```typescript
// Backend
private validateShopDomain(requestShop: string, tokenShop: string) {
  if (requestShop !== tokenShop) {
    throw new UnauthorizedException('Shop domain mismatch');
  }
}
```

### 9.3 Rate Limiting

- Max 10 draft order creation / minute / shop
- Prevent API abuse

---

## 10. Analytics & Monitoring

### 10.1 Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Cart Abandon Rate | % of users who add to cart but don't checkout | < 30% |
| Conversion Rate | % of PriceFlow carts that convert to orders | > 15% |
| Average Items | Avg # of items in PriceFlow cart | 2-3 |
| Error Rate | % of failed draft order creations | < 2% |
| Load Time | Time from click to checkout URL redirect | < 3s |

### 10.2 Event Tracking

```typescript
// Track key events
analytics.track('priceflow_cart_item_added', {
  variantId: item.variantId,
  originalPrice: item.originalPrice,
  customPrice: item.customPrice,
  multiplier: item.multiplier,
});

analytics.track('priceflow_checkout_initiated', {
  itemCount: cart.items.length,
  totalValue: calculateTotal(cart),
});

analytics.track('priceflow_draft_order_created', {
  draftOrderId: response.id,
  itemCount: lineItems.length,
  totalPrice: response.totalPrice,
});
```

---

## 11. Merchant Experience

### 11.1 Installation Flow

1. **Install app** from Shopify App Store
2. **Grant permissions** (read_products, write_draft_orders)
3. **Enable theme extension**:
   - Go to Theme Editor
   - Add "PriceFlow Checkout Button" block to cart page
   - Add "PriceFlow Mini Cart Summary" block to cart drawer (optional)
4. **Configure settings**:
   - Default price multiplier
   - Button text customization
   - Enable/disable features
5. **Test** with test orders

### 11.2 Settings UI (Admin App)

```
┌─────────────────────────────────────────────┐
│ Cart Integration Settings                   │
├─────────────────────────────────────────────┤
│                                             │
│ □ Enable cart page integration             │
│ □ Enable mini cart integration             │
│                                             │
│ Default Price Multiplier: [2] x            │
│                                             │
│ Checkout Button Text:                      │
│ [Checkout with Custom Pricing            ] │
│                                             │
│ Cart Display:                               │
│ ○ Show original and custom prices          │
│ ○ Show only custom prices                  │
│                                             │
│ [Save Settings]                             │
└─────────────────────────────────────────────┘
```

---

## 12. Success Criteria

### 12.1 Functional Requirements
- ✅ Users can add multiple products to PriceFlow cart
- ✅ Cart persists across sessions (24h)
- ✅ Cart page shows custom pricing summary
- ✅ Checkout button creates batch draft order
- ✅ Mini cart displays custom prices (where supported)
- ✅ Mobile responsive on all devices

### 12.2 Performance Requirements
- ✅ Cart page load time < 2s
- ✅ Draft order creation < 5s (for 10 items)
- ✅ LocalStorage operations < 50ms
- ✅ 99.5% uptime for API

### 12.3 Compatibility Requirements
- ✅ Works with Shopify 2.0 themes
- ✅ Compatible with Dawn, Debut, Brooklyn themes
- ✅ Graceful degradation for unsupported themes
- ✅ Works on Chrome, Firefox, Safari, Edge (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 13. Future Enhancements (Post-Segment 3)

### 13.1 Advanced Features
- **Cart sharing:** Generate URL to share cart with custom pricing
- **Bulk pricing:** Different multipliers per product category
- **Tiered pricing:** Volume discounts (3+ items = 1.8x instead of 2x)
- **Customer groups:** Different multipliers for different customer tags
- **Email cart:** Send cart via email to customer

### 13.2 Integration Opportunities
- **Klaviyo:** Abandoned cart emails with custom pricing
- **Google Analytics:** Enhanced ecommerce tracking
- **Loyalty apps:** Points earning on custom-priced purchases

---

## 14. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Theme incompatibility | Medium | High | Multiple fallback strategies + documentation |
| localStorage cleared by user | Low | Medium | Session warning, educational messaging |
| API rate limiting | Low | Medium | Queue system, retry logic |
| Draft order creation failure | Medium | High | Robust error handling, retry mechanism |
| Cart drawer app conflicts | Medium | Medium | Compatibility testing with top 10 cart apps |
| Mobile UX issues | Low | Medium | Responsive design testing |

---

## 15. Research Sources

### Official Shopify Documentation
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions) - Checkout extensibility overview
- [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions) - Official guide for theme extensions
- [Cart and Cart Drawer Extensions](https://community.shopify.dev/t/injecting-theme-app-extension-block-to-cart-and-cart-drawer-pages/3833) - Community discussion on cart integration

### Industry Research (2025)
- [Best Shopify Cart Drawer Apps for 2025](https://instant.so/blog/best-shopify-cart-drawer-apps) - Cart drawer app comparison and features
- [Shopify Checkout Extensibility Upgrade](https://www.flatlineagency.com/blog/shopify-checkout-upgrade-2025/) - 2025 checkout changes and deadlines

### Implementation Resources
- [LocalStorage in Shopify Apps](https://community.shopify.com/t/use-local-storage-or-similar-on-product-or-home-page/364629) - localStorage usage patterns
- [Passing Data to Checkout Extensions](https://community.shopify.com/t/passing-data-from-theme-app-extension-to-checkout-ui-extension/246426) - Data flow between extensions

---

## 16. Appendix

### A. LocalStorage Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 4+ | ✅ Full | ~10MB limit |
| Firefox 3.5+ | ✅ Full | ~10MB limit |
| Safari 4+ | ✅ Full | ~5MB limit |
| Edge | ✅ Full | ~10MB limit |
| iOS Safari | ✅ Full | May clear in private mode |
| Chrome Mobile | ✅ Full | ~5MB limit |

### B. Example Cart JSON

```json
{
  "version": "1.0.0",
  "shopDomain": "test-dekormunka.myshopify.com",
  "items": [
    {
      "variantId": "15453650518403",
      "productId": "123456",
      "title": "Premium Wireless Headphones",
      "variantTitle": "Black / Large",
      "imageUrl": "https://cdn.shopify.com/...",
      "sku": "WH-001-BLK-L",
      "quantity": 2,
      "originalPrice": "100.00",
      "customPrice": "200.00",
      "multiplier": 2,
      "addedAt": "2026-01-07T22:00:00.000Z"
    },
    {
      "variantId": "15453650518404",
      "productId": "123457",
      "title": "USB-C Cable",
      "variantTitle": "2m",
      "imageUrl": "https://cdn.shopify.com/...",
      "sku": "CBL-USB-2M",
      "quantity": 1,
      "originalPrice": "15.00",
      "customPrice": "30.00",
      "multiplier": 2,
      "addedAt": "2026-01-07T22:05:00.000Z"
    }
  ],
  "multiplier": 2,
  "createdAt": "2026-01-07T22:00:00.000Z",
  "expiresAt": "2026-01-08T22:00:00.000Z"
}
```

### C. Draft Order Creation API Response

```json
{
  "id": "1562897056131",
  "invoiceUrl": "https://test-dekormunka.myshopify.com/...",
  "subtotalPrice": "430.00",
  "totalPrice": "430.00",
  "totalTax": "0.00",
  "lineItems": [
    {
      "variantId": "15453650518403",
      "quantity": 2,
      "originalPrice": "100.00",
      "customPrice": "200.00",
      "title": "Premium Wireless Headphones",
      "sku": "WH-001-BLK-L"
    },
    {
      "variantId": "15453650518404",
      "quantity": 1,
      "originalPrice": "15.00",
      "customPrice": "30.00",
      "title": "USB-C Cable",
      "sku": "CBL-USB-2M"
    }
  ],
  "status": "open",
  "createdAt": "2026-01-07T22:10:00.000Z",
  "expiresAt": "2026-01-08T22:10:00.000Z"
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-07
**Status:** Draft - Pending Review
**Next Review:** Before implementation start
