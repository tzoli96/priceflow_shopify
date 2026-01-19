/**
 * PriceFlow Storefront Widget Page
 *
 * This page is embedded in the Shopify theme via iframe.
 * It loads the ProductConfigurator for template-based pricing.
 *
 * URL params:
 * - productId: Shopify product ID
 * - shop: Shop domain
 * - handle: Product handle (optional)
 * - variant: Variant ID (optional)
 */

'use client';

import { useEffect, useState } from 'react';
import { ProductConfigurator, AddToCartData } from '@/components/pricing/ProductConfigurator';
import '@/styles/priceflow.css';

interface ProductData {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  price: string;
  sku: string;
  imageUrl: string;
  vendor: string;
  tags: string[];
}

export default function Home() {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [shop, setShop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const variantId = params.get('variant');
    const shopDomain = params.get('shop');

    // If no product ID, show demo mode
    if (!productId || !shopDomain) {
      setProduct({
        productId: 'demo-1',
        variantId: 'demo-101',
        title: 'Demo Termék',
        variantTitle: '',
        price: '10000',
        sku: 'DEMO-001',
        imageUrl: 'https://via.placeholder.com/400x400?text=Demo',
        vendor: 'Demo',
        tags: [],
      });
      setShop('demo.myshopify.com');
      setLoading(false);
      return;
    }

    setShop(shopDomain);
    fetchProductData(productId, variantId, shopDomain);
  }, []);

  const fetchProductData = async (
    productId: string,
    variantId: string | null,
    shopDomain: string
  ) => {
    try {
      // Fetch product details from backend API
      const response = await fetch(`/api/shopify/products/${productId}`, {
        headers: {
          'X-Shopify-Shop': shopDomain,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Termék nem található');
      }

      const productData = await response.json();

      // Find the selected variant or use the first one
      const selectedVariant = variantId
        ? productData.variants?.find((v: any) => v.id === variantId)
        : productData.variants?.[0];

      if (!selectedVariant) {
        throw new Error('Variáns nem található');
      }

      // Find product image
      const productImage =
        productData.images?.[0]?.src ||
        'https://via.placeholder.com/400x400?text=Product';

      // Map to ProductData
      setProduct({
        productId: productData.id,
        variantId: selectedVariant.id,
        title: productData.title,
        variantTitle:
          selectedVariant.title !== 'Default Title' ? selectedVariant.title : '',
        price: selectedVariant.price,
        sku: selectedVariant.sku || '',
        imageUrl: productImage,
        vendor: productData.vendor || '',
        tags: productData.tags || [],
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Product fetch error:', err);
      setError(err.message || 'Hiba a termék betöltésekor');
      setLoading(false);
    }
  };

  // Handle add to cart from configurator
  const handleAddToCart = async (data: AddToCartData) => {
    try {
      // Send message to parent window (Shopify theme)
      window.parent.postMessage(
        {
          type: 'PRICEFLOW_ADD_TO_CART',
          payload: {
            variantId: data.variantId,
            quantity: data.quantity,
            price: data.finalPrice,
            linePrice: data.finalLinePrice,
            properties: data.properties,
            productTitle: data.productTitle,
            productImage: data.productImage,
          },
        },
        '*'
      );

      // Create draft order via API for custom pricing
      const response = await fetch('/api/draft-orders/from-cart', {
        method: 'POST',
        headers: {
          'X-Shopify-Shop': shop,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              variantId: data.variantId,
              quantity: data.quantity,
              customPrice: data.finalPrice,
              customTitle: data.productTitle,
              properties: data.properties,
            },
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Notify parent about checkout URL
        if (result.invoiceUrl) {
          window.parent.postMessage(
            {
              type: 'PRICEFLOW_CHECKOUT',
              payload: { invoiceUrl: result.invoiceUrl },
            },
            '*'
          );
        }
      }
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  };

  if (loading) {
    return (
      <div className="priceflow-widget-container priceflow-widget-loading">
        <div className="priceflow-loading">
          <div className="priceflow-spinner" />
          <span>Konfigurátor betöltése...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="priceflow-widget-container">
        <div className="priceflow-error">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="priceflow-widget-container">
        <div className="priceflow-error">Termék nem található</div>
      </div>
    );
  }

  const basePrice = parseFloat(product.price) || 0;

  return (
    <div className="priceflow-widget-container">
      <ProductConfigurator
        productId={product.productId}
        variantId={product.variantId}
        productTitle={product.title}
        productImage={product.imageUrl}
        basePrice={basePrice}
        vendor={product.vendor}
        tags={product.tags}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
