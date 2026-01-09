/**
 * Draft Order Service
 *
 * Handles Draft Orders creation and management via Shopify Admin API
 * Based on Segment 2: Backend Draft Orders API PRD
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShopifyService } from '../../auth/services/shopify.service';
import { CreateDraftOrderDto, LineItemDto } from '../dto/create-draft-order.dto';
import { AddItemDto } from '../dto/add-item.dto';

@Injectable()
export class DraftOrderService {
  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * Create a new Draft Order with custom pricing
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @param createDto - Draft Order creation data
   * @returns Created Draft Order response
   */
  async createDraftOrder(
    shopDomain: string,
    accessToken: string,
    createDto: CreateDraftOrderDto,
  ) {
    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    try {
      // Build Shopify Draft Order payload
      const draftOrderPayload = {
        draft_order: {
          line_items: createDto.lineItems.map((item) => this.buildLineItem(item)),
          note: createDto.note || 'Created by PriceFlow',
          tags: createDto.tags?.join(', ') || 'priceflow,custom-pricing',
          email: createDto.email,
          use_customer_default_address: createDto.useCustomerDefaultAddress || false,
        },
      };

      if (createDto.customerId) {
        draftOrderPayload.draft_order['customer'] = {
          id: createDto.customerId,
        };
      }

      console.log('[DraftOrderService] Creating draft order for shop:', shopDomain);

      // Create Draft Order via Shopify Admin API
      const response = await client.post({
        path: '/admin/api/2024-10/draft_orders.json',
        data: draftOrderPayload,
      });

      const draftOrder = response.body.draft_order;

      console.log('[DraftOrderService] Draft order created:', draftOrder.id);

      // Return formatted response
      return {
        id: draftOrder.id.toString(),
        invoiceUrl: draftOrder.invoice_url,
        subtotalPrice: draftOrder.subtotal_price,
        totalPrice: draftOrder.total_price,
        totalTax: draftOrder.total_tax,
        lineItems: createDto.lineItems,
        status: draftOrder.status,
        createdAt: draftOrder.created_at,
        expiresAt: this.calculateExpirationDate(),
      };
    } catch (error) {
      console.error('[DraftOrderService] Error creating draft order:', error);
      throw new BadRequestException(`Failed to create draft order: ${error.message}`);
    }
  }

  /**
   * Add item to existing Draft Order
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @param draftOrderId - Existing Draft Order ID
   * @param addItemDto - Item to add
   * @returns Updated Draft Order
   */
  async addItemToDraftOrder(
    shopDomain: string,
    accessToken: string,
    draftOrderId: string,
    addItemDto: AddItemDto,
  ) {
    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    try {
      // Get existing draft order
      const getResponse = await client.get({
        path: `/admin/api/2024-10/draft_orders/${draftOrderId}.json`,
      });

      const draftOrder = getResponse.body.draft_order;

      // Add new line item
      const updatedLineItems = [
        ...draftOrder.line_items,
        this.buildLineItem(addItemDto.lineItem),
      ];

      // Update draft order
      const updateResponse = await client.put({
        path: `/admin/api/2024-10/draft_orders/${draftOrderId}.json`,
        data: {
          draft_order: {
            line_items: updatedLineItems,
          },
        },
      });

      const updatedDraftOrder = updateResponse.body.draft_order;

      return {
        id: updatedDraftOrder.id.toString(),
        invoiceUrl: updatedDraftOrder.invoice_url,
        subtotalPrice: updatedDraftOrder.subtotal_price,
        totalPrice: updatedDraftOrder.total_price,
        totalTax: updatedDraftOrder.total_tax,
        lineItems: updatedDraftOrder.line_items.map((item) => ({
          variantId: item.variant_id?.toString(),
          quantity: item.quantity,
          originalPrice: item.price,
          customPrice: item.price,
          title: item.title,
          sku: item.sku,
        })),
        status: updatedDraftOrder.status,
        createdAt: updatedDraftOrder.created_at,
        expiresAt: this.calculateExpirationDate(),
      };
    } catch (error) {
      console.error('[DraftOrderService] Error adding item to draft order:', error);
      throw new NotFoundException(`Draft Order not found: ${draftOrderId}`);
    }
  }

  /**
   * Get Draft Order by ID
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @param draftOrderId - Draft Order ID
   * @returns Draft Order details
   */
  async getDraftOrder(
    shopDomain: string,
    accessToken: string,
    draftOrderId: string,
  ) {
    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    try {
      const response = await client.get({
        path: `/admin/api/2024-10/draft_orders/${draftOrderId}.json`,
      });

      const draftOrder = response.body.draft_order;

      return {
        id: draftOrder.id.toString(),
        invoiceUrl: draftOrder.invoice_url,
        subtotalPrice: draftOrder.subtotal_price,
        totalPrice: draftOrder.total_price,
        totalTax: draftOrder.total_tax,
        lineItems: draftOrder.line_items.map((item) => ({
          variantId: item.variant_id?.toString(),
          quantity: item.quantity,
          originalPrice: item.price,
          customPrice: item.price,
          title: item.title,
          sku: item.sku,
        })),
        status: draftOrder.status,
        createdAt: draftOrder.created_at,
        expiresAt: this.calculateExpirationDate(),
      };
    } catch (error) {
      console.error('[DraftOrderService] Error getting draft order:', error);
      throw new NotFoundException(`Draft Order not found: ${draftOrderId}`);
    }
  }

  /**
   * Delete Draft Order
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @param draftOrderId - Draft Order ID
   */
  async deleteDraftOrder(
    shopDomain: string,
    accessToken: string,
    draftOrderId: string,
  ): Promise<void> {
    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    try {
      await client.delete({
        path: `/admin/api/2024-10/draft_orders/${draftOrderId}.json`,
      });

      console.log('[DraftOrderService] Draft order deleted:', draftOrderId);
    } catch (error) {
      console.error('[DraftOrderService] Error deleting draft order:', error);
      throw new NotFoundException(`Draft Order not found: ${draftOrderId}`);
    }
  }

  /**
   * Complete Draft Order (convert to order)
   *
   * @param shopDomain - Shop domain
   * @param accessToken - OAuth access token
   * @param draftOrderId - Draft Order ID
   * @returns Completed Draft Order
   */
  async completeDraftOrder(
    shopDomain: string,
    accessToken: string,
    draftOrderId: string,
  ) {
    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    try {
      const response = await client.put({
        path: `/admin/api/2024-10/draft_orders/${draftOrderId}/complete.json`,
        data: {},
      });

      const draftOrder = response.body.draft_order;

      return {
        id: draftOrder.id.toString(),
        orderId: draftOrder.order_id?.toString(),
        status: draftOrder.status,
        completedAt: draftOrder.completed_at,
      };
    } catch (error) {
      console.error('[DraftOrderService] Error completing draft order:', error);
      throw new BadRequestException(`Failed to complete draft order: ${error.message}`);
    }
  }

  /**
   * Build Shopify line item from DTO
   *
   * @param item - Line item DTO
   * @returns Shopify line item format
   */
  private buildLineItem(item: LineItemDto) {
    const customPrice = parseFloat(item.customPrice);

    // IMPORTANT: Shopify IGNORES 'price' field when 'variant_id' is present!
    // For custom pricing, we MUST NOT use variant_id - only custom line items
    return {
      title: item.title || 'Custom Product',
      quantity: item.quantity,
      price: customPrice.toFixed(2),
      sku: item.sku,
      taxable: true,
      requires_shipping: true,
    };
  }

  /**
   * Calculate expiration date (24 hours from now)
   *
   * @returns ISO date string
   */
  private calculateExpirationDate(): string {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate.toISOString();
  }
}
