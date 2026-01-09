/**
 * Draft Order Builder Utility
 * Constructs Draft Order payloads for Shopify Admin API
 */

import type {
  CreateDraftOrderRequest,
  DraftOrderLineItem,
  AddItemToDraftOrderRequest,
  ProductContext,
} from '@/types/draft-order';
import { calculateCustomPrice, DEFAULT_PRICE_MULTIPLIER } from './priceCalculator';

/**
 * Build a Draft Order creation request
 *
 * @param lineItems - Line items to include
 * @param options - Optional parameters (email, note, etc.)
 * @returns Draft Order creation request payload
 */
export function buildCreateDraftOrderRequest(
  lineItems: DraftOrderLineItem[],
  options?: {
    shopDomain?: string;
    customerId?: string;
    email?: string;
    note?: string;
    tags?: string[];
    useCustomerDefaultAddress?: boolean;
  }
): CreateDraftOrderRequest {
  if (!lineItems || lineItems.length === 0) {
    throw new Error('At least one line item is required');
  }

  // Validate line items
  lineItems.forEach((item, index) => {
    if (!item.variantId) {
      throw new Error(`Line item at index ${index} missing variantId`);
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Line item at index ${index} has invalid quantity`);
    }
    if (!item.customPrice) {
      throw new Error(`Line item at index ${index} missing customPrice`);
    }
  });

  return {
    shopDomain: options?.shopDomain || '',
    lineItems,
    customerId: options?.customerId,
    email: options?.email,
    note: options?.note,
    tags: options?.tags || ['priceflow', 'custom-pricing'],
    useCustomerDefaultAddress: options?.useCustomerDefaultAddress ?? false,
  };
}

/**
 * Build a line item from product context
 *
 * @param product - Product context from widget
 * @param quantity - Quantity to add
 * @param multiplier - Price multiplier (default: 2)
 * @returns Draft Order line item
 */
export function buildLineItemFromProduct(
  product: ProductContext,
  quantity: number = 1,
  multiplier: number = DEFAULT_PRICE_MULTIPLIER
): DraftOrderLineItem {
  if (!product.variantId) {
    throw new Error('Product variantId is required');
  }

  if (!product.price) {
    throw new Error('Product price is required');
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Calculate custom price
  const priceCalc = calculateCustomPrice(product.price, multiplier);

  return {
    variantId: product.variantId,
    quantity,
    originalPrice: product.price,
    customPrice: priceCalc.customPrice.toFixed(2),
    title: product.title,
    variantTitle: product.variantTitle,
    sku: product.sku,
    imageUrl: product.imageUrl,
  };
}

/**
 * Build add item request for existing Draft Order
 *
 * @param draftOrderId - Existing Draft Order ID
 * @param lineItem - Line item to add
 * @returns Add item request payload
 */
export function buildAddItemRequest(
  draftOrderId: string,
  lineItem: DraftOrderLineItem
): AddItemToDraftOrderRequest {
  if (!draftOrderId) {
    throw new Error('Draft Order ID is required');
  }

  if (!lineItem.variantId) {
    throw new Error('Line item variantId is required');
  }

  return {
    draftOrderId,
    lineItem,
  };
}

/**
 * Merge line items (combine duplicates by variantId)
 *
 * @param lineItems - Array of line items
 * @returns Merged line items with combined quantities
 */
export function mergeLineItems(
  lineItems: DraftOrderLineItem[]
): DraftOrderLineItem[] {
  const merged = new Map<string, DraftOrderLineItem>();

  lineItems.forEach((item) => {
    const existing = merged.get(item.variantId);

    if (existing) {
      // Combine quantities
      existing.quantity += item.quantity;
    } else {
      // Add new item
      merged.set(item.variantId, { ...item });
    }
  });

  return Array.from(merged.values());
}

/**
 * Validate line item
 *
 * @param lineItem - Line item to validate
 * @returns True if valid, throws error otherwise
 */
export function validateLineItem(lineItem: DraftOrderLineItem): boolean {
  if (!lineItem.variantId || typeof lineItem.variantId !== 'string') {
    throw new Error('Invalid variantId');
  }

  if (!lineItem.quantity || lineItem.quantity <= 0) {
    throw new Error('Invalid quantity');
  }

  if (!lineItem.customPrice) {
    throw new Error('Invalid customPrice');
  }

  const price = parseFloat(lineItem.customPrice);
  if (isNaN(price) || price < 0) {
    throw new Error('Invalid customPrice value');
  }

  return true;
}

/**
 * Convert Shopify GID to numeric ID
 *
 * @param gid - Shopify Global ID (e.g., "gid://shopify/ProductVariant/123")
 * @returns Numeric ID string
 */
export function extractIdFromGid(gid: string): string {
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

/**
 * Convert numeric ID to Shopify GID
 *
 * @param id - Numeric ID
 * @param resource - Resource type (e.g., "ProductVariant")
 * @returns Shopify Global ID
 */
export function buildGid(id: string | number, resource: string): string {
  return `gid://shopify/${resource}/${id}`;
}

/**
 * Generate Draft Order note with metadata
 *
 * @param metadata - Key-value pairs to include
 * @returns Formatted note string
 */
export function generateDraftOrderNote(
  metadata?: Record<string, string | number>
): string {
  const baseNote = 'Created by PriceFlow - Custom Pricing App';

  if (!metadata || Object.keys(metadata).length === 0) {
    return baseNote;
  }

  const metadataLines = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return `${baseNote}\n\n${metadataLines}`;
}
