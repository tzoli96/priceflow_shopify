/**
 * Add Item to Draft Order DTO
 */

import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LineItemDto } from './create-draft-order.dto';

export class AddItemDto {
  @IsNotEmpty()
  @IsString()
  draftOrderId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LineItemDto)
  lineItem: LineItemDto;
}
