import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './domains/common/database/prisma.module';
import { ShopModule } from './domains/shop/shop.module';
import { AuthModule } from './domains/auth/auth.module';
import { TemplateModule } from './domains/template/template.module';
import { ShopifyModule } from './domains/shopify/shopify.module';
import { AssignmentModule } from './domains/assignment/assignment.module';
import { DraftOrderModule } from './domains/draft-order/draft-order.module';
import { ShopHeaderInterceptor } from './domains/common/interceptors/shop-header.interceptor';

@Module({
  imports: [
    PrismaModule,     // Global Prisma module
    ShopModule,       // Shop domain
    AuthModule,       // Auth domain (Shopify OAuth)
    TemplateModule,   // Template domain
    ShopifyModule,    // Shopify integration (products, collections, etc.)
    AssignmentModule, // Assignment domain (template assignments)
    DraftOrderModule, // Draft Orders (custom pricing)
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ShopHeaderInterceptor, // Global shop header validation
    },
  ],
})
export class AppModule {}
