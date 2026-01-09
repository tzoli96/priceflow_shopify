# PRD Segment 1: Widget/Extension Modification - Custom Add to Cart

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Draft
**Priority:** P0 (Critical)
**Dependencies:** None
**Part of:** Draft Orders Custom Pricing Implementation

---

## Executive Summary

This document outlines the **Storefront Extension Widget modifications** required to replace the default Shopify "Add to Cart" button with a custom implementation that communicates with our Draft Orders API. This is **Segment 1** of a multi-phase implementation enabling custom pricing (2x price) on non-Plus Shopify stores.

**Goal:** Replace the native Add to Cart button on product pages with a custom button that triggers Draft Order creation instead of standard cart operations.

---

## 1. Problem Statement

### Current State
- Shopify native "Add to Cart" button adds products at their default price
- Standard checkout flow cannot be modified on non-Plus plans
- Cart Transform Functions require Shopify Plus for custom apps

### Desired State
- Custom "Add to Cart" button on product pages
- Button triggers backend API call to create Draft Order with 2x price
- User redirected to Draft Order checkout URL
- Support for multiple products in a single Draft Order session

### Why This Approach?
- **Shopify Plus NOT required** ✅
- Works on Basic/Standard/Advanced plans ✅
- Full price control via Draft Orders API ✅
- Custom pricing persists through checkout ✅

---

## 2. User Stories

### US-001: Merchant installs widget extension
```
GIVEN I am a merchant with PriceFlow installed
WHEN I enable the PriceFlow widget extension
THEN the custom Add to Cart button appears on all product pages
AND the default Shopify Add to Cart button is hidden
```

### US-002: Customer adds product with custom price
```
GIVEN I am a customer viewing a product page
WHEN I click the "Add to Cart (2x Price)" button
THEN I see a loading indicator
AND the system creates a Draft Order with 2x price in the backend
AND I am redirected to the checkout page with the custom price
AND the original product price is visible for transparency
```

### US-003: Customer adds multiple products
```
GIVEN I have already added a product via the custom button
WHEN I return to another product page and click "Add to Cart (2x Price)"
THEN the system adds the new product to the existing Draft Order
AND I see both products in the checkout
AND both products have 2x pricing applied
```

### US-004: Customer sees price transparency
```
GIVEN I clicked the custom Add to Cart button
WHEN I view the product card/button area
THEN I see a disclaimer: "Original price: $X, Custom price: $Y (2x)"
AND I understand the pricing before clicking
```

---

## 3. Technical Specification

### 3.1 Extension Architecture

**Location:** `extensions/priceflow-widget/`

**Extension Type:** `ui_extension` targeting `purchase.product.details.block`

**Tech Stack:**
- React (Shopify UI Extensions React)
- TypeScript
- Shopify App Bridge (for authentication)
- Fetch API (backend communication)

### 3.2 File Structure

```
extensions/priceflow-widget/
├── shopify.extension.toml          # Extension configuration
├── src/
│   ├── index.tsx                   # Entry point
│   ├── components/
│   │   ├── AddToCartButton.tsx     # Main button component
│   │   ├── PriceDisplay.tsx        # Price transparency component
│   │   ├── LoadingSpinner.tsx      # Loading state component
│   │   └── ErrorBanner.tsx         # Error handling component
│   ├── hooks/
│   │   ├── useDraftOrder.ts        # Draft Order API hook
│   │   └── useProduct.ts           # Product data hook
│   ├── utils/
│   │   ├── priceCalculator.ts      # 2x price calculation logic
│   │   └── apiClient.ts            # Backend API client
│   └── types/
│       └── index.ts                # TypeScript types
└── locales/
    ├── en.default.json             # English translations
    └── hu.json                     # Hungarian translations
```

### 3.3 Extension Configuration (`shopify.extension.toml`)

