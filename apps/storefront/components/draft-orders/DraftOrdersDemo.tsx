/**
 * DraftOrdersDemo Component
 *
 * Demo page showcasing all Draft Orders components and functionality
 */

'use client';

import React, { useState } from 'react';
import { AddToCartButton } from './AddToCartButton';
import { PriceDisplay, PriceDisplayCompact } from './PriceDisplay';
import { CartStatus, CartStatusMini } from './CartStatus';
import type { ProductContext } from '@/types/draft-order';

/**
 * Demo products for testing
 */
const DEMO_PRODUCTS: ProductContext[] = [
  {
    productId: 'gid://shopify/Product/1',
    variantId: 'gid://shopify/ProductVariant/101',
    title: 'Premium Wireless Headphones',
    variantTitle: 'Black / Large',
    price: '99.99',
    compareAtPrice: '129.99',
    sku: 'WH-001-BLK-L',
    imageUrl: 'https://via.placeholder.com/300x300?text=Headphones',
    availableForSale: true,
  },
  {
    productId: 'gid://shopify/Product/2',
    variantId: 'gid://shopify/ProductVariant/102',
    title: 'Smart Fitness Watch',
    variantTitle: 'Silver / 42mm',
    price: '149.99',
    compareAtPrice: '199.99',
    sku: 'FW-002-SLV-42',
    imageUrl: 'https://via.placeholder.com/300x300?text=Watch',
    availableForSale: true,
  },
  {
    productId: 'gid://shopify/Product/3',
    variantId: 'gid://shopify/ProductVariant/103',
    title: 'Ultra-Light Backpack',
    variantTitle: 'Navy Blue',
    price: '79.99',
    sku: 'BP-003-NVY',
    imageUrl: 'https://via.placeholder.com/300x300?text=Backpack',
    availableForSale: true,
  },
  {
    productId: 'gid://shopify/Product/4',
    variantId: 'gid://shopify/ProductVariant/104',
    title: 'Portable Power Bank',
    variantTitle: '20000mAh / Black',
    price: '49.99',
    compareAtPrice: '69.99',
    sku: 'PB-004-BLK-20K',
    imageUrl: 'https://via.placeholder.com/300x300?text=PowerBank',
    availableForSale: false, // Out of stock example
  },
];

/**
 * Draft Orders Demo Component
 */
