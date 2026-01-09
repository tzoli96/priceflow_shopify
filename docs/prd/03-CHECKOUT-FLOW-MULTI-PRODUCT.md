# PRD Segment 3: Checkout Flow & Multi-Product Cart Management

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Draft
**Priority:** P0 (Critical)
**Dependencies:** Segment 1 (Widget), Segment 2 (Backend API)
**Part of:** Draft Orders Custom Pricing Implementation

---

## Executive Summary

This document outlines the **checkout flow and multi-product cart management** using Shopify Draft Orders. It covers session tracking, multi-product addition workflow, checkout redirect behavior, and order completion handling.

**Goal:** Enable customers to add multiple products with custom pricing (2x) to a single Draft Order session, maintain proper session tracking across page navigations, and provide a seamless checkout experience.

---

## 1. Problem Statement

### Current Challenges
- Standard Shopify cart doesn't support custom pricing on non-Plus plans
- Multiple products need to be tracked in a single Draft Order session
- SessionStorage must persist across product page navigations
- Checkout URL must be updated when products are added
- Session must be cleared after successful checkout

### Desired State
- Customer can add Product A → navigate to Product B → add Product B → both in same Draft Order
- SessionStorage tracks active Draft Order ID
- Checkout URL remains valid and includes all products
- After checkout completion, session is cleared automatically
- Clear visual feedback of cart status (number of items)

---

## 2. User Journey

### 2.1 Single Product Purchase
```
1. Customer → Product A page
2. Click "Add to Cart (2x Price)"
3. API creates Draft Order with Product A (2x price)
4. Redirect to checkout URL
5. Complete payment
6. Order confirmed ✅
```

### 2.2 Multi-Product Purchase (Primary Use Case)
```
1. Customer → Product A page
2. Click "Add to Cart (2x Price)"
3. API creates Draft Order with Product A
   └─ Draft Order ID saved to sessionStorage
4. Widget shows: "1 item in cart. Continue shopping or checkout?"
5. Customer clicks "Continue shopping"
6. Customer → Product B page
7. Click "Add to Cart (2x Price)"
8. API adds Product B to existing Draft Order
   └─ Draft Order ID read from sessionStorage
9. Widget shows: "2 items in cart. Ready to checkout?"
10. Click "Checkout" button
11. Redirect to updated checkout URL
12. Complete payment
13. Order confirmed ✅
14. SessionStorage cleared
```

---

## 3. Session Management Architecture

### 3.1 SessionStorage Structure

**Key:** `priceflow_draft_order_session`

**Value (JSON):**
```json
{
  "draftOrderId": "gid://shopify/DraftOrder/789012",
  "shopDomain": "test-dekormunka.myshopify.com",
  "invoiceUrl": "https://test-dekormunka.myshopify.com/123456/invoices/abc123",
  "itemsCount": 2,
  "totalPrice": "79.96",
  "currency": "USD",
  "createdAt": "2026-01-07T10:30:00Z",
  "expiresAt": "2026-01-08T10:30:00Z"
}
```

### 3.2 Session Lifecycle

```
┌─────────────────────────────────────┐
│ Session Start                       │
│ (First "Add to Cart" click)         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Session Active                      │
│ - Draft Order exists                │
│ - SessionStorage populated          │
│ - Widget shows cart status          │
└──────────────┬──────────────────────┘
               │
               ↓
       ┌───────┴────────┐
       │                │
       ↓                ↓
┌──────────────┐  ┌──────────────┐
│ Continue     │  │ Checkout     │
│ Shopping     │  │ (redirect)   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 ↓
       │          ┌──────────────┐
       │          │ Payment      │
       │          │ Complete     │
       │          └──────┬───────┘
       │                 │
       │                 ↓
       │          ┌──────────────┐
       │          │ Session End  │
       │          │ (clear data) │
       │          └──────────────┘
       │
       └────→ (loop back to add more products)
```

### 3.3 Session Expiration

- **Expiration time:** 24 hours from creation
- **Auto-cleanup:** Backend cron job deletes expired Draft Orders
- **Frontend handling:** Widget checks `expiresAt` before using session

---

## 4. Widget Enhancements for Multi-Product Support

### 4.1 Cart Status Display Component

**Location:** `extensions/priceflow-widget/src/components/CartStatus.tsx`

