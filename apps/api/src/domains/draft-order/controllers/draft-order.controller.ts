/**
 * Draft Order Controller
 *
 * REST API endpoints for Draft Orders management
 * Based on Segment 2: Backend Draft Orders API PRD
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { DraftOrderService } from '../services/draft-order.service';
import { CreateDraftOrderDto } from '../dto/create-draft-order.dto';
import { AddItemDto } from '../dto/add-item.dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';

/**
 * Draft Order Controller
 *
 * Endpoints:
 * - POST /api/draft-orders/create - Create new Draft Order
 * - POST /api/draft-orders/:id/add-item - Add item to existing Draft Order
 * - GET /api/draft-orders/:id - Get Draft Order by ID
 * - DELETE /api/draft-orders/:id - Delete Draft Order
 * - POST /api/draft-orders/:id/complete - Complete Draft Order
 */
@Controller('draft-orders')
export class DraftOrderController {
  constructor(
    private readonly draftOrderService: DraftOrderService,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
  ) {}

  /**
   * POST /api/draft-orders/create
   *
   * Create a new Draft Order with custom pricing
   *
   * @param shopDomain - Shop domain from X-Shopify-Shop header
   * @param createDto - Draft Order creation data
   * @returns Created Draft Order with invoice URL
   */
  @Post('create')
  async createDraftOrder(
    @ShopId() shopDomain: string,
    @Body() createDto: CreateDraftOrderDto,
  ) {
    const accessToken = await this.getAccessToken(shopDomain);

    return this.draftOrderService.createDraftOrder(
      shopDomain,
      accessToken,
      createDto,
    );
  }

  /**
   * POST /api/draft-orders/:id/add-item
   *
   * Add an item to existing Draft Order
   *
   * @param shopDomain - Shop domain from header
   * @param id - Draft Order ID
   * @param addItemDto - Item to add
   * @returns Updated Draft Order
   */
  @Post(':id/add-item')
  async addItem(
    @ShopId() shopDomain: string,
    @Param('id') id: string,
    @Body() addItemDto: AddItemDto,
  ) {
    const accessToken = await this.getAccessToken(shopDomain);

    return this.draftOrderService.addItemToDraftOrder(
      shopDomain,
      accessToken,
      id,
      addItemDto,
    );
  }

  /**
   * GET /api/draft-orders/:id
   *
   * Get Draft Order by ID
   *
   * @param shopDomain - Shop domain from header
   * @param id - Draft Order ID
   * @returns Draft Order details
   */
  @Get(':id')
  async getDraftOrder(
    @ShopId() shopDomain: string,
    @Param('id') id: string,
  ) {
    const accessToken = await this.getAccessToken(shopDomain);

    return this.draftOrderService.getDraftOrder(
      shopDomain,
      accessToken,
      id,
    );
  }

  /**
   * DELETE /api/draft-orders/:id
   *
   * Delete Draft Order
   *
   * @param shopDomain - Shop domain from header
   * @param id - Draft Order ID
   */
  @Delete(':id')
  async deleteDraftOrder(
    @ShopId() shopDomain: string,
    @Param('id') id: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken(shopDomain);

    await this.draftOrderService.deleteDraftOrder(
      shopDomain,
      accessToken,
      id,
    );
  }

  /**
   * POST /api/draft-orders/:id/complete
   *
   * Complete Draft Order (convert to order)
   *
   * @param shopDomain - Shop domain from header
   * @param id - Draft Order ID
   * @returns Completed Draft Order
   */
  @Post(':id/complete')
  async completeDraftOrder(
    @ShopId() shopDomain: string,
    @Param('id') id: string,
  ) {
    const accessToken = await this.getAccessToken(shopDomain);

    return this.draftOrderService.completeDraftOrder(
      shopDomain,
      accessToken,
      id,
    );
  }

  /**
   * Helper: Get access token for shop
   *
   * @param shopDomain - Shop domain
   * @returns Access token
   */
  private async getAccessToken(shopDomain: string): Promise<string> {
    const shop = await this.shopRepository.findByDomain(shopDomain);

    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    return shop.accessToken;
  }
}
