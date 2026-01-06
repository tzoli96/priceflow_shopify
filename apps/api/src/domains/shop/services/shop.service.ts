import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SHOP_REPOSITORY } from '../repositories/shop.repository.interface';
import type { IShopRepository } from '../repositories/shop.repository.interface';
import { ShopModel } from '../models/shop.model';
import { CreateShopSessionDto } from '../dto/create-shop-session.dto';
import { ShopResponseDto } from '../dto/shop-response.dto';

@Injectable()
export class ShopService {
  constructor(
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
  ) {}

  /**
   * Store shop session (create or update)
   */
  async storeSession(
    dto: CreateShopSessionDto,
  ): Promise<ShopResponseDto> {
    try {
      // Check if shop already exists
      const existingShop = await this.shopRepository.findByDomain(dto.shop);

      if (existingShop) {
        // Update existing shop
        existingShop.updateAccessToken(dto.accessToken, dto.scope);
        existingShop.activate();

        const updated = await this.shopRepository.update(existingShop);

        return ShopResponseDto.success(
          updated.domain,
          updated.isActive,
          updated.installedAt,
        );
      }

      // Create new shop
      const newShop = ShopModel.create(dto.shop, dto.accessToken, dto.scope);
      const saved = await this.shopRepository.save(newShop);

      return ShopResponseDto.success(
        saved.domain,
        saved.isActive,
        saved.installedAt,
      );
    } catch (error) {
      return ShopResponseDto.error(
        error.message || 'Failed to store session',
      );
    }
  }

  /**
   * Find shop by domain
   */
  async findByDomain(shopDomain: string): Promise<ShopModel | null> {
    return this.shopRepository.findByDomain(shopDomain);
  }

  /**
   * Get shop session
   */
  async getSession(shopDomain: string): Promise<ShopResponseDto> {
    const shop = await this.shopRepository.findByDomain(shopDomain);

    if (!shop) {
      return ShopResponseDto.error('Shop not found');
    }

    return ShopResponseDto.success(
      shop.domain,
      shop.isActive,
      shop.installedAt,
    );
  }

  /**
   * Deactivate shop
   */
  async deactivateShop(shopDomain: string): Promise<ShopResponseDto> {
    const shop = await this.shopRepository.findByDomain(shopDomain);

    if (!shop) {
      throw new NotFoundException(`Shop ${shopDomain} not found`);
    }

    shop.deactivate();
    const updated = await this.shopRepository.update(shop);

    return ShopResponseDto.success(
      updated.domain,
      updated.isActive,
      updated.installedAt,
    );
  }

  /**
   * Check if any shop exists in the database
   */
  async hasShops(): Promise<{ hasShop: boolean; shopDomain?: string }> {
    const shops = await this.shopRepository.findAll(1);

    if (shops.length === 0) {
      return { hasShop: false };
    }

    return {
      hasShop: true,
      shopDomain: shops[0].domain,
    };
  }

  /**
   * Create a dev shop (only for development)
   */
  async createDevShop(shopDomain: string = 'dev-shop.myshopify.com'): Promise<ShopResponseDto> {
    // Check if shop already exists
    const existingShop = await this.shopRepository.findByDomain(shopDomain);

    if (existingShop) {
      return ShopResponseDto.success(
        existingShop.domain,
        existingShop.isActive,
        existingShop.installedAt,
      );
    }

    // Create dev shop
    const devShop = ShopModel.create(
      shopDomain,
      'dev_access_token_placeholder',
      'read_products,write_products,read_orders,read_customers',
    );

    const saved = await this.shopRepository.save(devShop);

    return ShopResponseDto.success(
      saved.domain,
      saved.isActive,
      saved.installedAt,
    );
  }
}
