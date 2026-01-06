export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status: 'active' | 'archived' | 'draft';
  variants: ShopifyVariant[];
  images?: {
    id: string;
    url: string;
    altText?: string;
  }[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  inventoryQuantity?: number;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  productsCount?: number;
}