```tsx
import React from 'react';
import { BlockStack, InlineLayout, Text, Button, Badge } from '@shopify/ui-extensions-react/checkout';
import { useSession } from '../hooks/useSession';

export function CartStatus() {
  const { session, hasActiveSession } = useSession();

  if (!hasActiveSession) {
    return null;
  }

  return (
    <BlockStack
      spacing="base"
      border="base"
      cornerRadius="base"
      padding="base"
      background="success"
    >
      <InlineLayout columns={['fill', 'auto']}>
        <Text emphasis="bold">
          🛒 {session.itemsCount} item{session.itemsCount > 1 ? 's' : ''} in cart
        </Text>
        <Badge tone="success">{session.currency} {session.totalPrice}</Badge>
      </InlineLayout>

      <Text size="small">
        Continue shopping or proceed to checkout below.
      </Text>

      <Button kind="primary" onPress={() => window.location.href = session.invoiceUrl}>
        Proceed to Checkout
      </Button>
    </BlockStack>
  );
}
```

### 4.2 Updated Add to Cart Button Logic

**`components/AddToCartButton.tsx` enhancement:**

```tsx
async function handleAddToCart() {
  const { session, saveSession } = useSession();

  try {
    let result;

    // Check if there's an active session
    if (session && session.draftOrderId) {
      // Add to existing Draft Order
      result = await createOrUpdateDraftOrder({
        draftOrderId: session.draftOrderId,
        variantId: selectedVariant.id,
        quantity: quantity,
        originalPrice: originalPrice,
        customPrice: customPrice,
        productTitle: product.title,
        variantTitle: selectedVariant.title,
      });

      // Update session with new item count and total
      saveSession({
        ...session,
        itemsCount: result.lineItems.length,
        totalPrice: result.total,
        invoiceUrl: result.invoiceUrl,
      });

      // Show success message but stay on page
      showSuccessToast(`Product added! ${result.lineItems.length} items in cart.`);

    } else {
      // Create new Draft Order
      result = await createOrUpdateDraftOrder({
        variantId: selectedVariant.id,
        quantity: quantity,
        originalPrice: originalPrice,
        customPrice: customPrice,
        productTitle: product.title,
        variantTitle: selectedVariant.title,
      });

      // Save new session
      saveSession({
        draftOrderId: result.draftOrderId,
        shopDomain: window.Shopify.shop,
        invoiceUrl: result.invoiceUrl,
        itemsCount: 1,
        totalPrice: result.total,
        currency: result.currency,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Show "Continue shopping or checkout?" prompt
      setShowCheckoutPrompt(true);
    }
  } catch (err) {
    console.error('Failed to add to cart:', err);
    setError(err.message);
  }
}
```

### 4.3 Continue Shopping vs Checkout Prompt

```tsx
{showCheckoutPrompt && (
  <BlockStack spacing="base">
    <Text emphasis="bold">Product added to cart!</Text>

    <InlineLayout columns={['fill', 'fill']} spacing="base">
      <Button
        kind="secondary"
        onPress={() => setShowCheckoutPrompt(false)}
      >
        Continue Shopping
      </Button>

      <Button
        kind="primary"
        onPress={() => window.location.href = session.invoiceUrl}
      >
        Checkout Now
      </Button>
    </InlineLayout>
  </BlockStack>
)}
```

---

## 5. Session Hook Implementation

### `hooks/useSession.ts`

```typescript
import { useState, useEffect } from 'react';

interface DraftOrderSession {
  draftOrderId: string;
  shopDomain: string;
  invoiceUrl: string;
  itemsCount: number;
  totalPrice: string;
  currency: string;
  createdAt: string;
  expiresAt: string;
}

const SESSION_KEY = 'priceflow_draft_order_session';

export function useSession() {
  const [session, setSession] = useState<DraftOrderSession | null>(null);

  // Load session from sessionStorage on mount
  useEffect(() => {
    loadSession();
  }, []);

  function loadSession(): DraftOrderSession | null {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Check expiration
      if (new Date(parsed.expiresAt) < new Date()) {
        console.warn('[useSession] Session expired, clearing...');
        clearSession();
        return null;
      }

      setSession(parsed);
      return parsed;
    } catch (error) {
      console.error('[useSession] Failed to load session:', error);
      return null;
    }
  }

  function saveSession(data: DraftOrderSession) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      setSession(data);
      console.log('[useSession] Session saved:', data.draftOrderId);
    } catch (error) {
      console.error('[useSession] Failed to save session:', error);
    }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    console.log('[useSession] Session cleared');
  }

  function hasActiveSession(): boolean {
    if (!session) return false;
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return false;
    }
    return true;
  }

  return {
    session,
    saveSession,
    clearSession,
    loadSession,
    hasActiveSession: hasActiveSession(),
  };
}
```

