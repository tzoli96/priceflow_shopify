/**
 * Global API
 *
 * Centralized API client with all endpoints
 *
 * Usage:
 * ```ts
 * import { api } from '@/lib/api';
 *
 * // Templates
 * const templates = await api.templates.list();
 * const template = await api.templates.get(id);
 * await api.templates.create(data);
 * await api.templates.update(id, data);
 * await api.templates.delete(id);
 *
 * // Later: Assignments, Calculations, etc.
 * const assignments = await api.assignments.list();
 * const result = await api.calculations.calculate(data);
 * ```
 *
 * Encryption:
 * ```ts
 * import { api, setEncryption } from '@/lib/api';
 *
 * // Set encryption hooks (later implementation)
 * setEncryption({
 *   beforeRequest: async (data) => encrypt(data),
 *   afterResponse: async (data) => decrypt(data),
 * });
 * ```
 */

import { apiClient } from './client';
import { templatesApi } from './endpoints/templates';
import { shopApi } from './endpoints/shop';
import * as assignmentsApi from './assignments';
import * as shopifyApi from './shopify';

/**
 * Global API object
 *
 * Single source of truth for all API calls
 */
export const api = {
  /**
   * Template endpoints
   */
  templates: templatesApi,

  /**
   * Shop endpoints (setup & status)
   */
  shop: shopApi,

  /**
   * Assignment endpoints (PHASE 4)
   */
  assignments: assignmentsApi,

  /**
   * Shopify endpoints (PHASE 4)
   */
  shopify: shopifyApi,

  /**
   * Calculation endpoints (PHASE 5)
   */
  // calculations: calculationsApi,
};

/**
 * Set encryption/decryption hooks
 *
 * Usage:
 * ```ts
 * setEncryption({
 *   beforeRequest: async (data) => {
 *     // Encrypt data before sending to backend
 *     return encryptedData;
 *   },
 *   afterResponse: async (data) => {
 *     // Decrypt data after receiving from backend
 *     return decryptedData;
 *   },
 * });
 * ```
 */
export function setEncryption(hooks: {
  beforeRequest?: (data: any) => Promise<any> | any;
  afterResponse?: (data: any) => Promise<any> | any;
}) {
  apiClient.setHooks(hooks);
}

/**
 * Export API client for advanced usage
 */
export { apiClient } from './client';
export { ApiError } from './client';

/**
 * Export individual endpoint modules for tree-shaking
 */
export { templatesApi } from './endpoints/templates';
export { shopApi } from './endpoints/shop';
export * as assignmentsApi from './assignments';
export * as shopifyApi from './shopify';
