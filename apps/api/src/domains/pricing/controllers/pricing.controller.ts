import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PriceCalculatorService } from '../services/price-calculator.service';
import {
  GetTemplateQueryDto,
  GetTemplateResponseDto,
  CalculatePriceRequestDto,
  CalculatePriceResponseDto,
} from '../dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';

/**
 * Pricing Controller
 *
 * Felelősség: Pricing REST API végpontok a storefront widget-hez
 *
 * Végpontok:
 * - GET /api/pricing/template/:productId - Template lekérése termékhez
 * - POST /api/pricing/calculate - Ár számítás
 *
 * Használat:
 * A storefront widget ezeket a végpontokat hívja az árkalkulációhoz
 *
 * Multi-tenant security:
 * - ShopId from X-Shopify-Shop header
 * - Minden művelet shop-scoped
 */
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly priceCalculatorService: PriceCalculatorService,
  ) {}

  /**
   * GET /api/pricing/template/:productId
   *
   * Template lekérése termékhez scope matching alapján
   *
   * Path params:
   * - productId: Shopify product ID
   *
   * Query params:
   * - vendor: Vendor name (optional)
   * - tags: Comma-separated tags (optional)
   * - collections: Comma-separated collection IDs (optional)
   *
   * Response:
   * {
   *   "hasTemplate": true,
   *   "template": {
   *     "id": "uuid-123",
   *     "name": "Molinó árképzés",
   *     "fields": [...]
   *   }
   * }
   *
   * Használat:
   * GET /api/pricing/template/12345?vendor=Molino&tags=banner
   * Header: X-Shopify-Shop: test-dekormunka.myshopify.com
   */
  @Get('template/:productId')
  async getTemplateForProduct(
    @Param('productId') productId: string,
    @Query() query: GetTemplateQueryDto,
    @ShopId() shopDomain: string,
  ): Promise<GetTemplateResponseDto> {
    // Parse comma-separated values
    const metadata = {
      productId,
      vendor: query.vendor,
      tags: query.tags ? query.tags.split(',').map((t) => t.trim()) : undefined,
      collections: query.collections
        ? query.collections.split(',').map((c) => c.trim())
        : undefined,
    };

    const result = await this.priceCalculatorService.getTemplateForProduct(
      shopDomain,
      productId,
      metadata,
    );

    return result;
  }

  /**
   * POST /api/pricing/calculate
   *
   * Ár számítás a sablon formulája alapján
   *
   * Body:
   * {
   *   "templateId": "uuid-123",
   *   "productId": "12345",
   *   "fieldValues": {
   *     "width_cm": 200,
   *     "height_cm": 150,
   *     "material": 1
   *   },
   *   "basePrice": 5000
   * }
   *
   * Response:
   * {
   *   "calculatedPrice": 12500,
   *   "originalPrice": 5000,
   *   "breakdown": [...],
   *   "formattedPrice": "12 500 Ft"
   * }
   *
   * Használat:
   * POST /api/pricing/calculate
   * Header: X-Shopify-Shop: test-dekormunka.myshopify.com
   * Body: {...}
   */
  @Post('calculate')
  async calculatePrice(
    @Body() dto: CalculatePriceRequestDto,
    @ShopId() shopDomain: string,
  ): Promise<CalculatePriceResponseDto> {
    const result = await this.priceCalculatorService.calculatePrice(
      shopDomain,
      dto.templateId,
      dto.fieldValues,
      dto.basePrice,
      { isExpress: dto.isExpress },
    );

    return result;
  }
}
