import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/database/prisma.service';
import { DraftOrderService } from './draft-order.service';
import { ShopifyService } from '../../auth/services/shopify.service';

@Injectable()
export class DraftOrderCronService {
  private readonly logger = new Logger('DraftOrderCron');

  constructor(
    private readonly prisma: PrismaService,
    private readonly draftOrderService: DraftOrderService,
    private readonly shopifyService: ShopifyService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async completePriceflowCartDraftOrders() {
    this.logger.log('Starting draft order completion cycle');

    const shops = await this.prisma.shop.findMany({
      where: { isActive: true },
    });

    this.logger.log(`Found ${shops.length} active shop(s)`);

    for (const shop of shops) {
      try {
        await this.processShop(shop.domain, shop.accessToken);
      } catch (error) {
        this.logger.error(
          `Error processing shop ${shop.domain}: ${error.message}`,
        );
      }
    }

    this.logger.log('Draft order completion cycle finished');
  }

  private async processShop(shopDomain: string, accessToken: string) {
    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    const response = await client.get({
      path: 'draft_orders',
      query: { status: 'open' },
    });

    const draftOrders: any[] = response.body.draft_orders || [];

    const cartOrders = draftOrders.filter((order) => {
      const tags = (order.tags || '').split(',').map((t: string) => t.trim());
      return tags.includes('priceflow-cart');
    });

    if (cartOrders.length === 0) {
      this.logger.log(`[${shopDomain}] No priceflow-cart draft orders found`);
      return;
    }

    this.logger.log(
      `[${shopDomain}] Found ${cartOrders.length} priceflow-cart draft order(s) to complete`,
    );

    for (const order of cartOrders) {
      try {
        const result = await this.draftOrderService.completeDraftOrder(
          shopDomain,
          accessToken,
          order.id.toString(),
        );
        this.logger.log(
          `[${shopDomain}] Completed draft order ${order.id} → order ${result.orderId}`,
        );
      } catch (error) {
        this.logger.error(
          `[${shopDomain}] Failed to complete draft order ${order.id}: ${error.message}`,
        );
      }
    }
  }
}
