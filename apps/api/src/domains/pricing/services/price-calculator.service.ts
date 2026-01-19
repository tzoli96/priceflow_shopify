import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { FormulaEvaluatorService } from './formula-evaluator.service';
import type { ITemplateRepository } from '../../template/repositories/template.repository.interface';
import { TEMPLATE_REPOSITORY } from '../../template/repositories/template.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import { TemplateModel } from '../../template/models/template.model';
import { TemplateFieldModel } from '../../template/models/template-field.model';

/**
 * Price breakdown item for display
 */
export interface PriceBreakdownItem {
  label: string;
  value: number;
  type: 'base' | 'calculation' | 'addon' | 'total';
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
  // Express option info
  isExpress?: boolean;
  expressMultiplier?: number;
  normalPrice?: number;
  expressPrice?: number;
}

/**
 * Express pricing info for product page
 */
export interface ExpressPricingInfo {
  hasExpressOption: boolean;
  normalPrice: number;
  normalLabel: string;
  expressPrice?: number;
  expressLabel?: string;
  expressMultiplier?: number;
}

/**
 * Calculation options
 */
export interface CalculationOptions {
  isExpress?: boolean;
}

/**
 * Quantity limits info
 */
export interface QuantityLimitsInfo {
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityMessage?: string;
  maxQuantityMessage?: string;
}

/**
 * Discount tier info for display
 */
export interface DiscountTierInfo {
  minQty: number;
  maxQty: number | null;
  discount: number;
}

/**
 * Template metadata for product
 */
export interface ProductTemplateInfo {
  hasTemplate: boolean;
  template?: {
    id: string;
    name: string;
    description?: string;
    fields: TemplateFieldDTO[];
    // Express option
    hasExpressOption: boolean;
    expressMultiplier?: number;
    expressLabel?: string;
    normalLabel?: string;
    // Quantity limits
    quantityLimits?: QuantityLimitsInfo;
    // Discount tiers
    discountTiers?: DiscountTierInfo[];
  };
}

/**
 * Template field DTO for API response
 */
export interface TemplateFieldDTO {
  key: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: any;
  options?: Array<{ value: string; label: string }>;
  useInFormula: boolean;
  order: number;
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

/**
 * Price Calculator Service
 *
 * Felelősség:
 * - Sablon keresése termékhez scope alapján
 * - Ár kalkuláció a sablon formulája alapján
 * - Breakdown generálása
 *
 * Scope prioritás (priority magas → alacsony):
 * 1. PRODUCT - Konkrét termékre szűkített
 * 2. COLLECTION - Kollekcióra szűkített
 * 3. VENDOR - Vendor-ra szűkített
 * 4. TAG - Tag-re szűkített
 * 5. GLOBAL - Minden termékre érvényes
 */
@Injectable()
export class PriceCalculatorService {
  constructor(
    private readonly formulaEvaluator: FormulaEvaluatorService,
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: ITemplateRepository,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
  ) {}

  /**
   * Helper: shopId lekérése domain alapján
   */
  private async getShopIdFromDomain(shopDomain: string): Promise<string> {
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }
    return shop.id;
  }

  /**
   * Sablon keresése termékhez
   *
   * Megkeresi az aktív sablont a scope matching alapján
   *
   * @param shopDomain - Shop domain
   * @param productId - Termék ID (Shopify product ID)
   * @param metadata - Termék metadata (vendor, tags, stb.)
   * @returns Template info object
   */
  async getTemplateForProduct(
    shopDomain: string,
    productId: string,
    metadata: ProductScopeMetadata = {},
  ): Promise<ProductTemplateInfo> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    // Get all active templates for shop
    const templates = await this.templateRepository.findByShop(shopId, {
      isActive: true,
    });

    if (templates.length === 0) {
      return { hasTemplate: false };
    }

    // Find matching template based on scope priority
    const matchingTemplate = this.findMatchingTemplate(
      templates,
      productId,
      metadata,
    );

    if (!matchingTemplate) {
      return { hasTemplate: false };
    }

    // Build quantity limits if any are set
    const quantityLimits: QuantityLimitsInfo | undefined =
      matchingTemplate.minQuantity ||
      matchingTemplate.maxQuantity ||
      matchingTemplate.minQuantityMessage ||
      matchingTemplate.maxQuantityMessage
        ? {
            minQuantity: matchingTemplate.minQuantity ?? undefined,
            maxQuantity: matchingTemplate.maxQuantity ?? undefined,
            minQuantityMessage:
              matchingTemplate.minQuantityMessage ?? undefined,
            maxQuantityMessage:
              matchingTemplate.maxQuantityMessage ?? undefined,
          }
        : undefined;