```toml
api_version = "2024-10"
name = "PriceFlow Custom Add to Cart"
handle = "priceflow-add-to-cart"

[[extensions]]
type = "ui_extension"
name = "Custom Add to Cart Button"

[[extensions.targeting]]
target = "purchase.product.details.block"
module = "./src/index.tsx"

[extensions.capabilities]
network_access = true
# Szükséges a backend API hívásokhoz

[extensions.settings]
[[extensions.settings.fields]]
key = "enable_price_display"
type = "boolean"
name = "Show original price"
default = true

[[extensions.settings.fields]]
key = "price_multiplier"
type = "number"
name = "Price multiplier"
default = 2
```

### 3.4 Main Component Implementation

#### `src/components/AddToCartButton.tsx`

```tsx
import React, { useState } from 'react';
import {
  Button,
  BlockStack,
  InlineLayout,
  Text,
  Icon,
  useApi,
  useSettings,
  useCartLines,
  useProduct,
} from '@shopify/ui-extensions-react/checkout';
import { useDraftOrder } from '../hooks/useDraftOrder';
import { calculateCustomPrice } from '../utils/priceCalculator';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';
import { PriceDisplay } from './PriceDisplay';

export function AddToCartButton() {
  const { createOrUpdateDraftOrder, loading, error } = useDraftOrder();
  const { selectedVariant, product } = useProduct();
  const settings = useSettings();
  const [quantity, setQuantity] = useState(1);

  const originalPrice = parseFloat(selectedVariant?.price?.amount || '0');
  const multiplier = settings.price_multiplier || 2;
  const customPrice = calculateCustomPrice(originalPrice, multiplier);

  async function handleAddToCart() {
    if (!selectedVariant) {
      console.error('No variant selected');
      return;
    }

    try {
      // Call backend API to create/update Draft Order
      const result = await createOrUpdateDraftOrder({
        variantId: selectedVariant.id,
        quantity: quantity,
        originalPrice: originalPrice,
        customPrice: customPrice,
        productTitle: product.title,
        variantTitle: selectedVariant.title,
      });

      // Redirect to Draft Order checkout
      if (result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  }

  return (
    <BlockStack spacing="base">
      {/* Price transparency display */}
      {settings.enable_price_display && (
        <PriceDisplay
          originalPrice={originalPrice}
          customPrice={customPrice}
          multiplier={multiplier}
        />
      )}

      {/* Quantity selector */}
      <InlineLayout columns={['fill', 'auto']}>
        <Text>Quantity:</Text>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          min={1}
          style={{
            width: '60px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </InlineLayout>

      {/* Error banner */}
      {error && <ErrorBanner message={error} />}

      {/* Add to Cart button */}
      <Button
        onPress={handleAddToCart}
        disabled={loading || !selectedVariant}
        kind="primary"
        loading={loading}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          `Add to Cart (${multiplier}x Price)`
        )}
      </Button>

      {/* Continue shopping link */}
      <Text size="small" appearance="subdued">
        Multiple products? You can add more items before checkout.
      </Text>
    </BlockStack>
  );
}
```

#### `src/components/PriceDisplay.tsx`

```tsx
import React from 'react';
import { BlockStack, Text, InlineLayout } from '@shopify/ui-extensions-react/checkout';

interface PriceDisplayProps {
  originalPrice: number;
  customPrice: number;
  multiplier: number;
}

export function PriceDisplay({ originalPrice, customPrice, multiplier }: PriceDisplayProps) {
  return (
    <BlockStack
      spacing="tight"
      border="base"
      cornerRadius="base"
      padding="base"
      background="subdued"
    >
      <InlineLayout columns={['fill', 'auto']}>
        <Text size="small" appearance="subdued">Original price:</Text>
        <Text size="small" appearance="subdued" style={{ textDecoration: 'line-through' }}>
          ${originalPrice.toFixed(2)}
        </Text>
      </InlineLayout>

      <InlineLayout columns={['fill', 'auto']}>
        <Text size="medium" emphasis="bold">Custom price ({multiplier}x):</Text>
        <Text size="medium" emphasis="bold" appearance="accent">
          ${customPrice.toFixed(2)}
        </Text>
      </InlineLayout>

      <Text size="small" appearance="subdued">
        This custom pricing applies to your order.
      </Text>
    </BlockStack>
  );
}
```

