/**
 * Template TypeScript Types
 *
 * Corresponding to backend DTOs and models
 */

export enum ScopeType {
  PRODUCT = 'PRODUCT',
  COLLECTION = 'COLLECTION',
  VENDOR = 'VENDOR',
  TAG = 'TAG',
  GLOBAL = 'GLOBAL',
}

export enum FieldType {
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
  SELECT = 'SELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  TEXTAREA = 'TEXTAREA',
  FILE = 'FILE',
}

/**
 * Opció típus SELECT/RADIO mezőkhöz árral
 */
export interface FieldOption {
  label: string;
  value: string;
  price?: number; // Felár, ha van
}

/**
 * Feltételes megjelenés szabály
 */
export interface ConditionalRule {
  field: string; // Másik mező kulcsa
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in';
  value: string | number | boolean | string[];
}

/**
 * Mező validációs szabályok
 */
export interface FieldValidation {
  min?: number;
  max?: number;
  step?: number; // NUMBER mezőhöz lépésköz
  pattern?: string;
  options?: string[]; // Legacy - egyszerű string lista
}

/**
 * Help content struktúra képekkel
 */
export interface HelpContent {
  text?: string;
  images?: string[]; // S3 URL-ek
  video?: string; // YouTube/Vimeo URL
}

export interface TemplateField {
  id?: string;
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string; // Rövid segítő szöveg
  helpContent?: HelpContent; // Részletes help képekkel
  validation?: FieldValidation;
  options?: FieldOption[]; // SELECT/RADIO opciók árral
  conditionalRules?: {
    showIf?: ConditionalRule;
  };
  useInFormula: boolean; // Képletben használt-e (árhatás)
  order: number; // Megjelenítési sorrend
}

/**
 * Sávos kedvezmény tier
 */
export interface DiscountTier {
  minQty: number;
  maxQty: number | null; // null = végtelen
  discount: number; // Százalék
}

export interface Template {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  pricingFormula: string;
  pricingMeta?: {
    variables?: string[];
    [key: string]: any;
  };
  scopeType: ScopeType;
  scopeValues: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields: TemplateField[];

  // Min/Max rendelési mennyiség
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityMessage?: string; // "Minimum 5 db rendelhető"
  maxQuantityMessage?: string; // "Maximum 100 db, nagyobb mennyiséghez kérj ajánlatot"

  // Sávos kedvezmények
  discountTiers?: DiscountTier[];

  // Expressz gyártás opció
  hasExpressOption?: boolean;
  expressMultiplier?: number; // pl. 1.5 = +50%
  expressLabel?: string; // "Expressz (3 munkanap)"
  normalLabel?: string; // "Normál (7-10 munkanap)"
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  pricingFormula: string;
  scopeType?: ScopeType;
  scopeValues?: string[];
  fields: Omit<TemplateField, 'id'>[];

  // Opcionális mezők
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityMessage?: string;
  maxQuantityMessage?: string;
  discountTiers?: DiscountTier[];
  hasExpressOption?: boolean;
  expressMultiplier?: number;
  expressLabel?: string;
  normalLabel?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  pricingFormula?: string;
  scopeType?: ScopeType;
  scopeValues?: string[];
  fields?: Omit<TemplateField, 'id'>[];

  // Opcionális mezők
  minQuantity?: number | null;
  maxQuantity?: number | null;
  minQuantityMessage?: string | null;
  maxQuantityMessage?: string | null;
  discountTiers?: DiscountTier[] | null;
  hasExpressOption?: boolean;
  expressMultiplier?: number | null;
  expressLabel?: string | null;
  normalLabel?: string | null;
}

export interface TemplateListResponse {
  data: Template[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TemplateListFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface FormulaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  variables?: string[];
}
