import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsObject,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * Request DTO for POST /api/pricing/calculate
 *
 * @example
 * {
 *   "templateId": "uuid-123",
 *   "productId": "12345",
 *   "fieldValues": {
 *     "width_cm": 200,
 *     "height_cm": 150,
 *     "material": 1
 *   },
 *   "quantity": 1,
 *   "basePrice": 5000,
 *   "isExpress": false
 * }
 */
export class CalculatePriceRequestDto {
  /**
   * Template ID (UUID)
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @IsString()
  @IsNotEmpty()
  templateId: string;

  /**
   * Product ID (Shopify product ID)
   * @example "12345"
   */
  @IsString()
  @IsNotEmpty()
  productId: string;

  /**
   * Field values from user input
   * Key-value pairs where key is field key and value is numeric
   * @example { "width_cm": 200, "height_cm": 150 }
   */
  @IsObject()
  @IsNotEmpty()
  fieldValues: Record<string, number>;

  /**
   * Product quantity
   * @example 1
   */
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  /**
   * Base product price (original Shopify price)
   * @example 5000
   */
  @IsNumber()
  @Min(0)
  basePrice: number;

  /**
   * Whether express production is selected
   * @example false
   */
  @IsBoolean()
  @IsOptional()
  isExpress?: boolean;
}

/**
 * Price breakdown item for display
 */
export class PriceBreakdownItemDto {
  label: string;
  value: number;
  type: 'base' | 'calculation' | 'addon' | 'total';
}

/**
 * Response DTO for POST /api/pricing/calculate
 */
export class CalculatePriceResponseDto {
  /**
   * Final calculated price
   * @example 12500
   */
  calculatedPrice: number;

  /**
   * Original price (basePrice * quantity)
   * @example 5000
   */
  originalPrice: number;

  /**
   * Price breakdown for display
   */
  breakdown: PriceBreakdownItemDto[];

  /**
   * Formatted price string
   * @example "12 500 Ft"
   */
  formattedPrice: string;

  /**
   * Currency code
   * @example "HUF"
   */
  currency: string;

  /**
   * Template ID used for calculation
   */
  templateId: string;

  /**
   * Template name
   */
  templateName: string;

  // Discount info
  /**
   * Discount percentage applied
   * @example 10
   */
  discountPercent?: number;

  /**
   * Discount amount in currency
   * @example 1250
   */
  discountAmount?: number;

  /**
   * Price before discount was applied
   * @example 13750
   */
  priceBeforeDiscount?: number;

  // Express option info
  /**
   * Whether express option was selected
   * @example true
   */
  isExpress?: boolean;

  /**
   * Express multiplier applied
   * @example 1.5
   */
  expressMultiplier?: number;

  /**
   * Normal (non-express) price
   * @example 10000
   */
  normalPrice?: number;

  /**
   * Express price for comparison
   * @example 15000
   */
  expressPrice?: number;
}
