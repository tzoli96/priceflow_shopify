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
  PRODUCT_CARD = 'PRODUCT_CARD', // Gazdag termék/anyag választó kártyákkal
  DELIVERY_TIME = 'DELIVERY_TIME', // Átfutási idő választó (név, leírás, ár)
  EXTRAS = 'EXTRAS', // Extrák választó (kép, cím, leírás, ár) - több választható
  GRAPHIC_SELECT = 'GRAPHIC_SELECT', // Grafika választó (feltöltöm / tervezést kérek)
}

/**
 * Opció típus SELECT/RADIO/PRODUCT_CARD mezőkhöz
 */
export interface FieldOption {
  label: string;
  value: string;
  price?: number; // Felár, ha van
  imageUrl?: string; // Fő kép URL (S3 vagy külső)
  patternUrl?: string; // Minta/textúra kép URL (PRODUCT_CARD)
  badge?: string; // Címke/badge pl. "Legnépszerűbb" (PRODUCT_CARD)
  description?: string; // Hosszabb leírás
  htmlContent?: string; // HTML formázott tartalom (PRODUCT_CARD)
  features?: string[]; // Felsorolás pontok (bullet points)
  enableUpload?: boolean; // GRAPHIC_SELECT: Ha true, fájlfeltöltő jelenik meg storefront-on
}

/**
 * Mező megjelenítési stílus
 * - default: Alapértelmezett (dropdown/radio)
 * - card: Kártyás megjelenítés képekkel
 * - chip: Gyorsgombok (chips)
 */
export type FieldDisplayStyle = 'default' | 'card' | 'chip';

/**
 * Szekció layout típusok
 * - VERTICAL: Mezők egymás alatt (alapértelmezett)
 * - HORIZONTAL: Mezők egymás mellett
 * - GRID: Kártya rács (SELECT/RADIO card megjelenítés)
 * - SPLIT: Bal: inputok, Jobb: presetek (méret választó)
 * - CHECKBOX_LIST: Checkbox kártyák leírással (extrák)
 */
export type LayoutType =
  | 'VERTICAL'
  | 'HORIZONTAL'
  | 'GRID'
  | 'SPLIT'
  | 'CHECKBOX_LIST';

/**
 * Built-in szekció típusok
 * - SIZE: Méret választó (width/height)
 * - QUANTITY: Mennyiség választó
 * - EXPRESS: Expressz/normál választó
 * - NOTES: Megjegyzés mező
 * - FILE_UPLOAD: Fájl feltöltés
 */
export type BuiltInSectionType =
  | 'SIZE'
  | 'QUANTITY'
  | 'EXPRESS'
  | 'NOTES'
  | 'FILE_UPLOAD';

/**
 * Template szekció
 */
export interface TemplateSection {
  id?: string;
  key: string;
  title: string;
  description?: string;
  layoutType: LayoutType;
  columnsCount?: number; // GRID esetén: 2, 3, 4
  collapsible: boolean;
  defaultOpen: boolean;
  showNumber: boolean;
  order: number;
  builtInType?: BuiltInSectionType;
  fields: TemplateField[];
  presets?: PresetValue[]; // SPLIT layout esetén: gyors értékválasztók
}

/**
 * Előre definiált érték (gyorsgombok)
 */
export interface PresetValue {
  label: string; // Megjelenítendő szöveg (pl. "100 x 50 cm")
  value: number | string | Record<string, number>; // Érték vagy összetett érték
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
  displayStyle?: FieldDisplayStyle; // Megjelenítési stílus (default/card/chip)
  presetValues?: PresetValue[]; // Előre definiált értékek (gyorsgombok)
  unit?: string; // Mértékegység (pl. "cm", "db", "m²") - NUMBER mezőhöz
  iconUrl?: string; // Ikon URL a label mellett
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

  // All fields are in sections
  sections: TemplateSection[];

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

  // Megjegyzés mező
  hasNotesField?: boolean;
  notesFieldLabel?: string; // "Megjegyzés"
  notesFieldPlaceholder?: string; // "Írja ide az egyedi kéréseit..."

  // Mennyiség gyorsgombok
  quantityPresets?: (number | { label: string; value: number })[];
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  pricingFormula: string;
  scopeType?: ScopeType;
  scopeValues?: string[];
  sections: Omit<TemplateSection, 'id'>[];

  // Opcionális mezők
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityMessage?: string;
  maxQuantityMessage?: string;
  discountTiers?: DiscountTier[];

  // Megjegyzés mező
  hasNotesField?: boolean;
  notesFieldLabel?: string;
  notesFieldPlaceholder?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  pricingFormula?: string;
  scopeType?: ScopeType;
  scopeValues?: string[];
  sections?: Omit<TemplateSection, 'id'>[];

  // Opcionális mezők
  minQuantity?: number | null;
  maxQuantity?: number | null;
  minQuantityMessage?: string | null;
  maxQuantityMessage?: string | null;
  discountTiers?: DiscountTier[] | null;

  // Megjegyzés mező
  hasNotesField?: boolean;
  notesFieldLabel?: string | null;
  notesFieldPlaceholder?: string | null;
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
