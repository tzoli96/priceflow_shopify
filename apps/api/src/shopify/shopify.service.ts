import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ShopifyService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  async storeSession(shop: string, accessToken: string, scope?: string) {
    const shopData = await this.shop.upsert({
      where: { domain: shop },
      update: {
        accessToken,
        scope,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        domain: shop,
        accessToken,
        scope,
        isActive: true,
      },
    });

    return {
      success: true,
      shop: shopData.domain,
      installedAt: shopData.installedAt,
    };
  }

  async getSession(shop: string) {
    const shopData = await this.shop.findUnique({
      where: { domain: shop },
    });

    if (!shopData) {
      return {
        success: false,
        error: 'Shop not found',
      };
    }

    return {
      success: true,
      shop: shopData.domain,
      isActive: shopData.isActive,
      installedAt: shopData.installedAt,
      // Don't return accessToken for security
    };
  }
}
