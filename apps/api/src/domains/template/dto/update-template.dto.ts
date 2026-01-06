import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScopeType } from '@prisma/client';
import { CreateTemplateFieldDto } from './create-template.dto';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateFieldDto)
  @IsOptional()
  fields?: CreateTemplateFieldDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
