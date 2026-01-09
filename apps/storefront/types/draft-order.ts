/**
 * Draft Orders Types
 * Based on Segment 1: Widget/Extension Modification PRD
 */

/**
 * Draft Order Line Item
 */
export interface DraftOrderLineItem {
  variantId: string;
  quantity: number;
  originalPrice: string; // Base price from product
  customPrice: string; // Modified price (e.g., 2x)
  title?: string;
  variantTitle?: string;
  sku?: string;
  imageUrl?: string;
}

/**
 * Draft Order Create Request
 */
export interface CreateDraftOrderRequest {
  shopDomain: string;
  lineItems: DraftOrderLineItem[];
  customerId?: string;
  email?: string;
  note?: string;
  tags?: string[];
  useCustomerDefaultAddress?: boolean;
}

/**
 * Draft Order Response from Backend
 */
export interface DraftOrderResponse {
  id: string; // Draft Order ID from Shopify
  invoiceUrl: string; // Checkout URL
  subtotalPrice: string;
  totalPrice: string;
  totalTax: string;
  lineItems: DraftOrderLineItem[];
  status: DraftOrderStatus;
  createdAt: string;
  expiresAt: string; // Invoice expiration time
}

/**
 * Draft Order Status
 */
export type DraftOrderStatus = 'open' | 'invoice_sent' | 'completed' | 'canceled';

/**
 * Add Item to Existing Draft Order Request
 */
export interface AddItemToDraftOrderRequest {
  draftOrderId: string;
  lineItem: DraftOrderLineItem;
}

/**
 * Session Storage Model
 * Used for multi-product cart tracking
 */
export interface DraftOrderSession {
  draftOrderId: string; // Shopify Draft Order ID
  invoiceUrl: string; // Checkout URL
  lineItems: DraftOrderLineItem[];
  subtotalPrice: string;
  totalPrice: string;
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (24h from creation)
}

/**
 * Price Calculation Result
 */
export interface PriceCalculation {
  originalPrice: number;
  customPrice: number;
  multiplier: number;
  savings: number; // Negative if price increased
  formattedOriginal: string;
  formattedCustom: string;
  formattedSavings: string;
}

/**
 * API Error Response
 */
export interface DraftOrderError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * Widget Configuration
 * Fetched from backend settings
 */
export interface DraftOrderWidgetConfig {
  enabled: boolean;
  priceMultiplier: number; // Default: 2
  buttonText: string; // Default: "Add to Cart (2x Price)"
  showPriceComparison: boolean;
  allowMultiProduct: boolean;
  sessionExpirationHours: number; // Default: 24
}

/**
 * Product Context for Widget
 * Passed from Shopify UI extension or admin embed
 */
export interface ProductContext {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  price: string;
  compareAtPrice?: string;
  sku: string;
  imageUrl?: string;
  availableForSale: boolean;
}

/**
 * Cart Action Types
 */
export type CartAction = 'create' | 'add_item' | 'checkout' | 'continue_shopping' | 'clear';

/**
 * Cart Status
 */
export interface CartStatus {
  hasActiveSession: boolean;
  itemCount: number;
  totalPrice: string;
  expiresAt?: string;
  draftOrderId?: string;
}
