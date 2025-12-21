import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './domains/common/database/prisma.module';
import { ShopModule } from './domains/shop/shop.module';

@Module({
  imports: [
    PrismaModule, // Global Prisma module
    ShopModule,   // Shop domain
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
