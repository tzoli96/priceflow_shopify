import { ShopModel } from '../models/shop.model';

export interface IShopRepository {
  findByDomain(domain: string): Promise<ShopModel | null>;
  findById(id: string): Promise<ShopModel | null>;
  save(shop: ShopModel): Promise<ShopModel>;
  update(shop: ShopModel): Promise<ShopModel>;
  delete(id: string): Promise<void>;
  findAll(limit?: number, offset?: number): Promise<ShopModel[]>;
}

export const SHOP_REPOSITORY = Symbol('IShopRepository');
