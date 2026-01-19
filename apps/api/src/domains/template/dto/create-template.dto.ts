import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScopeType, FieldType } from '@prisma/client';

/**
 * Sávos kedvezmény DTO
 */
export class DiscountTierDto {
  @IsNumber()
  @Min(1)
  minQty: number;

  @IsNumber()
  @IsOptional()
  maxQty?: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;
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
  options?: any;

  @IsOptional()
  conditionalRules?: any;

  @IsBoolean()
  @IsOptional()
  useInFormula?: boolean = true;

  @IsOptional()
  order?: number = 0;
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateFieldDto)
  @IsOptional()
  fields?: CreateTemplateFieldDto[] = [];

  // Min/Max rendelési mennyiség
  @IsNumber()
  @IsOptional()
  @Min(1)
  minQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxQuantity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  minQuantityMessage?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  maxQuantityMessage?: string;

  // Sávos kedvezmények
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountTierDto)
  @IsOptional()
  discountTiers?: DiscountTierDto[];

  // Expressz gyártás
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
}
