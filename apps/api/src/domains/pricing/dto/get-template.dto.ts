import { IsString, IsOptional, IsArray } from 'class-validator';

/**
 * Query DTO for GET /api/pricing/template/:productId
 *
 * @example
 * GET /api/pricing/template/12345?vendor=Molino&tags=banner,outdoor
 */
export class GetTemplateQueryDto {
  /**
   * Vendor name (optional)
   * Used for scope matching
   * @example "Molino"
   */
  @IsString()
  @IsOptional()
  vendor?: string;

  /**
   * Product tags, comma-separated (optional)
   * Used for scope matching
   * @example "banner,outdoor,vinyl"
   */
  @IsString()
  @IsOptional()
  tags?: string;

  /**
   * Product collection IDs, comma-separated (optional)
   * Used for scope matching
   * @example "col_123,col_456"
   */
  @IsString()
  @IsOptional()
  collections?: string;
}

/**
 * Response DTO for template field
 */
export class TemplateFieldResponseDto {
  key: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
  useInFormula: boolean;
  order: number;
}

/**
 * Quantity limits info for template
 */
export class QuantityLimitsDto {
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityMessage?: string;
  maxQuantityMessage?: string;
}

/**
 * Discount tier info for template
 */
export class DiscountTierDto {
  minQty: number;
  maxQty: number | null;
  discount: number;
}

/**
 * Response DTO for template info
 */
export class TemplateInfoResponseDto {
  id: string;
  name: string;
  description?: string;
  fields: TemplateFieldResponseDto[];

  // Express option
  hasExpressOption: boolean;
  expressMultiplier?: number;
  expressLabel?: string;
  normalLabel?: string;

  // Quantity limits
  quantityLimits?: QuantityLimitsDto;

  // Discount tiers
  discountTiers?: DiscountTierDto[];
}

/**
 * Response DTO for GET /api/pricing/template/:productId
 */
export class GetTemplateResponseDto {
  hasTemplate: boolean;
  template?: TemplateInfoResponseDto;
}