### 3.5 Draft Order Hook Implementation

#### `src/hooks/useDraftOrder.ts`

```typescript
import { useState } from 'react';
import { apiClient } from '../utils/apiClient';

interface DraftOrderItem {
  variantId: string;
  quantity: number;
  originalPrice: number;
  customPrice: number;
  productTitle: string;
  variantTitle: string;
}

interface DraftOrderResponse {
  invoiceUrl: string;
  draftOrderId: string;
  lineItems: any[];
}

export function useDraftOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);

  async function createOrUpdateDraftOrder(item: DraftOrderItem): Promise<DraftOrderResponse> {
    setLoading(true);
    setError(null);

    try {
      // Check if there's an existing draft order in session
      const existingDraftOrderId = sessionStorage.getItem('priceflow_draft_order_id');

      const endpoint = existingDraftOrderId
        ? `/api/draft-orders/${existingDraftOrderId}/add-item`
        : `/api/draft-orders/create`;

      const response = await apiClient.post<DraftOrderResponse>(endpoint, item);

      // Save draft order ID to session for multi-product support
      sessionStorage.setItem('priceflow_draft_order_id', response.draftOrderId);
      setDraftOrderId(response.draftOrderId);

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create order. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function clearDraftOrder() {
    sessionStorage.removeItem('priceflow_draft_order_id');
    setDraftOrderId(null);
  }

  return {
    createOrUpdateDraftOrder,
    clearDraftOrder,
    loading,
    error,
    draftOrderId,
  };
}
```

### 3.6 API Client Utility

#### `src/utils/apiClient.ts`

```typescript
const API_BASE_URL = process.env.API_URL || 'https://app.teszt.uk';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const shopDomain = this.getShopDomain();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop': shopDomain,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
  }

  private getShopDomain(): string {
    // Extract shop domain from URL or config
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shop') || window.Shopify?.shop || '';
  }
}

export const apiClient = new ApiClient();
```

### 3.7 Price Calculator Utility

#### `src/utils/priceCalculator.ts`

```typescript
/**
 * Calculate custom price based on multiplier
 *
 * @param originalPrice - Original product price
 * @param multiplier - Price multiplier (default: 2)
 * @returns Custom price rounded to 2 decimals
 */
export function calculateCustomPrice(
  originalPrice: number,
  multiplier: number = 2
): number {
  if (originalPrice <= 0) {
    throw new Error('Invalid original price');
  }

  if (multiplier <= 0) {
    throw new Error('Invalid multiplier');
  }

  return Math.round(originalPrice * multiplier * 100) / 100;
}

/**
 * Format price for display
 *
 * @param price - Price amount
 * @param currency - Currency code (default: USD)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}
```

---

## 4. User Interface Design

### 4.1 Button States

| State | Visual | Behavior |
|-------|--------|----------|
| **Default** | Green button, white text: "Add to Cart (2x Price)" | Clickable |
| **Loading** | Spinner + "Adding..." | Disabled |
| **Error** | Red banner above button | Clickable (retry) |
| **Success** | Redirect (no state visible) | N/A |
| **Disabled** | Gray button, "Select variant first" | Not clickable |

### 4.2 Layout Mockup

```
┌─────────────────────────────────────────────┐
│ Product Image                   Product Info│
│                                             │
│  [Price Transparency Card]                  │
│  Original price: $19.99                     │
│  Custom price (2x): $39.98                  │
│  This custom pricing applies to your order. │
│                                             │
│  Quantity: [1]                              │
│                                             │
│  [Add to Cart (2x Price)]                   │
│                                             │
│  Multiple products? You can add more items  │
│  before checkout.                           │
└─────────────────────────────────────────────┘
```

### 4.3 Mobile Responsive Design

