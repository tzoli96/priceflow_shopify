/**
 * CartStatus Component
 *
 * Multi-product cart status display widget
 * Based on Segment 3: Checkout Flow & Multi-Product Cart PRD
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { PriceDisplayCompact } from './PriceDisplay';

interface CartStatusProps {
  onCheckout?: (invoiceUrl: string) => void;
  onContinueShopping?: () => void;
  showCheckoutButton?: boolean;
  showClearButton?: boolean;
  className?: string;
}

/**
 * Cart Status Widget
 *
 * Shows current Draft Order session status with actions
 *
 * @example
 * ```tsx
 * <CartStatus
 *   showCheckoutButton={true}
 *   showClearButton={true}
 *   onCheckout={(url) => window.location.href = url}
 *   onContinueShopping={() => console.log('Continue shopping')}
 * />
 * ```
 */
export function CartStatus({
  onCheckout,
  onContinueShopping,
  showCheckoutButton = true,
  showClearButton = true,
  className = '',
}: CartStatusProps) {
  const {
    session,
    cartStatus,
    isExpired,
    clearSession,
    hasActiveSession,
  } = useSession();

  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');

  /**
   * Update time until expiry every minute
   */
  useEffect(() => {
    if (!session || isExpired) {
      setTimeUntilExpiry('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilExpiry('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilExpiry(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [session, isExpired]);

  /**
   * Handle checkout click
   */
  const handleCheckout = () => {
    if (!session) return;

    if (onCheckout) {
      onCheckout(session.invoiceUrl);
    } else {
      // Default: redirect to invoice URL
      window.location.href = session.invoiceUrl;
    }
  };

  /**
   * Handle clear cart click
   */
  const handleClear = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearSession();
    }
  };

  /**
   * Handle continue shopping click
   */
  const handleContinueShopping = () => {
    if (onContinueShopping) {
      onContinueShopping();
    }
  };

  // Don't show if no active session
  if (!hasActiveSession) {
    return null;
  }

  // Show expired message
  if (isExpired) {
    return (
      <div className={`cart-status expired ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            Cart Expired
          </h3>
          <p className="text-xs text-red-600 mb-3">
            Your cart session has expired. Please add items again.
          </p>
          <button
            onClick={handleClear}
            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Clear Expired Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cart-status ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Your Cart ({cartStatus.itemCount} {cartStatus.itemCount === 1 ? 'item' : 'items'})
          </h3>
          {timeUntilExpiry && (
            <span className="text-xs text-gray-500">
              Expires in {timeUntilExpiry}
            </span>
          )}
        </div>

        {/* Line Items */}
        {session && session.lineItems.length > 0 && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {session.lineItems.map((item, index) => (
              <div
                key={`${item.variantId}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title || 'Product'}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    {item.variantTitle && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.variantTitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <PriceDisplayCompact
                  originalPrice={item.originalPrice}
                  multiplier={parseFloat(item.customPrice) / parseFloat(item.originalPrice)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 pt-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              Total:
            </span>
            <span className="text-lg font-bold text-gray-900">
              {cartStatus.totalPrice}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {showCheckoutButton && (
            <button
              onClick={handleCheckout}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Checkout Now
            </button>
          )}

          {onContinueShopping && (
            <button
              onClick={handleContinueShopping}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-2 px-4 rounded hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          )}

          {showClearButton && (
            <button
              onClick={handleClear}
              className="bg-red-50 text-red-600 text-sm font-semibold py-2 px-4 rounded hover:bg-red-100 transition-colors"
              title="Clear cart"
            >
              Clear
            </button>
          )}
        </div>

        {/* Info */}
        <p className="mt-3 text-xs text-gray-500 text-center">
          Your cart will expire in {timeUntilExpiry}
        </p>
      </div>
    </div>
  );
}

/**
 * Mini Cart Status (compact version for header/navbar)
 */
export function CartStatusMini({
  onClick,
  className = '',
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { cartStatus, hasActiveSession } = useSession();

  if (!hasActiveSession) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`cart-status-mini ${className}`}
      aria-label={`View cart (${cartStatus.itemCount} items)`}
    >
      <div className="relative inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-full hover:bg-blue-100 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="text-sm font-semibold">{cartStatus.itemCount}</span>
        <span className="text-xs">{cartStatus.totalPrice}</span>
      </div>
    </button>
  );
}
