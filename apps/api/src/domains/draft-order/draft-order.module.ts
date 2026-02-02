/**
 * Draft Order Module
 *
 * Handles Draft Orders creation and management
 * Based on Segment 2: Backend Draft Orders API PRD
 */

import { Module } from '@nestjs/common';
import { DraftOrderController } from './controllers/draft-order.controller';
import { DraftOrderService } from './services/draft-order.service';
import { DraftOrderCronService } from './services/draft-order-cron.service';
import { ShopModule } from '../shop/shop.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Draft Order Module
 *
 * Provides:
 * - Draft Order creation with custom pricing
 * - Multi-product Draft Orders
 * - Draft Order management (get, delete, complete)
 *
 * Imports:
 * - ShopModule: Shop repository access
 * - AuthModule: ShopifyService for Admin API access
 */
@Module({
  imports: [ShopModule, AuthModule],
  controllers: [DraftOrderController],
  providers: [DraftOrderService, DraftOrderCronService],
  exports: [DraftOrderService],
})
export class DraftOrderModule {}
