/**
 * Create Draft Order DTO
 * Based on Segment 2: Backend Draft Orders API PRD
 */

import { IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Line Item DTO
 */
export class LineItemDto {
  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  originalPrice: string;

  @IsNotEmpty()
  @IsString()
  customPrice: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  variantTitle?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

/**
 * Create Draft Order Request DTO
 */
export class CreateDraftOrderDto {
  @IsNotEmpty()
  @IsString()
  shopDomain: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  useCustomerDefaultAddress?: boolean;
}
