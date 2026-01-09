'use client';

import { useEffect, useState } from 'react';
import { AddToCartButton } from '@/components/draft-orders/AddToCartButton';
import type { ProductContext } from '@/types/draft-order';

export default function Home() {
  const [product, setProduct] = useState<ProductContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const variantId = params.get('variant');
    const shop = params.get('shop');

    // If no product ID, show demo product
    if (!productId || !shop) {
      setProduct({
        productId: '1',
        variantId: '101',
        title: 'Premium Wireless Headphones',
        variantTitle: 'Black / Large',
        price: '99.99',
        compareAtPrice: '129.99',
        sku: 'WH-001-BLK-L',
        imageUrl: 'https://via.placeholder.com/400x400?text=Product',
        availableForSale: true,
      });
      setLoading(false);
      return;
    }

    // Fetch real product data from Shopify
    fetchProductData(productId, variantId, shop);
  }, []);

  const fetchProductData = async (productId: string, variantId: string | null, shop: string) => {
    try {
      // Fetch product details from backend API
      const response = await fetch(`/api/shopify/products/${productId}`, {
        headers: {
          'X-Shopify-Shop': shop,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const productData = await response.json();

      // Find the selected variant or use the first one
      const selectedVariant = variantId
        ? productData.variants.find((v: any) => v.id === variantId)
        : productData.variants[0];

      if (!selectedVariant) {
        throw new Error('Variant not found');
      }

      // Find product image
      const productImage = productData.images?.[0]?.src || 'https://via.placeholder.com/400x400?text=Product';

      // Map to ProductContext
      setProduct({
        productId: productData.id,
        variantId: selectedVariant.id,
        title: productData.title,
        variantTitle: selectedVariant.title !== 'Default Title' ? selectedVariant.title : '',
        price: selectedVariant.price,
        sku: selectedVariant.sku,
        imageUrl: productImage,
        availableForSale: selectedVariant.inventoryQuantity > 0 || productData.status === 'active',
      });

      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #9333ea, #7e22ce, #4338ca)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #9333ea, #7e22ce, #4338ca)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        {error || 'Product not found'}
      </div>
    );
  }

  const handleError = (error: Error) => {
    alert(`Error: ${error.message}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #9333ea, #7e22ce, #4338ca)',
      padding: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '512px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>

          {/* Product Details */}
          <div style={{ padding: '24px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {product.title}
            </h1>

            {product.variantTitle && (
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                marginBottom: '16px'
              }}>
                {product.variantTitle}
              </p>
            )}

            {/* Price */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontSize: '30px',
                fontWeight: 'bold',
                color: '#111827'
              }}>
                ${product.price}
              </p>
              {product.compareAtPrice && (
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  textDecoration: 'line-through'
                }}>
                  ${product.compareAtPrice}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <AddToCartButton
              product={product}
              multiplier={2}
              buttonText="Add to Cart (2x Price)"
              quantity={1}
              onError={handleError}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
