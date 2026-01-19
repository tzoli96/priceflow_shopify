import { ScopeType, FieldType } from '@prisma/client';

/**
 * Template Field Response DTO
 *
 * Field adatok API válaszban
 */
export class TemplateFieldResponseDto {
  id: string;
  templateId: string;
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  helpContent: any | null;
  validation: any | null;
  options: any | null;
  conditionalRules: any | null;
  useInFormula: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  static fromModel(field: any): TemplateFieldResponseDto {
    const dto = new TemplateFieldResponseDto();
    dto.id = field.id;
    dto.templateId = field.templateId;
    dto.key = field.key;
    dto.type = field.type;
    dto.label = field.label;
    dto.required = field.required;
    dto.placeholder = field.placeholder;
    dto.helpText = field.helpText;
    dto.helpContent = field.helpContent;
    dto.validation = field.validation;
    dto.options = field.options;
    dto.conditionalRules = field.conditionalRules;
    dto.useInFormula = field.useInFormula;
    dto.order = field.order;
    dto.createdAt = field.createdAt;
    dto.updatedAt = field.updatedAt;
    return dto;
  }
}

/**
 * Template Response DTO
 *
 * Felelősség: Template adatok strukturált visszaadása API válaszban
 *
 * Tartalmazza:
 * - Template alapadatok
 * - Field-ek listája
 * - Metadata (createdAt, updatedAt)
 *
 * Példa válasz:
 * ```json
 * {
 *   "id": "uuid-123",
 *   "shopId": "uuid-shop",
 *   "name": "Banner Pricing",
 *   "description": "Calculate banner price",
 *   "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price",
 *   "scopeType": "GLOBAL",
 *   "scopeValues": [],
 *   "isActive": true,
 *   "fields": [
 *     {
 *       "id": "uuid-field-1",
 *       "key": "width_cm",
 *       "type": "NUMBER",
 *       "label": "Width (cm)",
 *       "required": true,
 *       "useInFormula": true,
 *       "order": 0
 *     }
 *   ],
 *   "createdAt": "2025-12-28T12:00:00Z",
 *   "updatedAt": "2025-12-28T12:00:00Z"
 * }
 * ```
 */
/**
 * Discount tier response DTO
 */
export interface DiscountTierResponseDto {
  minQty: number;
  maxQty: number | null;
  discount: number;
}

export class TemplateResponseDto {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  pricingFormula: string;
  pricingMeta: any | null;
  scopeType: ScopeType;
  scopeValues: string[];
  isActive: boolean;
  fields: TemplateFieldResponseDto[];
  createdAt: Date;
  updatedAt: Date;

  // Quantity limits
  minQuantity: number | null;
  maxQuantity: number | null;
  minQuantityMessage: string | null;
  maxQuantityMessage: string | null;

  // Discount tiers
  discountTiers: DiscountTierResponseDto[] | null;

  // Express option
  hasExpressOption: boolean;
  expressMultiplier: number | null;
  expressLabel: string | null;
  normalLabel: string | null;

  /**
   * Domain model-ből DTO létrehozása
   */
  static fromModel(template: any): TemplateResponseDto {
    const dto = new TemplateResponseDto();
    dto.id = template.id;
    dto.shopId = template.shopId;
    dto.name = template.name;
    dto.description = template.description;
    dto.pricingFormula = template.pricingFormula;
    dto.pricingMeta = template.pricingMeta;
    dto.scopeType = template.scopeType;
    dto.scopeValues = template.scopeValues;
    dto.isActive = template.isActive;
    dto.fields = template.fields
      ? template.fields.map((f: any) => TemplateFieldResponseDto.fromModel(f))
      : [];
    dto.createdAt = template.createdAt;
    dto.updatedAt = template.updatedAt;

    // Quantity limits
    dto.minQuantity = template.minQuantity ?? null;
    dto.maxQuantity = template.maxQuantity ?? null;
    dto.minQuantityMessage = template.minQuantityMessage ?? null;
    dto.maxQuantityMessage = template.maxQuantityMessage ?? null;

    // Discount tiers
    dto.discountTiers = template.discountTiers ?? null;

    // Express option
    dto.hasExpressOption = template.hasExpressOption ?? false;
    dto.expressMultiplier = template.expressMultiplier ?? null;
    dto.expressLabel = template.expressLabel ?? null;
    dto.normalLabel = template.normalLabel ?? null;

    return dto;
  }

  /**
   * Lista formátumú válasz
   */
  static fromModelList(templates: any[]): TemplateResponseDto[] {
    return templates.map((t) => TemplateResponseDto.fromModel(t));
  }
}

/**
 * Template List Response DTO
 *
 * Paginated lista válasz
 */
export class TemplateListResponseDto {
  data: TemplateResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;

  static create(
    templates: any[],
    total: number,
    page: number,
    limit: number,
  ): TemplateListResponseDto {
    const dto = new TemplateListResponseDto();
    dto.data = TemplateResponseDto.fromModelList(templates);
    dto.total = total;
    dto.page = page;
    dto.limit = limit;
    dto.hasMore = page * limit < total;
    return dto;
  }
}
