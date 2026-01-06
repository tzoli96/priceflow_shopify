import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { ShopifyService } from './services/shopify.service';
import { ShopModule } from '../shop/shop.module';

/**
 * Auth Module
 *
 * Felelősség: Shopify OAuth és authentication kezelése
 *
 * Exports:
 * - ShopifyService: Más modulok használhatják Shopify API hívásokhoz
 *
 * Imports:
 * - ShopModule: Shop service-hez való hozzáférés (session tárolás)
 */
@Module({
  imports: [ShopModule],
  controllers: [AuthController],
  providers: [ShopifyService],
  exports: [ShopifyService], // Más modulok is használhatják
})
export class AuthModule {}
