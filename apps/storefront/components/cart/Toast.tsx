/**
 * Toast Notification Component
 * Displays feedback messages for cart operations
 */

'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';

/**
 * Toast Component
 * Automatically displays and clears toast messages from useCart
 */
export function Toast() {
  const { toast, clearToast } = useCart();

  useEffect(() => {
    if (toast) {
      // Auto-clear after 3 seconds
      const timer = setTimeout(() => {
        clearToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast) {
    return null;
  }

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div
      className={`toast toast--${toast.type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast__content">
        <span className="toast__icon" aria-hidden="true">
          {getToastIcon()}
        </span>
        <span className="toast__message">{toast.message}</span>
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={clearToast}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Example Usage:
 *
 * // In your layout or app component:
 * <Toast />
 *
 * // Toast will automatically display when:
 * // - Item is added to cart
 * // - Item is removed from cart
 * // - Quantity is updated
 * // - Cart is cleared
 * // - Errors occur
 */
