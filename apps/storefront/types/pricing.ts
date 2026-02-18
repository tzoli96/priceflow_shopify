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
  | 'FILE'
  | 'PRODUCT_CARD' // Gazdag termék/anyag választó kártyákkal
  | 'DELIVERY_TIME' // Átfutási idő választó (név, leírás, ár)
  | 'EXTRAS' // Extrák választó (kép, cím, leírás, ár) - több választható
  | 'GRAPHIC_SELECT' // Grafika választó (feltöltöm / tervezést kérek)
  | 'QUANTITY_SELECTOR'; // Mennyiség választó (- / + gombok és presetek)

/**
 * Field option for SELECT/RADIO/PRODUCT_CARD fields
 */
export interface FieldOption {
  value: string;
  label: string;
  price?: number;
  imageUrl?: string; // Fő kép URL (S3 vagy külső)
  patternUrl?: string; // Minta/textúra kép URL (PRODUCT_CARD)
  badge?: string; // Címke/badge pl. "Legnépszerűbb" (PRODUCT_CARD)
  description?: string; // Hosszabb leírás
  htmlContent?: string; // HTML formázott tartalom (PRODUCT_CARD)
  features?: string[]; // Felsorolás pontok (bullet points)
  enableUpload?: boolean; // GRAPHIC_SELECT: Ha true, fájlfeltöltő jelenik meg
}

/**
 * Mező megjelenítési stílus
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
  columnsCount?: number;
  collapsible: boolean;
  defaultOpen: boolean;
  showNumber: boolean;
  order: number;
  builtInType?: BuiltInSectionType;
  fields: TemplateField[];
  presets?: PresetValue[]; // SPLIT layout: gyors értékválasztók
}

/**
 * Előre definiált érték (gyorsgombok)
 */
export interface PresetValue {
  label: string;
  value: number | string | Record<string, number>;
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
  displayStyle?: FieldDisplayStyle; // Megjelenítési stílus
  presetValues?: PresetValue[]; // Előre definiált értékek (gyorsgombok)
  unit?: string; // Mértékegység (pl. "cm") - NUMBER mezőhöz
  iconUrl?: string; // Ikon URL a label mellett
}

/**
 * Quantity preset type
 */
export type QuantityPreset = number | { label: string; value: number };

/**
 * Product template info from API
 */
export interface ProductTemplateInfo {
  hasTemplate: boolean;
  template?: {
    id: string;
    name: string;
    description?: string;
    // Szekciók (mezők a szekciókon belül vannak)
    sections: TemplateSection[];
    // Express option
    hasExpressOption: boolean;
    expressMultiplier?: number;
    expressLabel?: string;
    normalLabel?: string;
    // Notes field
    hasNotesField?: boolean;
    notesFieldLabel?: string;
    notesFieldPlaceholder?: string;
    // Quantity presets
    quantityPresets?: QuantityPreset[];
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
  productId: string;
  fieldValues: Record<string, number>;
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
