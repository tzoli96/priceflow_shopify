/**
 * Shopify API Client
 */

import { apiClient } from './client';
import type { ShopifyProduct, ShopifyCollection } from '@/types/shopify';

/**
 * Paginated product response
 */
export interface PaginatedProductsResponse {
  products: ShopifyProduct[];
  pageInfo: { next: string | null; previous: string | null };
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Get products (paginated)
 */
export async function getProducts(params?: {
  pageInfo?: string;
  query?: string;
  collectionId?: string;
  vendor?: string;
}): Promise<PaginatedProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.pageInfo) searchParams.set('pageInfo', params.pageInfo);
  if (params?.query) searchParams.set('query', params.query);
  if (params?.collectionId) searchParams.set('collectionId', params.collectionId);
  if (params?.vendor) searchParams.set('vendor', params.vendor);

  const query = searchParams.toString();
  return apiClient.get<PaginatedProductsResponse>(
    `/api/shopify/products${query ? `?${query}` : ''}`
  );
}

/**
 * Get collections
 */
export async function getCollections(): Promise<ShopifyCollection[]> {
  return apiClient.get<ShopifyCollection[]>('/api/shopify/collections');
}

/**
 * Get vendors
 */
export async function getVendors(): Promise<string[]> {
  return apiClient.get<string[]>('/api/shopify/vendors');
}

/**
 * Get tags
 */
export async function getTags(): Promise<string[]> {
  return apiClient.get<string[]>('/api/shopify/tags');
}
