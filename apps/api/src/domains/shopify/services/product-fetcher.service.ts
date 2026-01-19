import { Injectable } from '@nestjs/common';
import { ShopifyService } from '../../auth/services/shopify.service';
import axios from 'axios';

const API_VERSION = '2026-01';

/**
 * Product Fetcher Service
 *
 * Felelősség: Shopify adatok lekérése (termékek, kollekciók, vendor-ek, tag-ek)
 *
 * Funkciók:
 * - getProducts(): Termékek lekérése szűrőkkel
 * - getCollections(): Kollekciók listája
 * - getVendors(): Vendor-ek listája
 * - getTags(): Tag-ek listája
 *
 * Megjegyzés: axios-t használunk a Shopify REST kliens helyett,
 * mert a Docker konténerben IPv4 kényszerítés szükséges.
 */
@Injectable()
export class ProductFetcherService {
  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * Shopify REST API hívás axios-szal (IPv4 támogatással)
   */
  private async shopifyGet(
    shopDomain: string,
    accessToken: string,
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<any> {
    const url = `https://${shopDomain}/admin/api/${API_VERSION}/${endpoint}.json`;

    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      params,
      timeout: 30000,
      family: 4, // Force IPv4
    });

    return response;
  }

  /**
   * Termékek lekérése (single page with pagination metadata)
   *
   * @param shopDomain - Shop domain (pl. "example.myshopify.com")
   * @param accessToken - OAuth access token
   * @param options - Szűrési és pagination opciók
   * @returns Termékek és pagination metadata
   */
  async getProducts(
    shopDomain: string,
    accessToken: string,
    options?: {
      pageInfo?: string;
      limit?: number;
      query?: string;
      collectionId?: string;
      vendor?: string;
    },
  ): Promise<{
    products: any[];
    pageInfo: { next: string | null; previous: string | null };
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    try {
      const pageLimit = options?.limit || 250; // Max 250 per page

      console.log('[ProductFetcherService] Fetching products page for shop:', shopDomain);

      // Build query params
      const queryParams: any = {
        limit: pageLimit,
      };

      if (options?.query) {
        queryParams.title = options.query;
      }

      if (options?.vendor) {
        queryParams.vendor = options.vendor;
      }

      if (options?.collectionId) {
        queryParams.collection_id = options.collectionId;
      }

      if (options?.pageInfo) {
        queryParams.page_info = options.pageInfo;
      }

      console.log('[ProductFetcherService] Query params:', queryParams);

      const response = await this.shopifyGet(
        shopDomain,
        accessToken,
        'products',
        queryParams,
      );

      const products = response.data.products || [];
      const linkHeader = response.headers?.link;

      // Parse pagination from Link header
      const nextPageInfo = this.extractNextPageInfo(linkHeader);
      const previousPageInfo = this.extractPreviousPageInfo(linkHeader);

      console.log('[ProductFetcherService] Fetched', products.length, 'products');
      console.log('[ProductFetcherService] Next page info:', nextPageInfo ? 'exists' : 'none');
      console.log('[ProductFetcherService] Previous page info:', previousPageInfo ? 'exists' : 'none');

      return {
        products,
        pageInfo: {
          next: nextPageInfo,
          previous: previousPageInfo,
        },
        hasNextPage: !!nextPageInfo,
        hasPreviousPage: !!previousPageInfo,
      };
    } catch (error) {
      console.error('[ProductFetcherService] Failed to fetch products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Extract next page_info from Link header for pagination
   *
   * Link header example:
   * <https://shop.myshopify.com/admin/api/2024-10/products.json?page_info=abc123>; rel="next"
   */
  private extractNextPageInfo(linkHeader: string | undefined): string | null {
    if (!linkHeader) {
      return null;
    }

    // Parse Link header to find "next" relation
    const nextLinkMatch = linkHeader.match(/<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/);

    if (nextLinkMatch && nextLinkMatch[1]) {
      return nextLinkMatch[1];
    }

    return null;
  }

  /**
   * Extract previous page_info from Link header for pagination
   *
   * Link header example:
   * <https://shop.myshopify.com/admin/api/2024-10/products.json?page_info=xyz789>; rel="previous"
   */
  private extractPreviousPageInfo(linkHeader: string | undefined): string | null {
    if (!linkHeader) {
      return null;
    }

    // Parse Link header to find "previous" relation
    const prevLinkMatch = linkHeader.match(/<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="previous"/);

    if (prevLinkMatch && prevLinkMatch[1]) {
      return prevLinkMatch[1];
    }

    return null;
  }

  /**
   * Kollekciók lekérése
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @returns Kollekciók listája
   */
  async getCollections(
    shopDomain: string,
    accessToken: string,
  ): Promise<any[]> {
    try {
      const customResponse = await this.shopifyGet(
        shopDomain,
        accessToken,
        'custom_collections',
      );
      const customCollections = customResponse.data.custom_collections || [];

      // Smart collections is lekérése
      const smartResponse = await this.shopifyGet(
        shopDomain,
        accessToken,
        'smart_collections',
      );
      const smartCollections = smartResponse.data.smart_collections || [];

      return [...customCollections, ...smartCollections];
    } catch (error) {
      console.error('[ProductFetcherService] Failed to fetch collections:', error);
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }
  }

  /**
   * Vendor-ek lekérése (első oldalról - 250 termék)
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @returns Vendor-ek listája (unique)
   */
  async getVendors(
    shopDomain: string,
    accessToken: string,
  ): Promise<string[]> {
    try {
      // Használjuk a getProducts() metódust (első oldal)
      const { products } = await this.getProducts(shopDomain, accessToken);

      const vendors = products
        .map((p: any) => p.vendor)
        .filter((v: string) => v && v.trim() !== '') as string[];

      // Unique vendors
      return [...new Set(vendors)].sort();
    } catch (error) {
      console.error('[ProductFetcherService] Failed to fetch vendors:', error);
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }
  }

  /**
   * Tag-ek lekérése (első oldalról - 250 termék)
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @returns Tag-ek listája (unique)
   */
  async getTags(shopDomain: string, accessToken: string): Promise<string[]> {
    try {
      // Használjuk a getProducts() metódust (első oldal)
      const { products } = await this.getProducts(shopDomain, accessToken);

      const allTags: string[] = [];

      products.forEach((p: any) => {
        if (p.tags) {
          const tags = p.tags.split(',').map((t: string) => t.trim());
          allTags.push(...tags);
        }
      });

      // Unique tags
      return [...new Set(allTags)].filter((t) => t !== '').sort();
    } catch (error) {
      console.error('[ProductFetcherService] Failed to fetch tags:', error);
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
  }
}
