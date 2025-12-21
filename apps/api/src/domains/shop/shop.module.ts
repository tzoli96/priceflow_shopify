import { Module } from '@nestjs/common';
import { ShopController } from './controllers/shop.controller';
import { ShopService } from './services/shop.service';
import { ShopRepository } from './repositories/shop.repository';
import { SHOP_REPOSITORY } from './repositories/shop.repository.interface';

@Module({
  controllers: [ShopController],
  providers: [
    ShopService,
    {
      provide: SHOP_REPOSITORY,
      useClass: ShopRepository,
    },
  ],
  exports: [ShopService, SHOP_REPOSITORY],
})
export class ShopModule {}
