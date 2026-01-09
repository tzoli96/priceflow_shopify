/**
 * Draft Orders API Endpoints for Storefront
 *
 * All Draft Orders-related API calls
 * Based on Segment 2: Backend Draft Orders API PRD
 */

import { apiClient } from '../client';
import type {
  CreateDraftOrderRequest,
  DraftOrderResponse,
  AddItemToDraftOrderRequest,
  DraftOrderWidgetConfig,
} from '@/types/draft-order';

/**
 * Draft Orders API
 *
 * Clean, typed interface for Draft Orders operations
 */
export const draftOrdersApi = {
  /**
   * Create a new Draft Order with custom pricing
   *
   * POST /api/draft-orders/create
   *
   * @param data - Draft Order creation request
   * @returns Created Draft Order with invoice URL
   */
  async create(data: CreateDraftOrderRequest): Promise<DraftOrderResponse> {
    return apiClient.post<DraftOrderResponse, CreateDraftOrderRequest>(
      '/api/draft-orders/create',
      data
    );
  },

  /**
   * Add an item to an existing Draft Order
   *
   * POST /api/draft-orders/:id/add-item
   *
   * @param draftOrderId - Draft Order ID
   * @param data - Add item request
   * @returns Updated Draft Order
   */
  async addItem(
    draftOrderId: string,
    data: AddItemToDraftOrderRequest
  ): Promise<DraftOrderResponse> {
    return apiClient.post<DraftOrderResponse, AddItemToDraftOrderRequest>(
      `/api/draft-orders/${draftOrderId}/add-item`,
      data
    );
  },

  /**
   * Get a Draft Order by ID
   *
   * GET /api/draft-orders/:id
   *
   * @param draftOrderId - Draft Order ID
   * @returns Draft Order details
   */
  async get(draftOrderId: string): Promise<DraftOrderResponse> {
    return apiClient.get<DraftOrderResponse>(
      `/api/draft-orders/${draftOrderId}`
    );
  },

  /**
   * Delete a Draft Order (cancel/cleanup)
   *
   * DELETE /api/draft-orders/:id
   *
   * @param draftOrderId - Draft Order ID
   * @returns void
   */
  async delete(draftOrderId: string): Promise<void> {
    return apiClient.delete<void>(`/api/draft-orders/${draftOrderId}`);
  },

  /**
   * Complete a Draft Order (mark as completed after payment)
   *
   * POST /api/draft-orders/:id/complete
   *
   * @param draftOrderId - Draft Order ID
   * @returns Completed Draft Order
   */
  async complete(draftOrderId: string): Promise<DraftOrderResponse> {
    return apiClient.post<DraftOrderResponse>(
      `/api/draft-orders/${draftOrderId}/complete`
    );
  },

  /**
   * Get widget configuration
   *
   * GET /api/draft-orders/config
   *
   * @returns Widget configuration settings
   */
  async getConfig(): Promise<DraftOrderWidgetConfig> {
    return apiClient.get<DraftOrderWidgetConfig>('/api/draft-orders/config');
  },

  /**
   * Update widget configuration
   *
   * PUT /api/draft-orders/config
   *
   * @param config - Widget configuration updates
   * @returns Updated configuration
   */
  async updateConfig(
    config: Partial<DraftOrderWidgetConfig>
  ): Promise<DraftOrderWidgetConfig> {
    return apiClient.put<DraftOrderWidgetConfig, Partial<DraftOrderWidgetConfig>>(
      '/api/draft-orders/config',
      config
    );
  },

  /**
   * Send invoice email for Draft Order
   *
   * POST /api/draft-orders/:id/send-invoice
   *
   * @param draftOrderId - Draft Order ID
   * @param email - Customer email (optional if already set)
   * @returns Draft Order with updated status
   */
  async sendInvoice(
    draftOrderId: string,
    email?: string
  ): Promise<DraftOrderResponse> {
    return apiClient.post<DraftOrderResponse, { email?: string }>(
      `/api/draft-orders/${draftOrderId}/send-invoice`,
      { email }
    );
  },
};
