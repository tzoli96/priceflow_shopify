import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ScopeType } from '@prisma/client';
import { FormulaEvaluatorService } from './formula-evaluator.service';
import type { ITemplateRepository } from '../../template/repositories/template.repository.interface';
import { TEMPLATE_REPOSITORY } from '../../template/repositories/template.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import { TemplateModel } from '../../template/models/template.model';
import { TemplateFieldModel } from '../../template/models/template-field.model';
import { TemplateSectionModel } from '../../template/models/template-section.model';

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
    // All fields are in sections
    sections: TemplateSectionDTO[];
    // Express option
    hasExpressOption: boolean;
    expressMultiplier?: number;
    expressLabel?: string;
    normalLabel?: string;
    // Quantity limits
    quantityLimits?: QuantityLimitsInfo;
    // Discount tiers
    discountTiers?: DiscountTierInfo[];
    // Notes field
    hasNotesField?: boolean;
    notesFieldLabel?: string;
    notesFieldPlaceholder?: string;
    // Quantity presets
    quantityPresets?: (number | { label: string; value: number })[];
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
  options?: Array<{
    value: string;
    label: string;
    price?: number;
    imageUrl?: string;
    description?: string;
    features?: string[];
  }>;
  useInFormula: boolean;
  order: number;
  displayStyle?: string;
  presetValues?: Array<{ label: string; value: number | string | Record<string, number> }>;
}

/**
 * Template section DTO for API response
 */
export interface TemplateSectionDTO {
  key: string;
  title: string;
  description?: string;
  layoutType: string;
  columnsCount?: number;
  collapsible: boolean;
  defaultOpen: boolean;
  showNumber: boolean;
  order: number;
  builtInType?: string;
  fields: TemplateFieldDTO[];
  presets?: Array<{ label: string; value: number | string | Record<string, number> }>;
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

    // Map sections (all fields are in sections)
    const sections = (matchingTemplate.sections || []).map((s) => this.mapSectionToDTO(s));

