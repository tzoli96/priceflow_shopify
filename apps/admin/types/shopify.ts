/**
 * Shopify Product Types
 */

export interface ShopifyProduct {
  id: string;
  title: string;
  vendor: string;
  productType: string;
  handle: string;
  tags: string[];
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string;
  inventoryQuantity: number;
}

export interface ShopifyImage {
  id: string;
  src: string;
  alt: string | null;
}

/**
 * Shopify Collection Types
 */
export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  type: 'custom' | 'smart';
  productsCount?: number;
}
