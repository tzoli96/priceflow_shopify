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
import { DekormunkaConfigurator, AddToCartData } from '@/components/pricing/DekormunkaConfigurator';
import '@/styles/dekormunka.css';

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
  // Sends postMessage matching the theme.liquid handler:
  //   data.type === 'ADD_TO_CART'
  //   data.item  === { variant_id, product_title, image, final_price, quantity, properties }
  const handleAddToCart = (data: AddToCartData) => {
    const message = {
      type: 'ADD_TO_CART',
      item: {
        variant_id: data.variantId,
        product_title: data.productTitle,
        image: data.productImage,
        final_price: data.finalPrice,
        quantity: data.quantity,
        properties: {
          ...data.properties,
          _templateId: data.templateId,
          _isExpress: data.isExpress ? 'Igen' : undefined,
        },
      },
    };

    window.parent.postMessage(message, '*');
    console.log('[PriceFlow] ADD_TO_CART sent:', message.item.product_title, message.item.final_price);
  };

  if (loading) {
    return (
      <div className="dekormunka-configurator">
        <div className="dekormunka-loading">
          <div className="dekormunka-spinner" />
          <span>Konfigurátor betöltése...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dekormunka-configurator">
        <div className="dekormunka-error">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="dekormunka-configurator">
        <div className="dekormunka-error">Termék nem található</div>
      </div>
    );
  }

  const basePrice = parseFloat(product.price) || 0;

  return (
    <DekormunkaConfigurator
      productId={product.productId}
      variantId={product.variantId}
      productTitle={product.title}
      productImage={product.imageUrl}
      basePrice={basePrice}
      vendor={product.vendor}
      tags={product.tags}
      onAddToCart={handleAddToCart}
    />
  );
}
