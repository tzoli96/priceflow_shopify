/**
 * Add To Cart Button Component
 * Allows users to add products with custom pricing to LocalStorage cart
 */

'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

interface AddToCartButtonProps {
  /** Shopify variant ID */
  variantId: string;

  /** Product name */
  productTitle: string;

  /** Product image URL */
  image: string;

  /** Custom calculated price per unit (in dollars) */
  finalPrice: number;

  /** Quantity to add (default: 1) */
  quantity?: number;

  /** Custom properties (template selections, custom fields) */
  properties?: Record<string, any>;

  /** Button text (default: "Add to Cart") */
  buttonText?: string;

  /** Button CSS classes */
  className?: string;

  /** Callback after successful add */
  onAddSuccess?: () => void;

  /** Callback after failed add */
  onAddError?: (error: string) => void;
}

/**
 * Add To Cart Button Component
 */
export function AddToCartButton({
  variantId,
  productTitle,
  image,
  finalPrice,
  quantity = 1,
  properties = {},
  buttonText = 'Add to Cart',
  className = '',
  onAddSuccess,
  onAddError,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (isAdding) return;

    setIsAdding(true);

    try {
      // Validate inputs
      if (!variantId || typeof variantId !== 'string') {
        throw new Error('Invalid variant ID');
      }

      if (!productTitle || typeof productTitle !== 'string') {
        throw new Error('Invalid product title');
      }

      if (typeof finalPrice !== 'number' || finalPrice < 0) {
        throw new Error('Invalid price');
      }

      if (typeof quantity !== 'number' || quantity < 1) {
        throw new Error('Invalid quantity');
      }

      const cartItem = {
        variant_id: variantId,
        product_title: productTitle,
        image,
        final_price: finalPrice,
        quantity,
        properties,
      };

      // Check if running in iframe (embedded in Shopify)
      const isEmbedded = window.self !== window.top;

      console.log('[AddToCartButton] isEmbedded:', isEmbedded);
      console.log('[AddToCartButton] cartItem:', cartItem);

      if (isEmbedded && window.parent) {
        console.log('[AddToCartButton] Sending postMessage to parent window');

        // Send message to parent window (Shopify domain)
        window.parent.postMessage(
          {
            type: 'ADD_TO_CART',
            item: cartItem,
          },
          '*' // TODO: Replace with specific Shopify domain in production
        );

        console.log('[AddToCartButton] PostMessage sent successfully');

        // Success callback
        if (onAddSuccess) {
          onAddSuccess();
        }
      } else {
        console.log('[AddToCartButton] Standalone mode - using direct LocalStorage');

        // Not embedded - add to local storage directly
        addItem(cartItem);

        console.log('[AddToCartButton] Item added to LocalStorage');

        // Success callback
        if (onAddSuccess) {
          onAddSuccess();
        }
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add item to cart';

      // Error callback
      if (onAddError) {
        onAddError(errorMessage);
      }
    } finally {
      // Reset loading state after animation
      setTimeout(() => {
        setIsAdding(false);
      }, 500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`add-to-cart-button ${isAdding ? 'is-adding' : ''} ${className}`}
      aria-label={`Add ${productTitle} to cart`}
    >
      {isAdding ? (
        <>
          <span className="spinner" aria-hidden="true"></span>
          Adding...
        </>
      ) : (
        buttonText
      )}
    </button>
  );
}

/**
 * Example Usage:
 *
 * <AddToCartButton
 *   variantId="gid://shopify/ProductVariant/123456"
 *   productTitle="Custom Engraved Mug"
 *   image="https://cdn.shopify.com/..."
 *   finalPrice={29.99}
 *   quantity={1}
 *   properties={{
 *     template: "Birthday Template",
 *     name: "John Doe",
 *     message: "Happy Birthday!"
 *   }}
 *   onAddSuccess={() => console.log('Item added!')}
 * />
 */
