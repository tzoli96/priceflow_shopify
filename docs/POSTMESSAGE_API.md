# PostMessage API Documentation

**Date:** 2026-01-11
**Purpose:** Cross-domain communication between Shopify theme and PriceFlow iframe
**Status:** Implementation Ready

---

## Overview

Mivel a PriceFlow app (`app.teszt.uk`) iframe-ben van beágyazva a Shopify témába (`store.myshopify.com`), az iframe nem fér hozzá közvetlenül a parent window LocalStorage-ához. PostMessage API-t használunk a cross-domain kommunikációhoz.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Shopify Theme (store.myshopify.com)       │
│                                             │
│  LocalStorage: 'custom-cart-items'         │
│  ↑                                          │
│  │ PostMessage                              │
│  │                                          │
│  ├─────────────────────────────────────┐   │
│  │  Iframe (app.teszt.uk)              │   │
│  │                                      │   │
│  │  - AddToCartButton                  │   │
│  │  - Minicart Page                    │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Message Types

### 1. ADD_TO_CART

**From:** Iframe (AddToCartButton)
**To:** Parent Window (Shopify)
**Purpose:** Add item to cart

**Message:**
```javascript
{
  type: 'ADD_TO_CART',
  item: {
    variant_id: 'gid://shopify/ProductVariant/123',
    product_title: 'Product Name',
    image: 'https://...',
    final_price: 29.99,
    quantity: 1,
    properties: {
      template: 'Birthday',
      name: 'John'
    }
  }
}
```

**Handler (Shopify):**
```javascript
if (data.type === 'ADD_TO_CART') {
  addItemToCart(data.item);
  // Generates unique ID
  // Checks for duplicates
  // Saves to LocalStorage
  // Updates cart badge
}
```

---

### 2. REQUEST_CART_DATA

**From:** Iframe (Minicart)
**To:** Parent Window (Shopify)
**Purpose:** Request current cart items

**Message:**
```javascript
{
  type: 'REQUEST_CART_DATA'
}
```

**Response (Shopify → Iframe):**
```javascript
{
  type: 'CART_DATA',
  items: [
    {
      id: 'variant123:1736611200000',
      variant_id: 'gid://shopify/ProductVariant/123',
      product_title: 'Product Name',
      image: 'https://...',
      final_price: 29.99,
      final_line_price: 59.98,
      quantity: 2,
      properties: { ... }
    }
  ]
}
```

---

### 3. CART_DATA

**From:** Parent Window (Shopify)
**To:** Iframe (Minicart)
**Purpose:** Send cart items to minicart

**Message:**
```javascript
{
  type: 'CART_DATA',
  items: [ ... ] // Array of CartItem
}
```

**Handler (Iframe):**
```javascript
if (data.type === 'CART_DATA') {
  setItems(data.items);
  setIsLoaded(true);
}
```

---

### 4. UPDATE_QUANTITY

**From:** Iframe (Minicart)
**To:** Parent Window (Shopify)
**Purpose:** Update item quantity

**Message:**
```javascript
{
  type: 'UPDATE_QUANTITY',
  itemId: 'variant123:1736611200000',
  quantity: 3
}
```

**Handler (Shopify):**
```javascript
if (data.type === 'UPDATE_QUANTITY') {
  updateItemQuantity(data.itemId, data.quantity);
  // Recalculates line price
  // Saves to LocalStorage
  // Updates cart badge
  // Sends CART_DATA back to iframe
}
```

---

### 5. REMOVE_ITEM

**From:** Iframe (Minicart)
**To:** Parent Window (Shopify)
**Purpose:** Remove item from cart

**Message:**
```javascript
{
  type: 'REMOVE_ITEM',
  itemId: 'variant123:1736611200000'
}
```

**Handler (Shopify):**
```javascript
if (data.type === 'REMOVE_ITEM') {
  removeItemFromCart(data.itemId);
  // Removes from array
  // Saves to LocalStorage
  // Updates cart badge
  // Sends CART_DATA back to iframe
}
```

---

### 6. CART_UPDATED

**From:** Iframe (Minicart)
**To:** Parent Window (Shopify)
**Purpose:** Notify parent that cart has changed

**Message:**
```javascript
{
  type: 'CART_UPDATED',
  itemCount: 3,
  subtotal: 199.99
}
```

**Handler (Shopify):**
```javascript
if (data.type === 'CART_UPDATED') {
  updatePriceflowCartBubble();
  // Updates cart badge with new count
}
```

---

### 7. CLOSE_CART

**From:** Iframe (Minicart)
**To:** Parent Window (Shopify)
**Purpose:** Close minicart drawer

**Message:**
```javascript
{
  type: 'CLOSE_CART'
}
```

**Handler (Shopify):**
```javascript
if (data.type === 'CLOSE_CART') {
  closePriceflowCart();
  // Closes drawer
  // Removes overlay
}
```

---

## Communication Flow

### Add to Cart Flow

```
1. User clicks "Add to Cart" in iframe
       ↓
2. AddToCartButton.tsx detects iframe mode
       ↓
3. postMessage({ type: 'ADD_TO_CART', item: {...} })
       ↓
4. Shopify receives message
       ↓
5. addItemToCart(item) → saves to LocalStorage
       ↓
6. Cart badge updates
       ↓
7. cartUpdated event dispatched
```

### Minicart Open Flow

