# PRD: Storefront Add to Cart with LocalStorage (Iteration 01)

**Version:** 1.0
**Date:** 2026-01-11
**Status:** Draft
**Project:** PriceFlow - Custom Pricing Cart with LocalStorage
**Iteration:** 01 (Foundation)

---

## Executive Summary

This PRD defines the **first iteration** of the custom Add to Cart functionality for the **Storefront app** (`apps/storefront/`). Instead of using Shopify's native cart, this implementation stores custom-priced products in **browser LocalStorage**, enabling:

1. ✅ **Custom pricing** (e.g., calculated prices from templates)
2. ✅ **Multi-product cart** management in LocalStorage
3. ✅ **Persistent cart** across page navigation (same browser session)
4. ✅ **Foundation** for future checkout integration (Iteration 02)

**Scope of Iteration 01:**
- LocalStorage-based cart storage
- Add to Cart button component
- Cart item management (add, view, remove)
- **NO checkout integration** (planned for Iteration 02)

---

## 1. Problem Statement

### Current State

The PriceFlow app can calculate custom prices via templates, but there's no way for customers to:
- Add products with custom prices to cart
- Manage multiple products with custom pricing
- View their cart with custom prices before checkout

### The Challenge

Shopify's native cart cannot handle custom prices without Shopify Plus (Cart Transform Functions). We need an intermediate solution that:
1. Stores custom-priced products locally
2. Allows multi-product cart management
3. Preserves custom pricing through navigation
4. Provides foundation for checkout flow (future iteration)

### Solution: LocalStorage Cart

Use browser LocalStorage to store cart items with custom pricing, enabling:
- **Immediate add-to-cart** without backend calls
- **Client-side cart management** (fast, no network latency)
- **Price preservation** across page navigation
- **Simple implementation** (no complex state management)

---

## 2. Technical Architecture

### 2.1 Data Structure

**LocalStorage Key:** `custom-cart-items`

**Data Format:**
```typescript
interface CartItem {
  id: string;                    // Format: "{variantId}:{timestamp}"
  variant_id: string;            // Shopify variant ID (e.g., "gid://shopify/ProductVariant/123")
  product_title: string;         // Product name
  image: string;                 // Product image URL
  final_price: number;           // Custom calculated price (single unit)
  final_line_price: number;      // Total price (final_price * quantity)
  quantity: number;              // Number of units (default: 1)
  properties: Record<string, any>; // Custom properties (template selections)
}

// Example:
{
  id: "gid://shopify/ProductVariant/123:1736607600000",
  variant_id: "gid://shopify/ProductVariant/123",
  product_title: "Custom Banner - 100x50cm",
  image: "https://cdn.shopify.com/...",
  final_price: 49.99,
  final_line_price: 49.99,
  quantity: 1,
  properties: {
    width_cm: 100,
    height_cm: 50,
    material: "vinyl",
    template_id: "uuid-template-123"
  }
}
```

### 2.2 Component Structure

```
apps/storefront/
├── app/
│   └── products/
│       └── [handle]/
│           └── page.tsx              # Product page
├── components/
│   ├── cart/
│   │   ├── AddToCartButton.tsx       # Main Add to Cart button
│   │   ├── CartDrawer.tsx            # Mini cart sidebar (future)
│   │   ├── CartItemsList.tsx         # Display cart items
│   │   └── CartSummary.tsx           # Cart totals
│   └── ui/
│       └── Button.tsx                # Reusable button component
├── hooks/
│   ├── useCart.ts                    # Cart state management
│   └── useLocalStorage.ts            # LocalStorage utilities
├── lib/
│   └── cart/
│       ├── cartStorage.ts            # LocalStorage operations
│       └── cartUtils.ts              # Cart calculations
└── types/
    └── cart.ts                       # TypeScript interfaces
```

---

## 3. Functional Requirements

### 3.1 Add to Cart Functionality

**User Story:**
As a customer, I want to add a product with custom pricing to my cart, so that I can purchase it later.

**Acceptance Criteria:**
- ✅ "Add to Cart" button visible on product page
- ✅ Button shows loading state during add operation
- ✅ Product with custom price stored in LocalStorage
- ✅ Success message shown after adding
- ✅ Cart counter updates (if displayed)
- ✅ Duplicate prevention: Same variant with same properties updates quantity instead of creating new entry

**Technical Implementation:**

