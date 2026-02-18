import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScopeType, FieldType } from '@prisma/client';

/**
 * Layout típusok
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
 * Template Section DTO
 *
 * Szekció létrehozásához szükséges adatok
 */
export class CreateTemplateSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  layoutType?: LayoutType = 'VERTICAL';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(6)
  columnsCount?: number;

  @IsBoolean()
  @IsOptional()
  collapsible?: boolean = true;

  @IsBoolean()
  @IsOptional()
  defaultOpen?: boolean = true;

  @IsBoolean()
  @IsOptional()
  showNumber?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number = 0;

  @IsString()
  @IsOptional()
  builtInType?: BuiltInSectionType;

  @IsArray()
  @IsOptional()
  presets?: { label: string; value: number | string | Record<string, number> }[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateFieldDto)
  @IsOptional()
  fields?: CreateTemplateFieldDto[] = [];
}

/**
 * Template Field DTO
 *
 * Field létrehozásához szükséges adatok
 */
export class CreateTemplateFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsEnum(FieldType)
  type: FieldType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean = false;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsString()
  @IsOptional()
  helpText?: string;

  @IsOptional()
  helpContent?: any;

  @IsOptional()
  validation?: any;

  @IsOptional()
  options?: any; // FieldOption[] - tartalmazza imageUrl, description, features mezőket is

  @IsOptional()
  conditionalRules?: any;

  @IsBoolean()
  @IsOptional()
  useInFormula?: boolean = true;

  @IsOptional()
  order?: number = 0;

  @IsString()
  @IsOptional()
  displayStyle?: string; // 'default' | 'card' | 'chip'

  @IsOptional()
  presetValues?: any; // PresetValue[] - előre definiált értékek

  @IsString()
  @IsOptional()
  iconUrl?: string; // Ikon URL a label mellett

  @IsString()
  @IsOptional()
  unit?: string; // Mértékegység (pl. "cm", "db", "m²")
}

/**
 * Create Template DTO
 *
 * Felelősség: Template létrehozási kérés validálása
 *
 * Validációk:
 * - name: kötelező, max 255 karakter
 * - description: opcionális
 * - pricingFormula: kötelező (formula szintaxis validálás a service-ben)
 * - scopeType: enum (PRODUCT, COLLECTION, VENDOR, TAG, GLOBAL)
 * - scopeValues: array (pl. product ID-k)
 * - fields: array of TemplateField DTO-k
 *
 * Példa:
 * ```json
 * {
 *   "name": "Banner Pricing",
 *   "description": "Calculate banner price based on dimensions",
 *   "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price",
 *   "scopeType": "GLOBAL",
 *   "scopeValues": [],
 *   "fields": [
 *     {
 *       "key": "width_cm",
 *       "type": "NUMBER",
 *       "label": "Width (cm)",
 *       "required": true,
 *       "useInFormula": true
 *     },
 *     {
 *       "key": "height_cm",
 *       "type": "NUMBER",
 *       "label": "Height (cm)",
 *       "required": true,
 *       "useInFormula": true
 *     },
 *     {
 *       "key": "unit_m2_price",
 *       "type": "NUMBER",
 *       "label": "Price per m²",
 *       "required": true,
 *       "useInFormula": true
 *     }
 *   ]
 * }
 * ```
 */
export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  pricingFormula: string;

  @IsOptional()
  pricingMeta?: any;

  @IsEnum(ScopeType)
  scopeType: ScopeType;

  @IsArray()
  @IsString({ each: true })
  scopeValues: string[];

  // All fields are in sections
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateSectionDto)
  @IsOptional()
  sections?: CreateTemplateSectionDto[] = [];

  // Expressz gyártás opció
  @IsBoolean()
  @IsOptional()
  hasExpressOption?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  expressMultiplier?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  expressLabel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  normalLabel?: string;

  // Megjegyzés mező
  @IsBoolean()
  @IsOptional()
  hasNotesField?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notesFieldLabel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notesFieldPlaceholder?: string;
}
