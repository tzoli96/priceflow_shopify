/**
 * Cart Summary Component
 * Displays cart totals and checkout button
 */

'use client';

import { useCart } from '@/hooks/useCart';

interface CartSummaryProps {
  /** Show clear cart button (default: true) */
  showClearCart?: boolean;

  /** Callback when checkout is clicked */
  onCheckout?: () => void;

  /** Enable checkout button (default: false for Iteration 01) */
  enableCheckout?: boolean;
}

/**
 * Cart Summary Component
 */
export function CartSummary({
  showClearCart = true,
  onCheckout,
  enableCheckout = false,
}: CartSummaryProps) {
  const { totals, items, clearCart } = useCart();

  const handleClearCart = () => {
    if (
      window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')
    ) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    if (enableCheckout && onCheckout) {
      onCheckout();
    }
  };

  // Don't show summary if cart is empty
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="cart-summary">
      <div className="cart-summary__header">
        <h2>Cart Summary</h2>
      </div>

      <div className="cart-summary__body">
        <div className="cart-summary__row">
          <span className="label">Items:</span>
          <span className="value">{totals.itemCount}</span>
        </div>

        <div className="cart-summary__row cart-summary__row--subtotal">
          <span className="label">Subtotal:</span>
          <span className="value">{totals.formatted.subtotal}</span>
        </div>

        <div className="cart-summary__note">
          <p>
            <small>
              {enableCheckout
                ? 'Tax and shipping calculated at checkout'
                : 'Checkout will be available in the next version'}
            </small>
          </p>
        </div>
      </div>

      <div className="cart-summary__footer">
        <button
          type="button"
          className="cart-summary__checkout-button"
          onClick={handleCheckout}
          disabled={!enableCheckout || items.length === 0}
        >
          {enableCheckout ? 'Proceed to Checkout' : 'Checkout (Coming Soon)'}
        </button>

        {showClearCart && (
          <button
            type="button"
            className="cart-summary__clear-button"
            onClick={handleClearCart}
          >
            Clear Cart
          </button>
        )}

        <a href="/" className="cart-summary__continue-link">
          Continue Shopping
        </a>
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * // Iteration 01 (checkout disabled)
 * <CartSummary />
 *
 * // Iteration 02 (checkout enabled)
 * <CartSummary
 *   enableCheckout={true}
 *   onCheckout={() => {
 *     // Create Draft Order and redirect to invoice URL
 *   }}
 * />
 */