```typescript
// components/cart/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

interface AddToCartButtonProps {
  variantId: string;
  productTitle: string;
  productImage: string;
  finalPrice: number;
  quantity?: number;
  properties?: Record<string, any>;
}

export function AddToCartButton({
  variantId,
  productTitle,
  productImage,
  finalPrice,
  quantity = 1,
  properties = {},
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem, showToast } = useCart();

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      // Build cart item
      const cartItem = {
        id: `${variantId}:${Date.now()}`,
        variant_id: variantId,
        product_title: productTitle,
        image: productImage,
        final_price: finalPrice,
        final_line_price: finalPrice * quantity,
        quantity,
        properties,
      };

      // Add to LocalStorage
      addItem(cartItem);

      // Show success message
      showToast('Product added to cart!', 'success');
    } catch (error) {
      showToast('Failed to add product to cart', 'error');
      console.error('Add to cart error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

### 3.2 Cart Management Hook

**User Story:**
As a developer, I need a reusable hook to manage cart operations, so that cart logic is centralized.

**Technical Implementation:**

```typescript
// hooks/useCart.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types/cart';

const CART_STORAGE_KEY = 'custom-cart-items';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Failed to parse cart data:', error);
        setItems([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to LocalStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Add item to cart
  const addItem = useCallback((newItem: CartItem) => {
    setItems((prevItems) => {
      // Check if item with same variant and properties exists
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.variant_id === newItem.variant_id &&
          JSON.stringify(item.properties) === JSON.stringify(newItem.properties)
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updated = [...prevItems];
        updated[existingIndex].quantity += newItem.quantity;
        updated[existingIndex].final_line_price =
          updated[existingIndex].final_price * updated[existingIndex].quantity;
        return updated;
      }

      // Add new item
      return [...prevItems, newItem];
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              final_line_price: item.final_price * quantity,
            }
          : item
      )
    );
  }, [removeItem]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Calculate cart totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.final_line_price, 0);

  return {
    items,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
```

### 3.3 Cart Display (Cart Drawer/Page)

**User Story:**
As a customer, I want to view my cart with all custom-priced products, so that I can review before checkout.

**Acceptance Criteria:**
- ✅ Cart page displays all items from LocalStorage
- ✅ Each item shows: image, title, custom properties, price, quantity
- ✅ User can update quantity (+ / -)
- ✅ User can remove items
- ✅ Cart totals calculated correctly
- ✅ "Clear Cart" button available
- ✅ Empty state displayed when cart is empty

**Technical Implementation:**

```typescript
// components/cart/CartItemsList.tsx
'use client';

import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/types/cart';

export function CartItemsList() {
  const { items, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 border-b pb-4">
          {/* Product Image */}
          <div className="w-24 h-24 relative flex-shrink-0">
            <Image
              src={item.image}
              alt={item.product_title}
              fill
              className="object-cover rounded"
            />
          </div>

          {/* Product Details */}
          <div className="flex-grow">
            <h3 className="font-semibold">{item.product_title}</h3>

            {/* Custom Properties */}
            {Object.keys(item.properties).length > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                {Object.entries(item.properties).map(([key, value]) => (
                  <div key={key}>
                    {key}: {String(value)}
                  </div>
                ))}
              </div>
            )}

            {/* Price */}
            <p className="text-lg font-bold mt-2">
              ${item.final_price.toFixed(2)}
            </p>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="px-2 py-1 border rounded"
              >
                -
              </button>
              <span className="px-4">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="px-2 py-1 border rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Line Total & Remove */}
          <div className="text-right">
            <p className="font-bold text-lg">
              ${item.final_line_price.toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-600 text-sm mt-2 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3.4 Cart Summary Component

**Technical Implementation:**

```typescript
// components/cart/CartSummary.tsx
'use client';

import { useCart } from '@/hooks/useCart';

export function CartSummary() {
  const { totalItems, totalPrice, clearCart } = useCart();

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cart Summary</h2>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Total Items:</span>
          <span className="font-semibold">{totalItems}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total Price:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          disabled // Enabled in Iteration 02
        >
          Proceed to Checkout (Coming Soon)
        </button>

        <button
          onClick={clearCart}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Add to Cart response time | < 50ms | LocalStorage write time |
| Cart page load time | < 200ms | Time to display all items |
| LocalStorage size limit | < 5MB | Browser limit awareness |

### 4.2 Browser Compatibility

| Browser | Min Version | Support Level |
|---------|-------------|---------------|
| Chrome | 80+ | ✅ Full support |
| Firefox | 75+ | ✅ Full support |
| Safari | 13+ | ✅ Full support |
| Edge | 80+ | ✅ Full support |

### 4.3 Accessibility (WCAG 2.1 Level AA)

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels on buttons
- ✅ Screen reader support
- ✅ Focus indicators visible
- ✅ Color contrast ratio > 4.5:1

### 4.4 Security Considerations

| Risk | Mitigation |
|------|-----------|
| XSS via properties | Sanitize all user input before displaying |
| LocalStorage size DoS | Implement max items limit (50) |
| Price tampering | Backend validation in checkout (Iteration 02) |

---

## 5. User Experience Flow

### 5.1 Happy Path: Add Single Product

```
1. Customer lands on Product Page
   ↓
2. Views custom pricing calculator (if template assigned)
   ↓
3. Fills in custom fields (width, height, etc.)
   ↓
4. Price calculated and displayed
   ↓
5. Clicks "Add to Cart" button
   ↓
6. Loading state shows ("Adding...")
   ↓
7. Item added to LocalStorage
   ↓
8. Success toast notification appears
   ↓
9. Cart counter updates (e.g., "1 item")
   ↓
10. Customer can continue shopping or go to cart
```

### 5.2 Edge Case: Duplicate Item

```
1. Customer adds "Banner 100x50cm" to cart
   ↓
2. Navigates away, then back to product page
   ↓
3. Adds same "Banner 100x50cm" again (same properties)
   ↓
4. System detects duplicate (variant_id + properties match)
   ↓
5. Instead of creating new entry, quantity increments (1 → 2)
   ↓
6. final_line_price recalculated (price * 2)
   ↓
7. Toast shows "Quantity updated in cart"
```

### 5.3 Edge Case: LocalStorage Full

```
1. Customer tries to add 51st item (over limit)
   ↓
2. System checks cart size
   ↓
3. Error toast shows: "Cart is full. Please remove items."
   ↓
4. Item not added to cart
   ↓
5. Customer can remove items to make space
```

---

## 6. Data Persistence Strategy

### 6.1 LocalStorage Lifecycle

| Event | Behavior |
|-------|----------|
| **Page Load** | Cart data loaded from LocalStorage |
| **Page Navigation** | Cart persists (same origin) |
| **Browser Close** | Cart persists (permanent) |
| **Browser Clear Data** | Cart deleted (expected) |
| **Incognito Mode** | Cart works but cleared on window close |

### 6.2 Cart Expiration (Optional - Future)

Not implemented in Iteration 01, but planned:
- Add `createdAt` timestamp to each item
- Auto-remove items older than 7 days
- Show warning for items expiring soon

### 6.3 Multi-Device Sync

**Not supported in Iteration 01.** LocalStorage is device-specific.

**Future consideration (Iteration 03+):**
- Backend session storage
- User account sync
- Cross-device cart

---

## 7. Testing Strategy

### 7.1 Unit Tests

**File:** `hooks/useCart.test.ts`

```typescript
describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adds item to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        id: 'variant-1:123',
        variant_id: 'variant-1',
        product_title: 'Test Product',
        image: 'https://example.com/image.jpg',
        final_price: 10,
        final_line_price: 10,
        quantity: 1,
        properties: {},
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalPrice).toBe(10);
  });

  test('increments quantity for duplicate items', () => {
    const { result } = renderHook(() => useCart());

    const item = {
      id: 'variant-1:123',
      variant_id: 'variant-1',
      product_title: 'Test Product',
      image: 'https://example.com/image.jpg',
      final_price: 10,
      final_line_price: 10,
      quantity: 1,
      properties: { color: 'red' },
    };

    act(() => {
      result.current.addItem(item);
      result.current.addItem(item);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalPrice).toBe(20);
  });

  test('removes item from cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ /* item data */ });
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });
});
```

### 7.2 Integration Tests

**File:** `components/cart/AddToCartButton.test.tsx`

```typescript
describe('AddToCartButton', () => {
  test('adds item when clicked', async () => {
    render(
      <AddToCartButton
        variantId="variant-1"
        productTitle="Test Product"
        productImage="https://example.com/image.jpg"
        finalPrice={10}
      />
    );

    const button = screen.getByText('Add to Cart');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');
      expect(cart).toHaveLength(1);
    });
  });
});
```

### 7.3 Manual Testing Checklist

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| **Add to Cart** | Click "Add to Cart" button | ✅ Item in LocalStorage, toast shown |
| **View Cart** | Navigate to `/cart` | ✅ All items displayed correctly |
| **Update Quantity** | Click + / - buttons | ✅ Quantity and price update |
| **Remove Item** | Click "Remove" | ✅ Item deleted, totals recalculated |
| **Clear Cart** | Click "Clear Cart" | ✅ All items removed |
| **Page Refresh** | Refresh browser | ✅ Cart persists |
| **Browser Close/Reopen** | Close and reopen browser | ✅ Cart still exists |
| **Duplicate Item** | Add same product twice | ✅ Quantity increments, no duplicate entry |

---

## 8. Implementation Plan

### 8.1 Phase 1: Core Cart Hook (Day 1)

**Goal:** Build foundation cart logic

**Tasks:**
- [ ] Create `types/cart.ts` with TypeScript interfaces
- [ ] Implement `hooks/useCart.ts` with add/remove/update
- [ ] Implement `hooks/useLocalStorage.ts` utility
- [ ] Write unit tests for useCart

**Deliverable:** Working cart hook with tests

### 8.2 Phase 2: Add to Cart Button (Day 2)

**Goal:** Enable adding products to cart

**Tasks:**
- [ ] Create `components/cart/AddToCartButton.tsx`
- [ ] Integrate with useCart hook
- [ ] Add loading and error states
- [ ] Add toast notifications
- [ ] Write component tests

**Deliverable:** Functional Add to Cart button

### 8.3 Phase 3: Cart Display (Day 3-4)

**Goal:** Display and manage cart items

**Tasks:**
- [ ] Create cart page route (`app/cart/page.tsx`)
- [ ] Implement `CartItemsList.tsx` component
- [ ] Implement `CartSummary.tsx` component
- [ ] Add quantity update UI
- [ ] Add remove item functionality
- [ ] Style with Tailwind CSS

**Deliverable:** Complete cart page

### 8.4 Phase 4: Polish & Testing (Day 5)

**Goal:** Refinement and QA

**Tasks:**
- [ ] Manual testing (all test cases)
- [ ] Fix bugs
- [ ] Accessibility audit
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Documentation

**Deliverable:** Production-ready feature

### 8.5 Estimated Timeline

```
Day 1: Core cart hook + tests
Day 2: Add to Cart button
Day 3-4: Cart page UI
Day 5: Testing & polish

