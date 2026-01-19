/**
 * Pricing TypeScript Interfaces
 * Types for template-based pricing calculations
 */

/**
 * Template field type
 */
export type FieldType =
  | 'NUMBER'
  | 'TEXT'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'TEXTAREA'
  | 'FILE';

/**
 * Field option for SELECT/RADIO fields
 */
export interface FieldOption {
  value: string;
  label: string;
  price?: number;
}

/**
 * Field validation rules
 */
export interface FieldValidation {
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * Template field definition
 */
export interface TemplateField {
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: FieldOption[];
  useInFormula: boolean;
  order: number;
}

/**
 * Quantity limits info
 */
export interface QuantityLimits {
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityMessage?: string;
  maxQuantityMessage?: string;
}

/**
 * Discount tier info
 */
export interface DiscountTier {
  minQty: number;
  maxQty: number | null;
  discount: number;
}

/**
 * Product template info from API
 */
export interface ProductTemplateInfo {
  hasTemplate: boolean;
  template?: {
    id: string;
    name: string;
    description?: string;
    fields: TemplateField[];
    // Express option
    hasExpressOption: boolean;
    expressMultiplier?: number;
    expressLabel?: string;
    normalLabel?: string;
    // Quantity limits
    quantityLimits?: QuantityLimits;
    // Discount tiers
    discountTiers?: DiscountTier[];
  };
}

/**
 * Price breakdown item
 */
export interface PriceBreakdownItem {
  label: string;
  value: number;
  type: 'base' | 'calculation' | 'addon' | 'total';
}

/**
 * Price calculation request
 */
export interface CalculatePriceRequest {
  templateId: string;
  fieldValues: Record<string, number>;
  quantity: number;
  basePrice: number;
  isExpress?: boolean;
}

/**
 * Price calculation result
 */
export interface PriceCalculationResult {
  calculatedPrice: number;
  originalPrice: number;
  breakdown: PriceBreakdownItem[];
  formattedPrice: string;
  currency: string;
  templateId: string;
  templateName: string;
  // Discount info
  discountPercent?: number;
  discountAmount?: number;
  priceBeforeDiscount?: number;
  // Express info
  isExpress?: boolean;
  expressMultiplier?: number;
  normalPrice?: number;
  expressPrice?: number;
}

/**
 * Product scope metadata for template matching
 */
export interface ProductScopeMetadata {
  productId?: string;
  vendor?: string;
  tags?: string[];
  collections?: string[];
}
