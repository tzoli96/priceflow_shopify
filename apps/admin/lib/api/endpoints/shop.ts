import { apiClient } from '../client';

/**
 * Shop API Endpoints
 *
 * Handles shop setup and status checking
 */

export interface ShopStatusResponse {
  hasShop: boolean;
  shopDomain?: string;
}

export interface ShopResponse {
  success: boolean;
  shopDomain?: string;
  isActive?: boolean;
  installedAt?: string;
  error?: string;
}

export const shopApi = {
  /**
   * Check if any shop exists in the database
   * GET /api/shopify/status
   */
  async checkStatus(): Promise<ShopStatusResponse> {
    return apiClient.get<ShopStatusResponse>('/api/shopify/status');
  },

  /**
   * Create a dev shop (development only)
   * POST /api/shopify/dev-setup
   */
  async createDevShop(): Promise<ShopResponse> {
    return apiClient.post<ShopResponse>('/api/shopify/dev-setup');
  },
};