    return {
      hasTemplate: true,
      template: {
        id: matchingTemplate.id,
        name: matchingTemplate.name,
        description: matchingTemplate.description ?? undefined,
        // All fields are in sections
        sections,
        // Express option
        hasExpressOption: matchingTemplate.hasExpressOption,
        expressMultiplier: matchingTemplate.expressMultiplier ?? undefined,
        expressLabel: matchingTemplate.expressLabel ?? undefined,
        normalLabel: matchingTemplate.normalLabel ?? undefined,
        // Quantity limits
        quantityLimits,
        // Discount tiers
        discountTiers: matchingTemplate.discountTiers ?? undefined,
        // Notes field
        hasNotesField: matchingTemplate.hasNotesField ?? false,
        notesFieldLabel: matchingTemplate.notesFieldLabel ?? undefined,
        notesFieldPlaceholder: matchingTemplate.notesFieldPlaceholder ?? undefined,
        // Quantity presets
        quantityPresets: matchingTemplate.quantityPresets ?? undefined,
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
    fieldValues: Record<string, any>, // Can be number, string, or string[] (for EXTRAS)
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

    // Validate required fields (from both standalone and section fields)
    const allFields = this.getAllFields(template);
    this.validateRequiredFields(allFields, fieldValues);

    // Convert field values to numeric context (including _price for option fields)
    const numericFieldValues = this.convertFieldValuesToNumeric(allFields, fieldValues);

    // Check if there's a QUANTITY_SELECTOR field with useInFormula=true
    const hasQuantityField = allFields.some(
      field => field.type === 'QUANTITY_SELECTOR' && field.useInFormula
    );

    // Prepare context with all variables
    // Only include quantity if there's a QUANTITY_SELECTOR field
    const context = this.formulaEvaluator.prepareContext(
      numericFieldValues,
      basePrice,
      hasQuantityField ? quantity : undefined,
    );

    // Evaluate formula - base_price is available as a variable in the formula
    // Example formula: "base_price + (width * height / 10000) * unit_m2_price"
    let unitPrice = this.formulaEvaluator.evaluateFormula(
      template.pricingFormula,
      context,
    );

    // Auto-add option prices that are not explicitly used in formula
    // This ensures PRODUCT_CARD, DELIVERY_TIME, GRAPHIC_SELECT, EXTRAS prices are always included
    const optionPriceKeys = Object.keys(numericFieldValues).filter(key => key.endsWith('_price'));
    for (const priceKey of optionPriceKeys) {
      // Check if this price variable is NOT used in the formula
      if (!template.pricingFormula.includes(priceKey)) {
        const optionPrice = numericFieldValues[priceKey];
        if (typeof optionPrice === 'number' && optionPrice > 0) {
          unitPrice += optionPrice;
        }
      }
    }

    // Apply express multiplier if selected
    const isExpress = options.isExpress && template.hasExpressOption;
    const expressMultiplier = template.expressMultiplier || 1;
    const normalUnitPrice = unitPrice;

    if (isExpress && expressMultiplier > 1) {
      unitPrice = unitPrice * expressMultiplier;
    }

    // Formula result is already the total price (quantity can be used in formula)
    // No automatic multiplication by quantity
    let calculatedPrice = unitPrice;
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

    // Generate breakdown with field details
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
      allFields,
      fieldValues,
    );

    // Calculate normal and express prices for display
    // Formula already includes quantity, so no multiplication needed
    const normalPrice = normalUnitPrice;
    const expressPrice = template.hasExpressOption
      ? normalUnitPrice * expressMultiplier
      : undefined;

    return {
      calculatedPrice,
      originalPrice: basePrice,
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
    values: Record<string, any>,
  ): void {
    const requiredFields = fields.filter((f) => f.required);

    for (const field of requiredFields) {
      const value = values[field.key];

      // Check if value is missing or empty
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
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
      displayStyle: field.displayStyle || undefined,
      presetValues: field.presetValues || undefined,
    };
  }

  /**
   * Section to DTO mapping
   */
  private mapSectionToDTO(section: TemplateSectionModel): TemplateSectionDTO {
    return {
      key: section.key,
      title: section.title,
      description: section.description || undefined,
      layoutType: section.layoutType,
      columnsCount: section.columnsCount || undefined,
      collapsible: section.collapsible,
      defaultOpen: section.defaultOpen,
      showNumber: section.showNumber,
      order: section.order,
      builtInType: section.builtInType || undefined,
      fields: section.fields.map((f) => this.mapFieldToDTO(f)),
      presets: section.presets || undefined,
    };
  }

  /**
   * Get all fields from template sections
   * Fields are ONLY in sections, not at top level
   */
  private getAllFields(template: TemplateModel): TemplateFieldModel[] {
    return (template.sections || []).flatMap((s) => s.fields || []);
  }

  /**
   * Convert field values to numeric context
   * - NUMBER fields: use value directly
   * - PRODUCT_CARD, DELIVERY_TIME: add {key}_price with selected option's price
   * - EXTRAS: add {key}_price with sum of selected options' prices
   */
  private convertFieldValuesToNumeric(
    fields: TemplateFieldModel[],
    fieldValues: Record<string, any>,
  ): Record<string, number> {
    const result: Record<string, number> = {};

    for (const field of fields) {
      const value = fieldValues[field.key];

      if (value === undefined || value === null) {
        continue;
      }

      switch (field.type) {
        case 'NUMBER':
          // Direct numeric value
          result[field.key] = typeof value === 'number' ? value : Number(value) || 0;
          break;

        case 'PRODUCT_CARD':
        case 'DELIVERY_TIME':
        case 'GRAPHIC_SELECT':
          // Single selection - find option price
          if (field.options && typeof value === 'string') {
            const selectedOption = field.options.find((opt: any) => opt.value === value);
            result[`${field.key}_price`] = selectedOption?.price ?? 0;
          } else {
            result[`${field.key}_price`] = 0;
          }
          break;

        case 'EXTRAS':
          // Multiple selection - sum of selected options' prices
          if (field.options && Array.isArray(value)) {
            const totalPrice = value.reduce((sum: number, selectedValue: string) => {
              const option = field.options?.find((opt: any) => opt.value === selectedValue);
              return sum + (option?.price ?? 0);
            }, 0);
            result[`${field.key}_price`] = totalPrice;
          } else {
            result[`${field.key}_price`] = 0;
          }
          break;

        case 'SELECT':
        case 'RADIO':
          // SELECT/RADIO can also have price options
          if (field.options && typeof value === 'string') {
            const selectedOption = field.options.find((opt: any) => opt.value === value);
            if (selectedOption?.price !== undefined) {
              result[`${field.key}_price`] = selectedOption.price;
            }
          }
          break;

        default:
          // Other fields are not used in formula
          break;
      }
    }

    return result;
  }

  /**
   * Breakdown generálása megjelenítéshez
   * Részletes lista: mi mennyibe kerül
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
    allFields: TemplateFieldModel[] = [],
    fieldValues: Record<string, any> = {},
  ): PriceBreakdownItem[] {
    const breakdown: PriceBreakdownItem[] = [];

    // 1. Termék alap ára
    breakdown.push({
      label: 'Termék alap ára',
      value: basePrice,
      type: 'base',
    });

    // 2. Egyedi mező árak (opciók árai)
    for (const field of allFields) {
      const value = fieldValues[field.key];
      if (value === undefined || value === null) continue;

      // Opció alapú mezők ára
      if (
        (field.type === 'PRODUCT_CARD' ||
          field.type === 'DELIVERY_TIME' ||
          field.type === 'GRAPHIC_SELECT' ||
          field.type === 'SELECT' ||
          field.type === 'RADIO') &&
        field.options
      ) {
        const selectedOption = field.options.find((opt: any) => opt.value === value);
        if (selectedOption?.price && selectedOption.price > 0) {
          breakdown.push({
            label: `${field.label}: ${selectedOption.label}`,
            value: selectedOption.price,
            type: 'addon',
          });
        }
      }

      // EXTRAS - többszörös választás
      if (field.type === 'EXTRAS' && field.options && Array.isArray(value)) {
        for (const selectedValue of value) {
          const option = field.options.find((opt: any) => opt.value === selectedValue);
          if (option?.price && option.price > 0) {
            breakdown.push({
              label: `${option.label}`,
              value: option.price,
              type: 'addon',
            });
          }
        }
      }
    }

    // 3. Számított egységár (formula eredménye - opcionális megjelenítés)
    // Ha az egységár különbözik az alap ár + opciók összegétől, mutatjuk
    const optionPricesSum = breakdown
      .filter(item => item.type === 'addon')
      .reduce((sum, item) => sum + item.value, 0);

    if (Math.abs(unitPrice - (basePrice + optionPricesSum)) > 0.01) {
      // Van formula-alapú számítás is (pl. négyzetméter alapján)
      breakdown.push({
        label: 'Számított egységár',
        value: unitPrice,
        type: 'calculation',
      });
    }

    // 4. Expressz felár
    if (isExpress && expressMultiplier > 1) {
      const expressSurcharge = unitPrice * (expressMultiplier - 1);
      breakdown.push({
        label: `Expressz gyártás (+${Math.round((expressMultiplier - 1) * 100)}%)`,
        value: expressSurcharge,
        type: 'addon',
      });
    }

    // 5. Részösszeg (formula már tartalmazza a mennyiséget)
    const effectiveUnitPrice = isExpress
      ? unitPrice * expressMultiplier
      : unitPrice;

    // 6. Mennyiség - már a formulában szerepel, nem kell külön megjeleníteni

    // 7. Mennyiségi kedvezmény
    if (discountPercent > 0) {
      breakdown.push({
        label: `Mennyiségi kedvezmény (-${discountPercent}%)`,
        value: -discountAmount,
        type: 'addon',
      });
    }

    // 8. Végösszeg
    const subtotal = effectiveUnitPrice;
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
