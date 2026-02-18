import {
  IsString,
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
import { ScopeType } from '@prisma/client';
import { CreateTemplateFieldDto, CreateTemplateSectionDto } from './create-template.dto';

/**
 * Update Template DTO
 *
 * Felelősség: Template frissítési kérés validálása
 *
 * Minden mező opcionális - csak a megadott mezők frissülnek
 *
 * Példa:
 * ```json
 * {
 *   "name": "Updated Banner Pricing",
 *   "description": "New description",
 *   "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price + setup_fee"
 * }
 * ```
 */
export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pricingFormula?: string;

  @IsOptional()
  pricingMeta?: any;

  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopeValues?: string[];

  // All fields are in sections
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateSectionDto)
  @IsOptional()
  sections?: CreateTemplateSectionDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Expressz gyártás opció
  @IsBoolean()
  @IsOptional()
  hasExpressOption?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  expressMultiplier?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  expressLabel?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  normalLabel?: string | null;

  // Megjegyzés mező
  @IsBoolean()
  @IsOptional()
  hasNotesField?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notesFieldLabel?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notesFieldPlaceholder?: string | null;
}