Total: 5 days (1 week)
```

---

## 9. API Specification (Future Iterations)

**Note:** Iteration 01 does NOT include backend API calls. This section defines the API contracts for future checkout integration (Iteration 02).

### 9.1 Future Endpoint: Create Draft Order

**Endpoint:** `POST /api/draft-orders/create-from-localstorage`

**Request Body:**
```json
{
  "items": [
    {
      "variant_id": "gid://shopify/ProductVariant/123",
      "quantity": 2,
      "price": 49.99,
      "properties": { "width_cm": 100, "height_cm": 50 }
    }
  ],
  "customer_email": "customer@example.com"
}
```

**Response:**
```json
{
  "draft_order_id": "gid://shopify/DraftOrder/456",
  "invoice_url": "https://example.myshopify.com/checkouts/...",
  "total_price": 99.98
}
```

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **LocalStorage quota exceeded** | LOW | MEDIUM | Implement 50-item limit, show warning |
| **Browser clears LocalStorage** | LOW | LOW | Expected behavior, document for users |
| **Price tampering** | MEDIUM | HIGH | Backend validation in checkout (Iteration 02) |
| **JSON parse errors** | LOW | MEDIUM | Try-catch with fallback to empty cart |

### 10.2 UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Customer confusion (no checkout)** | HIGH | MEDIUM | Clear "Coming Soon" message on button |
| **Cart loss (device switch)** | HIGH | LOW | Document single-device limitation |
| **No cart sync across tabs** | MEDIUM | LOW | Use storage event listener (future) |

---

## 11. Success Metrics

### 11.1 Technical Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Add to Cart success rate** | > 99.5% | Error tracking (Sentry) |
| **LocalStorage errors** | < 0.1% | Error logs |
| **Page load performance** | < 200ms | Lighthouse CI |
| **Unit test coverage** | > 80% | Jest coverage report |

### 11.2 User Engagement Metrics

**Note:** These will be measurable after Iteration 02 (checkout integration)

| Metric | Target | Notes |
|--------|--------|-------|
| **Cart creation rate** | Baseline | First iteration, no target |
| **Items per cart** | 1-3 items | Expected range |
| **Cart abandonment** | N/A | No checkout yet |

---

## 12. Dependencies

### 12.1 Internal Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| **Storefront app scaffold** | ✅ Exists | Next.js 16 already set up |
| **Tailwind CSS** | ✅ Configured | Styling framework ready |
| **TypeScript** | ✅ Configured | Type safety enabled |

### 12.2 External Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| **next** | 16.0.10 | Framework |
| **react** | 19.2.1 | UI library |
| **tailwindcss** | 4.1.18 | Styling |

**No new dependencies required for Iteration 01.**

---

## 13. Future Iterations

### Iteration 02: Checkout Integration

**Scope:**
- Create Draft Order from LocalStorage cart
- Redirect to Shopify checkout
- Backend API integration
- Order completion tracking

**PRD:** `02-STOREFRONT-CHECKOUT-INTEGRATION.md` (to be created)

### Iteration 03: Cart Sync & Persistence

**Scope:**
- Backend session storage
- Multi-device cart sync
- User account integration
- Cart recovery emails

### Iteration 04: Advanced Features

**Scope:**
- Mini cart drawer (slide-out)
- Cart page animations
- Recommended products
- Discount code support

---

## 14. Documentation

### 14.1 Developer Documentation

**File:** `apps/storefront/docs/CART_USAGE.md` (to be created)

**Contents:**
- How to use `useCart` hook
- Component API reference
- LocalStorage data structure
- Testing guidelines

### 14.2 User Documentation

**Not applicable for Iteration 01** (internal feature, no merchant config)

---

## 15. Rollout Plan

### 15.1 Development Environment

**Steps:**
1. Create feature branch: `feature/storefront-cart-localstorage`
2. Implement components and hooks
3. Write unit tests
4. Manual testing in local dev
5. Code review
6. Merge to `main`

### 15.2 Staging Environment

**Steps:**
1. Deploy to staging Docker container
2. Run integration tests
3. Manual QA (test checklist)
4. Performance testing
5. Accessibility audit

### 15.3 Production Deployment

**Steps:**
1. Deploy to production (docker-compose up)
2. Monitor error logs (first 24h)
3. Check LocalStorage operations
4. Gather user feedback

**Rollback Plan:**
- If critical bug: revert commit, redeploy
- If minor issue: hotfix PR

---

## 16. Open Questions

| Question | Status | Answer/Decision |
|----------|--------|-----------------|
| Should cart items expire after X days? | ⏳ PENDING | Decision: Not in Iteration 01 |
| Max items in cart? | ✅ DECIDED | 50 items max |
| Show cart counter in header? | ⏳ PENDING | UX to decide |
| Should quantities be editable on product page? | ⏳ PENDING | Default to 1, editable in cart |

---

## 17. Appendix

### 17.1 Related Documents

- `CONTEXT_ENGINEERING.md` - Full project context
- `PROJECT_STATUS.md` - Current system status
- `docs/prd/00-INDEX.md` - Draft Orders PRD (future integration)

### 17.2 Code Reference

**Key Method:** Add Item to LocalStorage

```typescript
const addItem = (newItem: CartItem) => {
  const cartItems = JSON.parse(localStorage.getItem('custom-cart-items') || '[]');

  cartItems.push({
    id: `${newItem.variant_id}:${Date.now()}`,
    final_price: newItem.final_price,
    final_line_price: newItem.final_price * newItem.quantity,
    properties: newItem.properties,
    product_title: newItem.product_title,
    image: newItem.image,
    variant_id: newItem.variant_id,
    quantity: newItem.quantity,
  });

  localStorage.setItem('custom-cart-items', JSON.stringify(cartItems));
};
```

---

## Document Metadata

- **Version:** 1.0
- **Last Updated:** 2026-01-11
- **Author:** PriceFlow Engineering Team
- **Status:** Draft for Review
- **Iteration:** 01 (Foundation)
- **Next Review:** After implementation approval

---

## Approval & Sign-off

### Design Review

| Aspect | Reviewer | Status | Date |
|--------|----------|--------|------|
| **Frontend Architecture** | Frontend Lead | ⏳ Pending | |
| **UX Flow** | UX Designer | ⏳ Pending | |
| **TypeScript Interfaces** | Tech Lead | ⏳ Pending | |

### Implementation Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Product Manager** | | | |
| **Tech Lead** | | | |
| **Frontend Engineer** | | | |

---

**End of PRD: Storefront Add to Cart with LocalStorage (Iteration 01)**

**Next Step:** Review and approve, then begin implementation (estimated 5 days).