    return {
      hasTemplate: true,
      template: {
        id: matchingTemplate.id,
        name: matchingTemplate.name,
        description: matchingTemplate.description ?? undefined,
        fields: matchingTemplate.fields.map((f) => this.mapFieldToDTO(f)),
        // Express option
        hasExpressOption: matchingTemplate.hasExpressOption,
        expressMultiplier: matchingTemplate.expressMultiplier ?? undefined,
        expressLabel: matchingTemplate.expressLabel ?? undefined,
        normalLabel: matchingTemplate.normalLabel ?? undefined,
        // Quantity limits
        quantityLimits,
        // Discount tiers
        discountTiers: matchingTemplate.discountTiers ?? undefined,
      },
    };
  }

  /**
   * Ár kalkuláció
   *
   * @param shopDomain - Shop domain
   * @param templateId - Template ID
   * @param fieldValues - Mező értékek a felhasználótól
   * @param quantity - Mennyiség
   * @param basePrice - Termék alapára
   * @param options - Calculation options (isExpress, etc.)
   * @returns Calculation result
   */
  async calculatePrice(
    shopDomain: string,
    templateId: string,
    fieldValues: Record<string, number>,
    quantity: number,
    basePrice: number,
    options: CalculationOptions = {},
  ): Promise<PriceCalculationResult> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    // Get template
    const template = await this.templateRepository.findById(
      templateId,
      shopId,
    );

    if (!template) {
      throw new NotFoundException(`Template not found: ${templateId}`);
    }

    if (!template.isActive) {
      throw new NotFoundException(`Template is not active: ${templateId}`);
    }

    // Validate required fields
    this.validateRequiredFields(template.fields, fieldValues);

    // Prepare context with all variables
    const context = this.formulaEvaluator.prepareContext(
      fieldValues,
      basePrice,
      quantity,
    );

    // Evaluate formula - base_price is available as a variable in the formula
    // Example formula: "base_price + (width * height / 10000) * unit_m2_price"
    let unitPrice = this.formulaEvaluator.evaluateFormula(
      template.pricingFormula,
      context,
    );

    // Apply express multiplier if selected
    const isExpress = options.isExpress && template.hasExpressOption;
    const expressMultiplier = template.expressMultiplier || 1;
    const normalUnitPrice = unitPrice;

    if (isExpress && expressMultiplier > 1) {
      unitPrice = unitPrice * expressMultiplier;
    }

    // Calculate base total before discount
    let calculatedPrice = unitPrice * quantity;
    const priceBeforeDiscount = calculatedPrice;

    // Apply discount tier if applicable
    const discountPercent = this.calculateDiscountPercent(
      template.discountTiers,
      quantity,
    );
    let discountAmount = 0;

    if (discountPercent > 0) {
      discountAmount = calculatedPrice * (discountPercent / 100);
      calculatedPrice = calculatedPrice - discountAmount;
    }

    // Generate breakdown
    const breakdown = this.generateBreakdown(
      template,
      context,
      normalUnitPrice,
      quantity,
      basePrice,
      isExpress,
      expressMultiplier,
      discountPercent,
      discountAmount,
    );

    // Calculate normal and express prices for display
    const normalPrice = normalUnitPrice * quantity;
    const expressPrice = template.hasExpressOption
      ? normalUnitPrice * expressMultiplier * quantity
      : undefined;

    return {
      calculatedPrice,
      originalPrice: basePrice * quantity,
      breakdown,
      formattedPrice: this.formatPrice(calculatedPrice),
      currency: 'HUF', // TODO: Get from shop settings
      templateId: template.id,
      templateName: template.name,
      // Discount info
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      priceBeforeDiscount:
        discountPercent > 0 ? priceBeforeDiscount : undefined,
      // Express info
      isExpress,
      expressMultiplier: template.hasExpressOption
        ? expressMultiplier
        : undefined,
      normalPrice,
      expressPrice,
    };
  }

  /**
   * Calculate discount percent based on quantity and discount tiers
   */
  private calculateDiscountPercent(
    discountTiers: Array<{
      minQty: number;
      maxQty: number | null;
      discount: number;
    }> | null,
    quantity: number,
  ): number {
    if (!discountTiers || discountTiers.length === 0) {
      return 0;
    }

    // Sort tiers by minQty descending to find the highest applicable tier
    const sortedTiers = [...discountTiers].sort((a, b) => b.minQty - a.minQty);

    for (const tier of sortedTiers) {
      const meetsMin = quantity >= tier.minQty;
      const meetsMax = tier.maxQty === null || quantity <= tier.maxQty;

      if (meetsMin && meetsMax) {
        return tier.discount;
      }
    }

    return 0;
  }

  /**
   * Template matching scope prioritás alapján
   *
   * Scope priority (high → low):
   * 1. PRODUCT - Direct product match
   * 2. COLLECTION - Collection match
   * 3. VENDOR - Vendor match
   * 4. TAG - Tag match
   * 5. GLOBAL - Fallback
   */
  private findMatchingTemplate(
    templates: TemplateModel[],
    productId: string,
    metadata: ProductScopeMetadata,
  ): TemplateModel | null {
    // Sort by scope priority (custom)
    const scopePriority: Record<ScopeType, number> = {
      [ScopeType.PRODUCT]: 1,
      [ScopeType.COLLECTION]: 2,
      [ScopeType.VENDOR]: 3,
      [ScopeType.TAG]: 4,
      [ScopeType.GLOBAL]: 5,
    };

    // Find matching templates
    const matchingTemplates = templates.filter((template) => {
      switch (template.scopeType) {
        case ScopeType.PRODUCT:
          return template.scopeValues.includes(productId);

        case ScopeType.COLLECTION:
          return (
            metadata.collections &&
            template.scopeValues.some((v) =>
              metadata.collections!.includes(v),
            )
          );

        case ScopeType.VENDOR:
          return (
            metadata.vendor &&
            template.scopeValues.some(
              (v) => v.toLowerCase() === metadata.vendor!.toLowerCase(),
            )
          );

        case ScopeType.TAG:
          return (
            metadata.tags &&
            template.scopeValues.some((v) =>
              metadata.tags!.some(
                (t) => t.toLowerCase() === v.toLowerCase(),
              ),
            )
          );

        case ScopeType.GLOBAL:
          return true;

        default:
          return false;
      }
    });

    if (matchingTemplates.length === 0) {
      return null;
    }

    // Sort by scope priority and return first
    matchingTemplates.sort(
      (a, b) =>
        scopePriority[a.scopeType] - scopePriority[b.scopeType],
    );

    return matchingTemplates[0];
  }

  /**
   * Required field validáció
   */
  private validateRequiredFields(
    fields: TemplateFieldModel[],
    values: Record<string, number>,
  ): void {
    const requiredFields = fields.filter((f) => f.required);

    for (const field of requiredFields) {
      if (values[field.key] === undefined || values[field.key] === null) {
        throw new NotFoundException(
          `Required field missing: ${field.label} (${field.key})`,
        );
      }
    }
  }

  /**
   * Field to DTO mapping
   */
  private mapFieldToDTO(field: TemplateFieldModel): TemplateFieldDTO {
    return {
      key: field.key,
      type: field.type,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder || undefined,
      helpText: field.helpText || undefined,
      validation: field.validation,
      options: field.options,
      useInFormula: field.useInFormula,
      order: field.order,
    };
  }

  /**
   * Breakdown generálása megjelenítéshez
   */
  private generateBreakdown(
    template: TemplateModel,
    context: Record<string, number>,
    unitPrice: number,
    quantity: number,
    basePrice: number,
    isExpress: boolean = false,
    expressMultiplier: number = 1,
    discountPercent: number = 0,
    discountAmount: number = 0,
  ): PriceBreakdownItem[] {
    const breakdown: PriceBreakdownItem[] = [];

    // Original base price (for reference)
    breakdown.push({
      label: 'Termék alap ára',
      value: basePrice,
      type: 'base',
    });

    // Calculated unit price from formula
    breakdown.push({
      label: 'Számított egységár',
      value: unitPrice,
      type: 'calculation',
    });

    // Express surcharge
    if (isExpress && expressMultiplier > 1) {
      const expressUnitPrice = unitPrice * expressMultiplier;
      breakdown.push({
        label: `Expressz gyártás (×${expressMultiplier})`,
        value: expressUnitPrice,
        type: 'addon',
      });
    }

    // Subtotal before discount
    const effectiveUnitPrice = isExpress
      ? unitPrice * expressMultiplier
      : unitPrice;
    const subtotal = effectiveUnitPrice * quantity;

    // Quantity
    if (quantity > 1) {
      breakdown.push({
        label: `Mennyiség (${quantity} db)`,
        value: subtotal,
        type: 'addon',
      });
    }

    // Discount
    if (discountPercent > 0) {
      breakdown.push({
        label: `Mennyiségi kedvezmény (-${discountPercent}%)`,
        value: -discountAmount,
        type: 'addon',
      });
    }

    // Total
    const finalTotal = subtotal - discountAmount;
    breakdown.push({
      label: 'Végösszeg',
      value: finalTotal,
      type: 'total',
    });

    return breakdown;
  }

  /**
   * Ár formázása HUF-ban
   */
  private formatPrice(price: number, currency: string = 'HUF'): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
}
