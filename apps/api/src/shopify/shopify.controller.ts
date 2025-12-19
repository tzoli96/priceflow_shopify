import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Post('session')
  async storeSession(
    @Body()
    body: {
      shop: string;
      accessToken: string;
      scope?: string;
    },
  ) {
    return this.shopifyService.storeSession(
      body.shop,
      body.accessToken,
      body.scope,
    );
  }

  @Get('session/:shop')
  async getSession(@Param('shop') shop: string) {
    return this.shopifyService.getSession(shop);
  }
}
