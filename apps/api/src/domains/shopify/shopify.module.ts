import { Module } from '@nestjs/common';
import { ShopifyController } from './controllers/shopify.controller';
import { ProductFetcherService } from './services/product-fetcher.service';
import { AuthModule } from '../auth/auth.module';
import { ShopModule } from '../shop/shop.module';

/**
 * Shopify Module
 *
 * Felelősség: Shopify adatok lekérése (termékek, kollekciók, vendor-ek, tag-ek)
 *
 * Exports:
 * - ProductFetcherService - Más domain-ek is használhatják
 */
@Module({
  imports: [AuthModule, ShopModule],
  controllers: [ShopifyController],
  providers: [ProductFetcherService],
  exports: [ProductFetcherService],
})
export class ShopifyModule {}