```
1. User clicks cart icon
       ↓
2. openPriceflowCart() called
       ↓
3. Drawer opens with iframe
       ↓
4. Iframe loads /minicart
       ↓
5. Minicart sends: postMessage({ type: 'REQUEST_CART_DATA' })
       ↓
6. Shopify responds: postMessage({ type: 'CART_DATA', items: [...] })
       ↓
7. Minicart displays items
```

### Update Quantity Flow

```
1. User changes quantity in minicart iframe
       ↓
2. postMessage({ type: 'UPDATE_QUANTITY', itemId, quantity })
       ↓
3. Shopify updates LocalStorage
       ↓
4. Shopify sends: postMessage({ type: 'CART_DATA', items: [...] })
       ↓
5. Minicart re-renders with new data
       ↓
6. Cart badge updates
```

---

## Implementation

### Iframe Side (AddToCartButton)

```typescript
// apps/storefront/components/cart/AddToCartButton.tsx

const isEmbedded = window.self !== window.top;

if (isEmbedded && window.parent) {
  // Send to parent window
  window.parent.postMessage({
    type: 'ADD_TO_CART',
    item: cartItem
  }, '*');
} else {
  // Direct LocalStorage (standalone mode)
  addItem(cartItem);
}
```

### Iframe Side (Minicart)

```typescript
// apps/storefront/app/minicart/page.tsx

// Request data on mount
useEffect(() => {
  window.parent.postMessage({ type: 'REQUEST_CART_DATA' }, '*');

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'CART_DATA') {
      setItems(event.data.items);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

// Update quantity
const updateQuantity = (itemId: string, quantity: number) => {
  window.parent.postMessage({
    type: 'UPDATE_QUANTITY',
    itemId,
    quantity
  }, '*');
};
```

### Parent Side (Shopify Liquid)

```javascript
// sections/priceflow-minicart.liquid

window.addEventListener('message', function(event) {
  const data = event.data;

  if (data.type === 'ADD_TO_CART') {
    addItemToCart(data.item);
  }

  if (data.type === 'REQUEST_CART_DATA') {
    const iframe = document.getElementById('priceflow-minicart-iframe');
    iframe.contentWindow.postMessage({
      type: 'CART_DATA',
      items: getCartItems()
    }, '*');
  }

  if (data.type === 'UPDATE_QUANTITY') {
    updateItemQuantity(data.itemId, data.quantity);
  }

  if (data.type === 'REMOVE_ITEM') {
    removeItemFromCart(data.itemId);
  }

  if (data.type === 'CLOSE_CART') {
    closePriceflowCart();
  }
});
```

---

## Security Considerations

### Origin Validation

**Production:** ALWAYS validate message origin

```javascript
// Shopify side
window.addEventListener('message', function(event) {
  // Only accept from PriceFlow domain
  if (event.origin !== 'https://app.teszt.uk') {
    console.warn('Rejected message from:', event.origin);
    return;
  }

  // Process message...
});
```

```javascript
// Iframe side
window.addEventListener('message', function(event) {
  // Only accept from Shopify domains
  if (!event.origin.includes('myshopify.com')) {
    return;
  }

  // Process message...
});
```

### Wildcard Target Origin

```javascript
// Development: Use wildcard
window.parent.postMessage(data, '*');

// Production: Use specific origin
window.parent.postMessage(data, 'https://store.myshopify.com');
```

---

## Debugging

### Chrome DevTools

1. Open **Console**
2. Log all postMessages:

```javascript
// In both parent and iframe
window.addEventListener('message', function(event) {
  console.log('Message received:', event.data, 'from:', event.origin);
});
```

### Testing PostMessage

```javascript
// Parent window console
document.querySelector('iframe').contentWindow.postMessage({
  type: 'CART_DATA',
  items: []
}, '*');

// Iframe console
window.parent.postMessage({
  type: 'REQUEST_CART_DATA'
}, '*');
```

---

## Troubleshooting

### Message not received

**Problem:** Iframe sends message but parent doesn't receive it.

**Solution:**
1. Check iframe is fully loaded
2. Verify `window.parent` exists
3. Check console for errors
4. Verify origin validation isn't blocking

### Cart data not updating

**Problem:** LocalStorage updates but iframe doesn't reflect changes.

**Solution:**
1. Ensure parent sends `CART_DATA` after every update
2. Check iframe's message listener is active
3. Verify `setItems()` is called with new data

### Cart badge not updating

**Problem:** Items added but badge shows old count.

**Solution:**
1. Ensure `cartUpdated` event is dispatched
2. Check `updatePriceflowCartBubble()` function exists
3. Verify badge update listener is active

---

## Testing Checklist

- [ ] Add to cart from iframe → LocalStorage updated on Shopify domain
- [ ] Open minicart → items displayed correctly
- [ ] Update quantity in minicart → LocalStorage updated
- [ ] Remove item in minicart → LocalStorage updated
- [ ] Cart badge updates after all operations
- [ ] Cross-tab sync works (open 2 tabs)
- [ ] Origin validation works in production
- [ ] Standalone mode works (direct `/minicart` access)

---

## Advantages of PostMessage Approach

✅ **Cross-domain communication** - Iframe can communicate with parent
✅ **LocalStorage on correct domain** - Cart stored on Shopify domain
✅ **Browser support** - All modern browsers support postMessage
✅ **Secure** - Origin validation prevents malicious messages
✅ **Real-time sync** - Changes reflected immediately
✅ **No CORS issues** - PostMessage bypasses CORS restrictions

---

**Last Updated:** 2026-01-11
**Status:** ✅ Implementation Ready
