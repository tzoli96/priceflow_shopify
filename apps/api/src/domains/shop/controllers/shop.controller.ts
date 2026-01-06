import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShopService } from '../services/shop.service';
import { CreateShopSessionDto } from '../dto/create-shop-session.dto';
import { ShopResponseDto } from '../dto/shop-response.dto';

@Controller('shopify')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /**
   * POST /shopify/session
   * Store shop session
   */
  @Post('session')
  @HttpCode(HttpStatus.OK)
  async storeSession(
    @Body() dto: CreateShopSessionDto,
  ): Promise<ShopResponseDto> {
    return this.shopService.storeSession(dto);
  }

  /**
   * GET /shopify/session/:shop
   * Get shop session
   */
  @Get('session/:shop')
  async getSession(@Param('shop') shop: string): Promise<ShopResponseDto> {
    return this.shopService.getSession(shop);
  }

  /**
   * DELETE /shopify/session/:shop
   * Deactivate shop
   */
  @Delete('session/:shop')
  @HttpCode(HttpStatus.OK)
  async deactivateShop(
    @Param('shop') shop: string,
  ): Promise<ShopResponseDto> {
    return this.shopService.deactivateShop(shop);
  }

  /**
   * GET /shopify/status
   * Check if any shop exists in the database
   */
  @Get('status')
  async checkShopStatus(): Promise<{ hasShop: boolean; shopDomain?: string }> {
    return this.shopService.hasShops();
  }

  /**
   * GET /shopify/current
   * Get current shop domain from database (first shop)
   * Simple single-shop mode - no cookies, no localStorage
   */
  @Get('current')
  async getCurrentShop(): Promise<{ shop: string | null }> {
    const result = await this.shopService.hasShops();
    return {
      shop: result.shopDomain || null,
    };
  }

  /**
   * POST /shopify/dev-setup
   * Create a dev shop (development only)
   */
  @Post('dev-setup')
  @HttpCode(HttpStatus.CREATED)
  async createDevShop(): Promise<ShopResponseDto> {
    // Only allow dev shop creation in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.ALLOW_DEV_SETUP === 'true';

    if (!isDevelopment) {
      throw new Error('Dev shop creation is only allowed in development mode. Please use OAuth flow in production.');
    }

    return this.shopService.createDevShop();
  }
}
