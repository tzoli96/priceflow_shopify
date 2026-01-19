/**
 * Global API for Storefront
 *
 * Centralized API client with all endpoints
 *
 * Usage:
 * ```ts
 * import { api } from '@/lib/api';
 *
 * // Draft Orders
 * const draftOrder = await api.draftOrders.create(data);
 * const config = await api.draftOrders.getConfig();
 * await api.draftOrders.addItem(id, item);
 * ```
 */

import { apiClient } from './client';
import { draftOrdersApi } from './endpoints/draft-orders';
import { pricingApi } from './endpoints/pricing';

/**
 * Global API object
 *
 * Single source of truth for all API calls
 */
export const api = {
  /**
   * Draft Orders endpoints (Custom Pricing)
   */
  draftOrders: draftOrdersApi,

  /**
   * Pricing endpoints (Template-based calculations)
   */
  pricing: pricingApi,
};

/**
 * Export API client for advanced usage
 */
export { apiClient } from './client';
export { ApiError } from './client';

/**
 * Export individual endpoint modules for tree-shaking
 */
export { draftOrdersApi } from './endpoints/draft-orders';
export { pricingApi } from './endpoints/pricing';
