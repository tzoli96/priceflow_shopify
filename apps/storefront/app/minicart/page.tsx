/**
 * Minicart Page
 * Embeddable minicart that displays LocalStorage cart items
 * Usage: Load in iframe or App Block in Shopify theme
 */

'use client';

import { useEffect, useState } from 'react';
import { CartItem } from '@/types/cart';
import { formatMoney, calculateCartTotals } from '@/lib/cart/cartUtils';

export default function MinicartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Request cart data from parent window on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent) {
      // Request initial cart data
      window.parent.postMessage({ type: 'REQUEST_CART_DATA' }, '*');

      // Listen for cart data from parent
      const handleMessage = (event: MessageEvent) => {
        // TODO: Add origin check in production
        // if (!event.origin.includes('myshopify.com')) return;

        const data = event.data;

        if (data.type === 'CART_DATA') {
          setItems(data.items || []);
          setIsLoaded(true);
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const totals = calculateCartTotals(items);

  // Update quantity via postMessage
  const updateQuantity = (itemId: string, quantity: number) => {
    if (window.parent) {
      window.parent.postMessage(
        {
          type: 'UPDATE_QUANTITY',
          itemId,
          quantity,
        },
        '*'
      );
    }
  };

  // Remove item via postMessage
  const removeItem = (itemId: string) => {
    if (window.parent) {
      window.parent.postMessage(
        {
          type: 'REMOVE_ITEM',
          itemId,
        },
        '*'
      );
    }
  };

  // Notify parent when totals change
  useEffect(() => {
    if (isLoaded && window.parent) {
      window.parent.postMessage(
        {
          type: 'CART_UPDATED',
          itemCount: totals.itemCount,
          subtotal: totals.subtotal,
        },
        '*'
      );
    }
  }, [totals, isLoaded]);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: 0,
          color: '#111827',
        }}>
          Cart ({totals.itemCount})
        </h2>
        <button
          onClick={() => window.parent.postMessage({ type: 'CLOSE_CART' }, '*')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#6b7280',
          }}
          aria-label="Close cart"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="15" y1="5" x2="5" y2="15" />
            <line x1="5" y1="5" x2="15" y2="15" />
          </svg>
        </button>
      </div>

      {/* Cart Items */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
          }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Your cart is empty</p>
            <button
              onClick={() => window.parent.postMessage({ type: 'CLOSE_CART' }, '*')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderBottom: '1px solid #e5e7eb',
                alignItems: 'flex-start',
              }}
            >
              {/* Image */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                flexShrink: 0,
              }}>
                <img
                  src={item.image}
                  alt={item.product_title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: '0 0 4px 0',
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.product_title}
                </h4>

                {/* Properties */}
                {Object.keys(item.properties).length > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}>
                    {Object.entries(item.properties).slice(0, 2).map(([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '8px',
                }}>
                  {formatMoney(item.final_price)} each
                </div>

                {/* Quantity Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#f9fafb',
                        border: 'none',
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        color: '#6b7280',
                        opacity: item.quantity <= 1 ? 0.5 : 1,
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10);
                        if (!isNaN(qty) && qty >= 1) {
                          updateQuantity(item.id, qty);
                        }
                      }}
                      style={{
                        width: '40px',
                        height: '28px',
                        border: 'none',
                        borderLeft: '1px solid #d1d5db',
                        borderRight: '1px solid #d1d5db',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                      min="1"
                      max="999"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#f9fafb',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#6b7280',
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#111827',
                  }}>
                    {formatMoney(item.final_line_price)}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af',
                }}
                aria-label={`Remove ${item.product_title}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="4" x2="4" y2="12" />
                  <line x1="4" y1="4" x2="12" y2="12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
        }}>
          {/* Subtotal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '700',
          }}>
            <span>Subtotal</span>
            <span>{totals.formatted.subtotal}</span>
          </div>

          {/* Checkout Button (Disabled for Iteration 01) */}
          <button
            disabled
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'not-allowed',
              marginBottom: '12px',
            }}
          >
            Checkout (Coming Soon)
          </button>

          {/* View Cart Link */}
          <a
            href="/cart"
            target="_parent"
            style={{
              display: 'block',
              textAlign: 'center',
              color: '#3b82f6',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            View Full Cart
          </a>
        </div>
      )}
    </div>
  );
}
