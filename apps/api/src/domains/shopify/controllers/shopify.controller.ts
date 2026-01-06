import { Controller, Get, Query, Inject, NotFoundException } from '@nestjs/common';
import { ProductFetcherService } from '../services/product-fetcher.service';
import { ProductResponseDto } from '../dto/product-response.dto';
import { CollectionResponseDto } from '../dto/collection-response.dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';

/**
 * Shopify Controller
 *
 * Felelősség: Shopify adatok lekérése REST API végpontokon keresztül
 *
 * Végpontok:
 * - GET /api/shopify/products - Termékek lekérése
 * - GET /api/shopify/collections - Kollekciók listája
 * - GET /api/shopify/vendors - Vendor-ek listája
 * - GET /api/shopify/tags - Tag-ek listája
 *
 * Multi-tenant security:
 * - ShopId from X-Shopify-Shop header (ShopHeaderGuard)
 */
@Controller('shopify')
export class ShopifyController {
  constructor(
    private readonly productFetcherService: ProductFetcherService,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
  ) {}

  /**
   * GET /api/shopify/products
   *
   * Termékek lekérése Shopify-ból (pagination support)
   *
   * Query params:
   * - pageInfo: Cursor az oldal lekérdezéséhez (opcionális)
   * - query: Keresési query (title-re szűr)
   * - collectionId: Szűrés kollekció ID alapján
   * - vendor: Szűrés vendor alapján
   *
   * Response: { products, pageInfo, hasNextPage, hasPreviousPage }
   */
  @Get('products')
  async getProducts(
    @ShopId() shopDomain: string,
    @Query('pageInfo') pageInfo?: string,
    @Query('query') query?: string,
    @Query('collectionId') collectionId?: string,
    @Query('vendor') vendor?: string,
  ): Promise<{
    products: ProductResponseDto[];
    pageInfo: { next: string | null; previous: string | null };
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const accessToken = await this.getAccessToken(shopDomain);

    const result = await this.productFetcherService.getProducts(
      shopDomain,
      accessToken,
      {
        pageInfo,
        query,
        collectionId,
        vendor,
      },
    );

    return {
      products: result.products.map((p) => ProductResponseDto.fromShopifyProduct(p)),
      pageInfo: result.pageInfo,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    };
  }

  /**
   * GET /api/shopify/collections
   *
   * Kollekciók lekérése (custom + smart)
   *
   * Response: CollectionResponseDto[]
   */
  @Get('collections')
  async getCollections(@ShopId() shopDomain: string): Promise<CollectionResponseDto[]> {
    const accessToken = await this.getAccessToken(shopDomain);

    const collections = await this.productFetcherService.getCollections(
      shopDomain,
      accessToken,
    );

    // Determine type based on collection structure
    return collections.map((c) => {
      const type = c.rules ? 'smart' : 'custom';
      return CollectionResponseDto.fromShopifyCollection(c, type);
    });
  }

  /**
   * GET /api/shopify/vendors
   *
   * Vendor-ek lekérése (unique lista)
   *
   * Response: string[]
   */
  @Get('vendors')
  async getVendors(@ShopId() shopDomain: string): Promise<string[]> {
    const accessToken = await this.getAccessToken(shopDomain);

    return this.productFetcherService.getVendors(shopDomain, accessToken);
  }

  /**
   * GET /api/shopify/tags
   *
   * Tag-ek lekérése (unique lista)
   *
   * Response: string[]
   */
  @Get('tags')
  async getTags(@ShopId() shopDomain: string): Promise<string[]> {
    const accessToken = await this.getAccessToken(shopDomain);

    return this.productFetcherService.getTags(shopDomain, accessToken);
  }

  /**
   * Helper: Access token lekérése shop domain alapján
   */
  private async getAccessToken(shopDomain: string): Promise<string> {
    const shop = await this.shopRepository.findByDomain(shopDomain);

    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    return shop.accessToken;
  }
}