export function DraftOrdersDemo() {
  const [selectedMultiplier, setSelectedMultiplier] = useState(2);
  const [showCartStatus, setShowCartStatus] = useState(true);

  /**
   * Handle successful order creation
   */
  const handleSuccess = (invoiceUrl: string) => {
    console.log('Draft Order created! Invoice URL:', invoiceUrl);
    // In production, this would redirect to Shopify checkout
    alert(`Order created! Would redirect to:\n${invoiceUrl}`);
  };

  /**
   * Handle error
   */
  const handleError = (error: Error) => {
    console.error('Draft Order error:', error);
    alert(`Error: ${error.message}`);
  };

  return (
    <div className="space-y-6">
      {/* Cart Status (Sticky) */}
      {showCartStatus && (
        <div className="sticky top-4 z-10">
          <CartStatus
            showCheckoutButton={true}
            showClearButton={true}
            onCheckout={(url) => {
              alert(`Would redirect to checkout:\n${url}`);
            }}
            onContinueShopping={() => {
              console.log('Continue shopping clicked');
            }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="rounded-lg bg-white/10 p-6 backdrop-blur-lg">
        <h2 className="mb-4 text-xl font-semibold text-white">
          ⚙️ Demo Controls
        </h2>

        <div className="space-y-4">
          {/* Multiplier Selector */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Price Multiplier: {selectedMultiplier}x
            </label>
            <div className="flex gap-2">
              {[1.5, 2, 2.5, 3].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setSelectedMultiplier(mult)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedMultiplier === mult
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          {/* Cart Status Toggle */}
          <div>
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showCartStatus}
                onChange={(e) => setShowCartStatus(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Show Cart Status Widget</span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="rounded-lg bg-white/10 p-6 backdrop-blur-lg">
        <h2 className="mb-4 text-xl font-semibold text-white">
          🛍️ Demo Products
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEMO_PRODUCTS.map((product) => (
            <div
              key={product.variantId}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {product.title}
                </h3>

                {product.variantTitle && (
                  <p className="text-sm text-gray-600 mb-2">
                    {product.variantTitle}
                  </p>
                )}

                <p className="text-xs text-gray-500 mb-3">
                  SKU: {product.sku}
                </p>

                {/* Price Display */}
                <div className="mb-4">
                  <PriceDisplay
                    originalPrice={product.price}
                    multiplier={selectedMultiplier}
                    showComparison={true}
                  />
                </div>

                {/* Add to Cart Button */}
                <AddToCartButton
                  product={product}
                  multiplier={selectedMultiplier}
                  buttonText={`Add to Cart (${selectedMultiplier}x Price)`}
                  quantity={1}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  className="w-full"
                />

                {/* Availability Badge */}
                {!product.availableForSale && (
                  <div className="mt-2 text-center">
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Showcase */}
      <div className="rounded-lg bg-white/10 p-6 backdrop-blur-lg">
        <h2 className="mb-4 text-xl font-semibold text-white">
          🎨 Component Showcase
        </h2>

        <div className="space-y-6">
          {/* Compact Price Display */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Compact Price Display (for lists/cards)
            </h3>
            <div className="space-y-2">
              <PriceDisplayCompact originalPrice="99.99" multiplier={2} />
              <PriceDisplayCompact originalPrice="149.99" multiplier={2.5} />
              <PriceDisplayCompact originalPrice="79.99" multiplier={1.5} />
            </div>
          </div>

          {/* Mini Cart Status */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Mini Cart Status (for navbar/header)
            </h3>
            <CartStatusMini
              onClick={() => alert('Cart clicked!')}
              className="inline-block"
            />
          </div>
        </div>
      </div>

      {/* API Integration Info */}
      <div className="rounded-lg bg-blue-500/10 p-6 backdrop-blur-lg border border-blue-400/20">
        <h2 className="mb-4 text-xl font-semibold text-white">
          🔌 API Integration
        </h2>
        <div className="space-y-2 text-sm text-blue-100">
          <p>
            <strong>Backend API Required:</strong> This demo requires the NestJS backend (Segment 2) to be implemented.
          </p>
          <p>
            <strong>Expected Endpoints:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
            <li>POST /api/draft-orders/create</li>
            <li>POST /api/draft-orders/:id/add-item</li>
            <li>GET /api/draft-orders/:id</li>
            <li>DELETE /api/draft-orders/:id</li>
            <li>GET /api/draft-orders/config</li>
          </ul>
          <p className="mt-3">
            <strong>Current Status:</strong>
            <span className="ml-2 inline-block bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded text-xs">
              Frontend Only (Mock Data)
            </span>
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="rounded-lg bg-white/10 p-6 backdrop-blur-lg">
        <h2 className="mb-4 text-xl font-semibold text-white">
          📚 Documentation
        </h2>
        <div className="space-y-2 text-sm text-purple-100">
          <p>
            <strong>PRD Documents:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
            <li>docs/prd/00-INDEX.md - Master overview</li>
            <li>docs/prd/01-WIDGET-EXTENSION-MODIFICATION.md - Frontend (✅ Implemented)</li>
            <li>docs/prd/02-BACKEND-DRAFT-ORDERS-API.md - Backend API (⏳ Pending)</li>
            <li>docs/prd/03-CHECKOUT-FLOW-MULTI-PRODUCT.md - Multi-product flow</li>
            <li>docs/prd/04-TESTING-DEPLOYMENT.md - Testing & deployment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
