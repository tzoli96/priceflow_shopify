/**
 * Pricing API Endpoints for Storefront
 *
 * Template-based pricing calculations
 */

import { apiClient } from '../client';
import type {
  ProductTemplateInfo,
  PriceCalculationResult,
  CalculatePriceRequest,
  ProductScopeMetadata,
} from '@/types/pricing';

/**
 * Pricing API
 *
 * Clean, typed interface for pricing operations
 */
export const pricingApi = {
  /**
   * Get template for a product
   *
   * GET /api/pricing/template/:productId
   *
   * @param productId - Shopify product ID
   * @param metadata - Product metadata for scope matching
   * @returns Template info if found
   */
  async getTemplateForProduct(
    productId: string,
    metadata?: ProductScopeMetadata
  ): Promise<ProductTemplateInfo> {
    const params = new URLSearchParams();

    if (metadata?.vendor) {
      params.append('vendor', metadata.vendor);
    }
    if (metadata?.tags?.length) {
      params.append('tags', metadata.tags.join(','));
    }
    if (metadata?.collections?.length) {
      params.append('collections', metadata.collections.join(','));
    }

    const query = params.toString();
    const url = `/api/pricing/template/${productId}${query ? `?${query}` : ''}`;

    return apiClient.get<ProductTemplateInfo>(url);
  },

  /**
   * Calculate price based on template and field values
   *
   * POST /api/pricing/calculate
   *
   * @param data - Calculation request with field values
   * @returns Calculated price with breakdown
   */
  async calculatePrice(
    data: CalculatePriceRequest
  ): Promise<PriceCalculationResult> {
    return apiClient.post<PriceCalculationResult, CalculatePriceRequest>(
      '/api/pricing/calculate',
      data
    );
  },
};
