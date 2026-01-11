/**
 * Cart Page
 * Main cart page displaying items and checkout summary
 */

import { Metadata } from 'next';
import { CartItemsList } from '@/components/cart/CartItemsList';
import { CartSummary } from '@/components/cart/CartSummary';

export const metadata: Metadata = {
  title: 'Shopping Cart | PriceFlow',
  description: 'View and manage your shopping cart',
};

/**
 * Cart Page Component
 */
export default function CartPage() {
  return (
    <div className="cart-page">
      <div className="cart-page__container">
        <header className="cart-page__header">
          <h1>Shopping Cart</h1>
        </header>

        <div className="cart-page__content">
          <div className="cart-page__items">
            <CartItemsList />
          </div>

          <aside className="cart-page__summary">
            <CartSummary enableCheckout={false} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout Structure:
 *
 * ┌─────────────────────────────────────────────┐
 * │  Shopping Cart                              │
 * ├─────────────────────────┬───────────────────┤
 * │                         │                   │
 * │  Cart Items List        │  Cart Summary     │
 * │  - Product 1            │  - Items: 3       │
 * │  - Product 2            │  - Subtotal: $89  │
 * │  - Product 3            │  - Checkout Btn   │
 * │                         │  - Clear Cart     │
 * │                         │                   │
 * └─────────────────────────┴───────────────────┘
 */
