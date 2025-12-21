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
}