- Button spans full width on mobile (<768px)
- Price display card stacks vertically
- Quantity selector remains inline
- Font sizes scale appropriately

---

## 5. Configuration & Settings

### 5.1 Merchant Settings (Shopify Admin)

Accessible via: **Shopify Admin → Apps → PriceFlow → Widget Settings**

**Settings:**
1. **Enable Custom Add to Cart** (toggle)
   - Default: ON
   - Description: "Replace default Add to Cart button with custom pricing button"

2. **Show Original Price** (toggle)
   - Default: ON
   - Description: "Display original price alongside custom price for transparency"

3. **Price Multiplier** (number input)
   - Default: 2
   - Min: 1.01
   - Max: 10
   - Description: "Price multiplier (e.g., 2 = 2x original price)"

4. **Button Text** (text input)
   - Default: "Add to Cart ({multiplier}x Price)"
   - Max length: 50 chars
   - Description: "Custom button text. Use {multiplier} placeholder."

### 5.2 Developer Configuration (Extension)

**Environment Variables:**
```bash
# API Backend URL
API_URL=https://app.teszt.uk

# Default price multiplier (overridden by merchant settings)
DEFAULT_PRICE_MULTIPLIER=2

# Enable debug logging
DEBUG_MODE=false
```

---

## 6. Error Handling

### 6.1 Error Scenarios

| Error | Cause | User Message | Recovery Action |
|-------|-------|--------------|-----------------|
| **Network Failure** | API unreachable | "Connection error. Please check your internet." | Retry button |
| **Invalid Variant** | No variant selected | "Please select product options first." | Disable button |
| **API Error 500** | Backend failure | "Something went wrong. Please try again later." | Retry button |
| **Draft Order Full** | Too many line items | "Cart limit reached. Please checkout first." | Redirect to checkout |
| **Invalid Price** | Price = 0 or negative | "Invalid product price. Contact support." | Hide button |

### 6.2 Error Logging

All errors logged to:
1. **Browser Console** (development only)
2. **Backend API** (`POST /api/logs/frontend-errors`)
3. **Shopify App Bridge** (for app analytics)

---

## 7. Testing Requirements

### 7.1 Unit Tests

**Files to test:**
- `priceCalculator.ts` - Edge cases (0 price, negative, very large numbers)
- `apiClient.ts` - HTTP request/response handling
- `useDraftOrder.ts` - State management logic

**Test Coverage Target:** 80%+

### 7.2 Integration Tests

**Scenarios:**
1. Button click → API call → Response handling
2. Multi-product addition (sessionStorage persistence)
3. Error recovery (network failure, retry logic)

### 7.3 Manual Testing Checklist

- [ ] Button renders on product page
- [ ] Price display shows correct 2x calculation
- [ ] Quantity selector updates correctly
- [ ] Loading state displays during API call
- [ ] Success → Redirect to checkout URL
- [ ] Error → Error banner displays
- [ ] Multiple products → sessionStorage tracks draft order ID
- [ ] Mobile responsive layout
- [ ] Accessibility (keyboard navigation, screen reader)

---

## 8. Performance Requirements

### 8.1 Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Button Render Time** | < 100ms | Time to Interactive |
| **API Call Latency** | < 500ms | Network waterfall |
| **Loading State Feedback** | Instant | User perception |
| **Bundle Size** | < 50KB | Webpack analyzer |

### 8.2 Optimization Strategies

1. **Code Splitting:** Lazy load error components
2. **Memoization:** Cache price calculations
3. **Debouncing:** Quantity input changes
4. **Prefetch:** Backend API warmup on page load

---

## 9. Localization

### 9.1 Supported Languages

- English (en) - Default
- Hungarian (hu)

### 9.2 Translation Keys

```json
{
  "button.addToCart": "Add to Cart ({multiplier}x Price)",
  "button.adding": "Adding...",
  "price.original": "Original price:",
  "price.custom": "Custom price ({multiplier}x):",
  "price.disclaimer": "This custom pricing applies to your order.",
  "quantity.label": "Quantity:",
  "error.network": "Connection error. Please try again.",
  "error.invalidVariant": "Please select product options first.",
  "info.multiProduct": "Multiple products? You can add more items before checkout."
}
```

