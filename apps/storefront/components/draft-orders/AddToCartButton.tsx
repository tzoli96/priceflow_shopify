/**
 * AddToCartButton Component
 *
 * Custom "Add to Cart (2x Price)" button for Draft Orders
 * Based on Segment 1: Widget/Extension Modification PRD
 */

'use client';

import React, { useState } from 'react';
import { useDraftOrder } from '@/hooks/useDraftOrder';
import { useSession, createSession } from '@/hooks/useSession';
import { buildLineItemFromProduct, buildCreateDraftOrderRequest } from '@/lib/utils/draftOrderBuilder';
import { getShopDomain } from '@/lib/shopify/shop';
import type { ProductContext } from '@/types/draft-order';

interface AddToCartButtonProps {
  product: ProductContext;
  multiplier?: number;
  buttonText?: string;
  quantity?: number;
  className?: string;
  onSuccess?: (invoiceUrl: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Add to Cart Button with 2x Price
 *
 * Creates or updates a Draft Order with custom pricing
 *
 * @example
 * ```tsx
 * <AddToCartButton
 *   product={{
 *     productId: '123',
 *     variantId: '456',
 *     title: 'Product Name',
 *     variantTitle: 'Size: Large',
 *     price: '50.00',
 *     sku: 'SKU123',
 *     availableForSale: true,
 *   }}
 *   multiplier={2}
 *   buttonText="Add to Cart (2x Price)"
 *   onSuccess={(url) => window.location.href = url}
 * />
 * ```
 */
export function AddToCartButton({
  product,
  multiplier = 2,
  buttonText = 'Add to Cart (2x Price)',
  quantity = 1,
  className = '',
  onSuccess,
  onError,
}: AddToCartButtonProps) {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const { session, saveSession, hasActiveSession } = useSession();

  const { createDraftOrder, addItem, loading, error } = useDraftOrder({
    onSuccess: (draftOrder) => {
      // Save session
      const newSession = createSession(
        draftOrder.id,
        draftOrder.invoiceUrl,
        draftOrder.lineItems,
        draftOrder.subtotalPrice,
        draftOrder.totalPrice
      );
      saveSession(newSession);

      // Set checkout URL to show button
      setCheckoutUrl(draftOrder.invoiceUrl);

      if (onSuccess) {
        onSuccess(draftOrder.invoiceUrl);
      }
    },
    onError: (err) => {
      if (onError) {
        onError(err as Error);
      }
    },
  });

  /**
   * Handle Add to Cart click
   */
  const handleClick = async () => {
    if (!product.availableForSale) {
      alert('This product is not available for sale');
      return;
    }

    // Get shop domain (fallback to demo for testing)
    let shopDomain = getShopDomain();
    if (!shopDomain) {
      shopDomain = 'demo-store.myshopify.com'; // Demo fallback
    }

    try {
      // Build line item
      const lineItem = buildLineItemFromProduct(product, quantity, multiplier);

      if (hasActiveSession && session) {
        // Add to existing Draft Order
        await addItem(session.draftOrderId, {
          draftOrderId: session.draftOrderId,
          lineItem,
        });
      } else {
        // Create new Draft Order
        const request = buildCreateDraftOrderRequest([lineItem], {
          shopDomain,
          note: `Created via PriceFlow - ${multiplier}x pricing`,
          tags: ['priceflow', 'custom-pricing', `multiplier-${multiplier}`],
        });

        await createDraftOrder(request);
      }
    } catch (err) {
      // Error handled by useDraftOrder hook
    }
  };

  /**
   * Get button text based on state
   */
  const getButtonText = () => {
    if (loading) return hasActiveSession ? 'Adding to cart...' : 'Creating order...';
    return buttonText;
  };

  /**
   * Check if button should be disabled
   */
  const isDisabled = loading || !product.availableForSale;

  // If checkout URL is available, show checkout button
  if (checkoutUrl) {
    return (
      <div className={className} style={{ width: '100%' }}>
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
            Termék hozzáadva a kosárhoz!
          </div>
          <div style={{ fontSize: '14px', color: '#15803d' }}>
            Kattints a gombra a fizetéshez
          </div>
        </div>

        <a
          href={checkoutUrl}
          style={{
            display: 'block',
            width: '100%',
            backgroundColor: '#16a34a',
            color: 'white',
            fontWeight: '600',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            textAlign: 'center',
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#15803d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#16a34a';
          }}
        >
          Tovább a fizetéshez →
        </a>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%' }}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        style={{
          width: '100%',
          backgroundColor: isDisabled ? '#93c5fd' : '#2563eb',
          color: 'white',
          fontWeight: '600',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          fontSize: '16px',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }
        }}
        aria-label={buttonText}
        aria-busy={loading}
      >
        {getButtonText()}
      </button>

      {error && (
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#dc2626' }} role="alert">
          Error: {error.message || 'Failed to create order'}
        </div>
      )}

      {!product.availableForSale && (
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#4b5563' }} role="alert">
          This product is currently unavailable
        </div>
      )}
    </div>
  );
}
