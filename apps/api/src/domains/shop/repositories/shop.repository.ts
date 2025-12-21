import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { IShopRepository } from './shop.repository.interface';
import { ShopModel } from '../models/shop.model';

@Injectable()
export class ShopRepository implements IShopRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDomain(domain: string): Promise<ShopModel | null> {
    const shop = await this.prisma.shop.findUnique({
      where: { domain },
    });

    return shop ? ShopModel.fromPersistence(shop) : null;
  }

  async findById(id: string): Promise<ShopModel | null> {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });

    return shop ? ShopModel.fromPersistence(shop) : null;
  }

  async save(shop: ShopModel): Promise<ShopModel> {
    const created = await this.prisma.shop.create({
      data: shop.toPersistence(),
    });

    return ShopModel.fromPersistence(created);
  }

  async update(shop: ShopModel): Promise<ShopModel> {
    const updated = await this.prisma.shop.update({
      where: { id: shop.id },
      data: shop.toPersistence(),
    });

    return ShopModel.fromPersistence(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shop.delete({
      where: { id },
    });
  }

  async findAll(limit = 100, offset = 0): Promise<ShopModel[]> {
    const shops = await this.prisma.shop.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return shops.map((shop) => ShopModel.fromPersistence(shop));
  }
}