---

## 10. Security Considerations

### 10.1 CSRF Protection

- All API requests include `X-Shopify-Shop` header
- Backend validates shop domain against database

### 10.2 Input Validation

- Quantity: Min 1, Max 100 (client-side)
- Price: Backend validates against Shopify product data
- Session storage: Draft Order ID format validation

### 10.3 Data Privacy

- No customer PII stored in extension
- SessionStorage cleared after successful checkout
- All API communication over HTTPS

---

## 11. Deployment Strategy

### 11.1 Deployment Steps

```bash
# 1. Build extension
cd extensions/priceflow-widget
npm install
npm run build

# 2. Deploy to Shopify
shopify app deploy

# 3. Publish extension (Shopify Partner Dashboard)
# Apps → PriceFlow → Extensions → Publish

# 4. Merchant enables extension
# Shopify Admin → Online Store → Editor → Add app block
```

### 11.2 Rollback Plan

1. **Disable extension** in Partner Dashboard
2. Merchant reverts to native Add to Cart button
3. Investigate issue in dev environment
4. Redeploy fixed version

---

## 12. Success Metrics

### 12.1 KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Extension Load Success Rate** | > 99% | Error logs |
| **Button Click → Checkout Redirect** | < 2 seconds | Performance monitoring |
| **Error Rate** | < 1% | Error tracking |
| **Merchant Adoption** | > 80% enable extension | Usage analytics |

### 12.2 User Feedback

- Post-deployment survey to merchants
- Monitor support tickets related to widget
- A/B test button text variations

---

## 13. Dependencies & Prerequisites

### 13.1 External Dependencies

- Shopify UI Extensions SDK v2024-10+
- React 18+
- TypeScript 5+
- Node.js 18+

### 13.2 Backend Dependencies

- **Segment 2:** Draft Orders API implementation (see PRD 02)
- API endpoint: `POST /api/draft-orders/create`
- API endpoint: `POST /api/draft-orders/{id}/add-item`

### 13.3 Shopify Requirements

- Shopify store (any plan: Basic, Standard, Advanced)
- PriceFlow app installed
- API scopes: `write_draft_orders`, `read_products`

---

## 14. Future Enhancements (Out of Scope)

1. **Dynamic multiplier based on customer tags** (wholesale pricing)
2. **Product-specific multipliers** (metafield-driven)
3. **Discount code compatibility** (apply discount to custom price)
4. **Variant image display** in price card
5. **Animation effects** on button success

---

## 15. Appendix

### 15.1 Related Documents

- **[PRD 02: Backend Draft Orders API](./02-BACKEND-DRAFT-ORDERS-API.md)**
- **[PRD 03: Checkout Flow & Multi-Product Cart](./03-CHECKOUT-FLOW-MULTI-PRODUCT.md)**
- **[PRD 04: Testing & Deployment](./04-TESTING-DEPLOYMENT.md)**

### 15.2 API Endpoint Contract

**POST /api/draft-orders/create**
```json
{
  "variantId": "gid://shopify/ProductVariant/123456",
  "quantity": 1,
  "originalPrice": 19.99,
  "customPrice": 39.98,
  "productTitle": "Example Product",
  "variantTitle": "Red / Large"
}
```

**Response:**
```json
{
  "invoiceUrl": "https://test-shop.myshopify.com/123456/invoices/abc123",
  "draftOrderId": "gid://shopify/DraftOrder/789012",
  "lineItems": [...]
}
```

---

## Document Metadata

- **Version:** 1.0
- **Last Updated:** 2026-01-07
- **Author:** PriceFlow Engineering Team
- **Status:** Draft for Implementation
- **Next Review:** After Segment 2 completion

---

## Approval Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | | | |
| Tech Lead | | | |
| Frontend Engineer | | | |
| UX Designer | | | |