---

## 6. Checkout Redirect Behavior

### 6.1 Invoice URL Structure

Shopify Draft Order invoice URL format:
```
https://{shop-domain}.myshopify.com/{order-id}/invoices/{invoice-token}
```

Example:
```
https://test-dekormunka.myshopify.com/123456/invoices/abc123def456
```

### 6.2 Redirect Timing

**Option A: Immediate Redirect (First Product Only)**
- User clicks "Add to Cart" → Immediately redirect to checkout
- Use case: Single product purchase
- Implementation: `window.location.href = invoiceUrl`

**Option B: Deferred Redirect (Multi-Product Support)**
- User clicks "Add to Cart" → Show "Continue Shopping or Checkout?" prompt
- User clicks "Checkout Now" → Redirect
- Use case: Multi-product purchase
- Implementation: `<Button onPress={() => window.location.href = invoiceUrl}>`

### 6.3 Recommended Flow

**Default behavior:** Deferred redirect (multi-product support)

**Merchant setting:** Toggle "Auto-redirect to checkout" (default: OFF)

---

## 7. Order Completion & Session Cleanup

### 7.1 Post-Checkout Hook (Backend)

**Challenge:** Shopify doesn't fire webhook when Draft Order invoice is paid.

**Solution:** Polling or Webhook workaround

#### Option A: Webhook `orders/create`

```typescript
// apps/api/src/domains/webhook/controllers/webhook.controller.ts
@Post('orders/create')
async handleOrderCreated(@Body() webhookData: any) {
  const orderId = webhookData.id;
  const tags = webhookData.tags; // "priceflow, custom-pricing"

  if (tags.includes('priceflow')) {
    console.log('[Webhook] PriceFlow order completed:', orderId);

    // Find and delete Draft Order session from database
    await this.draftOrderService.markAsCompleted(orderId);
  }
}
```

#### Option B: Frontend Polling (Less reliable)

```typescript
// After redirect to checkout, periodically check if order completed
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/draft-orders/${session.draftOrderId}/status`);
    const { status } = await response.json();

    if (status === 'COMPLETED') {
      clearSession();
      clearInterval(interval);
    }
  }, 5000); // Check every 5 seconds

  return () => clearInterval(interval);
}, []);
```

**Recommended:** Option A (Webhook `orders/create`)

---

## 8. Edge Cases & Error Handling

### 8.1 Session Expired

**Scenario:** User adds product, waits 25 hours, returns to site, clicks "Add to Cart" again.

**Handling:**
```typescript
if (session && new Date(session.expiresAt) < new Date()) {
  clearSession();
  // Create new Draft Order
}
```

### 8.2 Draft Order Deleted Manually

**Scenario:** Merchant deletes Draft Order from Shopify Admin.

**Handling:**
```typescript
try {
  await addItemToDraftOrder(session.draftOrderId, item);
} catch (error) {
  if (error.status === 404) {
    // Draft Order not found, clear session and create new one
    clearSession();
    await createNewDraftOrder(item);
  }
}
```

### 8.3 Network Failure During Add to Cart

**Handling:**
- Show error message: "Connection error. Please try again."
- Do NOT clear session
- Provide "Retry" button

### 8.4 Concurrent Requests (Race Condition)

**Scenario:** User rapidly clicks "Add to Cart" on multiple products.

**Solution:** Debounce button clicks + loading state

```typescript
const [isAdding, setIsAdding] = useState(false);

