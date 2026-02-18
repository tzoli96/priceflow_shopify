import { ScopeType, FieldType } from '@prisma/client';

/**
 * Template Field Response DTO
 *
 * Field adatok API válaszban
 */
export class TemplateFieldResponseDto {
  id: string;
  templateId: string;
  sectionId: string | null;
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
  displayStyle: string | null;
  presetValues: any | null;
  iconUrl: string | null;
  unit: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromModel(field: any): TemplateFieldResponseDto {
    const dto = new TemplateFieldResponseDto();
    dto.id = field.id;
    dto.templateId = field.templateId;
    dto.sectionId = field.sectionId ?? null;
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
    dto.displayStyle = field.displayStyle ?? null;
    dto.presetValues = field.presetValues ?? null;
    dto.iconUrl = field.iconUrl ?? null;
    dto.unit = field.unit ?? null;
    dto.createdAt = field.createdAt;
    dto.updatedAt = field.updatedAt;
    return dto;
  }
}

/**
 * Template Section Response DTO
 */
export class TemplateSectionResponseDto {
  id: string;
  templateId: string;
  key: string;
  title: string;
  description: string | null;
  layoutType: string;
  columnsCount: number | null;
  collapsible: boolean;
  defaultOpen: boolean;
  showNumber: boolean;
  order: number;
  builtInType: string | null;
  presets: any | null;
  fields: TemplateFieldResponseDto[];

  static fromModel(section: any): TemplateSectionResponseDto {
    const dto = new TemplateSectionResponseDto();
    dto.id = section.id;
    dto.templateId = section.templateId;
    dto.key = section.key;
    dto.title = section.title;
    dto.description = section.description ?? null;
    dto.layoutType = section.layoutType;
    dto.columnsCount = section.columnsCount ?? null;
    dto.collapsible = section.collapsible ?? true;
    dto.defaultOpen = section.defaultOpen ?? true;
    dto.showNumber = section.showNumber ?? true;
    dto.order = section.order;
    dto.builtInType = section.builtInType ?? null;
    dto.presets = section.presets ?? null;
    dto.fields = section.fields
      ? section.fields.map((f: any) => TemplateFieldResponseDto.fromModel(f))
      : [];
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
  sections: TemplateSectionResponseDto[];
  createdAt: Date;
  updatedAt: Date;

  // Express option
  hasExpressOption: boolean;
  expressMultiplier: number | null;
  expressLabel: string | null;
  normalLabel: string | null;

  // Notes field
  hasNotesField: boolean;
  notesFieldLabel: string | null;
  notesFieldPlaceholder: string | null;

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
    dto.sections = template.sections
      ? template.sections.map((s: any) => TemplateSectionResponseDto.fromModel(s))
      : [];
    dto.createdAt = template.createdAt;
    dto.updatedAt = template.updatedAt;

    // Express option
    dto.hasExpressOption = template.hasExpressOption ?? false;
    dto.expressMultiplier = template.expressMultiplier ?? null;
    dto.expressLabel = template.expressLabel ?? null;
    dto.normalLabel = template.normalLabel ?? null;

    // Notes field
    dto.hasNotesField = template.hasNotesField ?? false;
    dto.notesFieldLabel = template.notesFieldLabel ?? null;
    dto.notesFieldPlaceholder = template.notesFieldPlaceholder ?? null;

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
