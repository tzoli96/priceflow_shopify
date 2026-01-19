/**
 * Create Draft Order from Cart DTO
 *
 * Accepts the localStorage CartItem[] format directly
 */

import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsEmail,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Cart Item DTO - matches localStorage CartItem structure
 */
export class CartItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  variant_id: string;

  @IsNotEmpty()
  @IsString()
  product_title: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNotEmpty()
  @IsNumber()
  final_price: number;

  @IsNotEmpty()
  @IsNumber()
  final_line_price: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

/**
 * Create Draft Order from Cart Request DTO
 *
 * Payload matches localStorage "custom-cart-items" structure
 */
export class CreateFromCartDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

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
}
