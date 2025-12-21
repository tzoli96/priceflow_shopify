import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateShopSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Shop domain is required' })
  @Matches(/\.myshopify\.com$/, {
    message: 'Shop domain must be a valid Shopify domain (*.myshopify.com)',
  })
  shop: string;

  @IsString()
  @IsNotEmpty({ message: 'Access token is required' })
  accessToken: string;

  @IsString()
  @IsOptional()
  scope?: string;
}
