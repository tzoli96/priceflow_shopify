import { Controller, Get, Query, Param, Inject, NotFoundException } from '@nestjs/common';
import { ProductFetcherService } from '../services/product-fetcher.service';
import { ProductResponseDto } from '../dto/product-response.dto';
import { CollectionResponseDto } from '../dto/collection-response.dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { ShopifyService } from '../../auth/services/shopify.service';

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
    private readonly shopifyService: ShopifyService,
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
   * GET /api/shopify/products/:id
   *
   * Get single product by ID
   *
   * @param shopDomain - Shop domain from header
   * @param id - Product ID (numeric or GID format)
   * @returns Single product details
   */
  @Get('products/:id')
  async getProduct(
    @ShopId() shopDomain: string,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    const accessToken = await this.getAccessToken(shopDomain);

    const client = this.shopifyService.getRestClient(shopDomain, accessToken);

    // Extract numeric ID from GID if needed
    const numericId = this.extractNumericId(id);

    try {
      const response = await client.get({
        path: `products/${numericId}`,
      });

      const product = response.body.product;

      return {
        id: product.id.toString(),
        title: product.title,
        vendor: product.vendor,
        productType: product.product_type,
        handle: product.handle,
        tags: product.tags ? product.tags.split(', ') : [],
        status: product.status,
        variants: product.variants.map((variant) => ({
          id: variant.id.toString(),
          title: variant.title,
          price: variant.price,
          sku: variant.sku || '',
          inventoryQuantity: variant.inventory_quantity || 0,
        })),
        images: product.images.map((image) => ({
          id: image.id.toString(),
          src: image.src,
          alt: image.alt || 'Product Image',
        })),
      };
    } catch (error) {
      throw new NotFoundException(`Product not found: ${id}`);
    }
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

  /**
   * Helper: Extract numeric ID from GID or return as-is
   *
   * Converts "gid://shopify/Product/123" to "123"
   * Returns "123" as-is if already numeric
   */
  private extractNumericId(id: string): string {
    if (id.startsWith('gid://')) {
      const parts = id.split('/');
      return parts[parts.length - 1];
    }
    return id;
  }
}