async function handleAddToCart() {
  if (isAdding) return; // Prevent concurrent requests

  setIsAdding(true);
  try {
    await addToCart();
  } finally {
    setIsAdding(false);
  }
}
```

---

## 9. Visual Feedback & UX

### 9.1 Success States

**After first product added:**
```
✅ Product added to cart!
┌─────────────────────────────────────┐
│ 1 item in cart ($39.98)             │
│                                     │
│ [Continue Shopping] [Checkout Now]  │
└─────────────────────────────────────┘
```

**After second product added:**
```
✅ Product added! 2 items in cart.
┌─────────────────────────────────────┐
│ 🛒 2 items in cart ($99.96)         │
│                                     │
│ Continue shopping or checkout below.│
│ [Proceed to Checkout]               │
└─────────────────────────────────────┘
```

### 9.2 Persistent Cart Badge (Optional)

**Floating cart indicator (all pages):**
```
┌──────────┐
│ 🛒 (2)   │  ← Badge shows item count
└──────────┘
```

Click → Redirect to checkout URL

---

## 10. Backend Session Tracking (Optional Enhancement)

### 10.1 Database Schema Addition

**Purpose:** Track sessions server-side for analytics and recovery

```prisma
model DraftOrderSession {
  // ... existing fields from PRD 02 ...

  sessionId       String       @unique // Browser sessionStorage ID
  ipAddress       String?
  userAgent       String?
  lastActivityAt  DateTime     @default(now())
}
```

### 10.2 Session Sync Endpoint

**POST /api/draft-orders/session/sync**

```typescript
async syncSession(sessionData: {
  draftOrderId: string;
  sessionId: string; // Generated client-side (UUID)
}) {
  // Update database with latest activity
  await this.draftOrderRepository.updateLastActivity(
    sessionData.draftOrderId,
    sessionData.sessionId
  );
}
```

**Use case:** Analytics, abandoned cart recovery

---

## 11. Monitoring & Analytics

### 11.1 Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| **Multi-product rate** | % of sessions with 2+ products | > 30% |
| **Session abandonment** | % of sessions not converted to order | < 20% |
| **Average items per session** | Mean products per Draft Order | > 1.5 |
| **Session expiration rate** | % of sessions that expire (24h) | < 5% |
| **Checkout completion rate** | % of redirects that complete payment | > 70% |

### 11.2 Event Tracking

**Frontend events:**
- `draft_order_created`
- `item_added_to_session`
- `continue_shopping_clicked`
- `checkout_redirected`
- `session_expired`

**Backend events:**
- `draft_order_api_success`
- `draft_order_api_failure`
- `order_completed_webhook`

---

## 12. Testing Scenarios

### 12.1 Manual Test Cases

**Test Case 1: Single Product Purchase**
- [ ] Add Product A → Redirects to checkout
- [ ] Complete payment → Order created
- [ ] SessionStorage cleared after order

**Test Case 2: Multi-Product Purchase**
- [ ] Add Product A → Session created
- [ ] Navigate to Product B → Session persists
- [ ] Add Product B → Session updated (2 items)
- [ ] Click "Checkout" → Redirects with both products
- [ ] Complete payment → Order with both products

**Test Case 3: Session Expiration**
- [ ] Add Product A → Session created
- [ ] Wait 24+ hours (or mock expiration)
- [ ] Add Product B → Old session cleared, new session created

**Test Case 4: Network Failure Recovery**
- [ ] Add Product A → Simulate network error
- [ ] Error message displayed
- [ ] Click "Retry" → Success

**Test Case 5: Concurrent Clicks**
- [ ] Rapidly click "Add to Cart" 5 times
- [ ] Only 1 request sent (debounced)
- [ ] Loading state prevents duplicate clicks

---

## 13. Performance Optimization

### 13.1 SessionStorage Performance

- Read/write to sessionStorage is synchronous and fast (< 1ms)
- JSON serialization overhead minimal for small session objects

### 13.2 API Call Optimization

- Batch operations: Add multiple items in single API call (future enhancement)
- Prefetch Draft Order status on page load (if session exists)

---

## 14. Security Considerations

### 14.1 SessionStorage Security

- SessionStorage is domain-scoped (safe from XSS on other domains)
- Data cleared on browser close (tab-specific)
- No sensitive data stored (no customer PII, no payment info)

### 14.2 Draft Order ID Exposure

- Draft Order ID (GID) is not sensitive
- Invoice URL contains token, but it's publicly shareable by design
- Backend validates shop domain for all API calls

---

## 15. Future Enhancements

1. **Mini Cart Drawer** - Slide-out cart showing all items
2. **Edit Quantity** - Modify item quantities before checkout
3. **Remove Item** - Delete item from Draft Order
4. **Save for Later** - Email draft order link to customer
5. **Abandoned Cart Recovery** - Email reminder after 24h expiration

---

## Document Metadata

- **Version:** 1.0
- **Last Updated:** 2026-01-07
- **Author:** PriceFlow Engineering Team
- **Status:** Draft for Implementation

---

## Related Documents

- **[PRD 01: Widget/Extension Modification](./01-WIDGET-EXTENSION-MODIFICATION.md)**
- **[PRD 02: Backend Draft Orders API](./02-BACKEND-DRAFT-ORDERS-API.md)**
- **[PRD 04: Testing & Deployment](./04-TESTING-DEPLOYMENT.md)**
