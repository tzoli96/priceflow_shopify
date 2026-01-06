import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { TemplateResponseDto, TemplateListResponseDto } from '../dto/template-response.dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';

/**
 * Template Controller
 *
 * Felelősség: Template REST API végpontok
 *
 * Végpontok:
 * - GET /api/templates - Lista lekérése
 * - GET /api/templates/:id - Egy template lekérése
 * - POST /api/templates - Új template létrehozása
 * - PUT /api/templates/:id - Template frissítése
 * - DELETE /api/templates/:id - Template törlése
 * - PUT /api/templates/:id/activate - Template aktiválása
 * - PUT /api/templates/:id/deactivate - Template deaktiválása
 *
 * Multi-tenant security:
 * - ShopId from X-Shopify-Shop header (ShopHeaderGuard)
 * - Minden művelet shop-scoped
 */
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  /**
   * GET /api/templates
   *
   * Template lista lekérése pagination-nel
   *
   * Query params:
   * - page: Oldal szám (default: 1)
   * - limit: Elemek száma oldalanként (default: 20)
   * - isActive: Szűrés aktív/inaktív template-ekre (opcionális)
   *
   * Response:
   * {
   *   "data": [...templates],
   *   "total": 42,
   *   "page": 1,
   *   "limit": 20,
   *   "hasMore": true
   * }
   *
   * Használat:
   * GET /api/templates?page=1&limit=10&isActive=true
   * Header: X-Shopify-Shop: example.myshopify.com
   */
  @Get()
  async listTemplates(
    @ShopId() shopId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ): Promise<TemplateListResponseDto> {

    const result = await this.templateService.listTemplates(shopId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    return TemplateListResponseDto.create(
      result.templates,
      result.total,
      result.page,
      result.limit,
    );
  }

  /**
   * GET /api/templates/:id
   *
   * Egy template lekérése ID alapján
   *
   * Path params:
   * - id: Template ID (UUID)
   *
   * Response: TemplateResponseDto
   *
   * Használat:
   * GET /api/templates/uuid-123
   * Header: X-Shopify-Shop: example.myshopify.com
   */
  @Get(':id')
  async getTemplate(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<TemplateResponseDto> {

    const template = await this.templateService.getTemplate(id, shopId);
    return TemplateResponseDto.fromModel(template);
  }

  /**
   * POST /api/templates
   *
   * Új template létrehozása
   *
   * Body: CreateTemplateDto
   * {
   *   "name": "Banner Pricing",
   *   "description": "Calculate banner price",
   *   "pricingFormula": "(width_cm * height_cm / 10000) * unit_m2_price",
   *   "scopeType": "GLOBAL",
   *   "scopeValues": [],
   *   "fields": [
   *     {
   *       "key": "width_cm",
   *       "type": "NUMBER",
   *       "label": "Width (cm)",
   *       "required": true
   *     }
   *   ]
   * }
   *
   * Response: TemplateResponseDto (201 Created)
   *
   * Használat:
   * POST /api/templates
   * Header: X-Shopify-Shop: example.myshopify.com
   * Body: {...}
   */
  @Post()
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @ShopId() shopId: string,
  ): Promise<TemplateResponseDto> {

    const template = await this.templateService.createTemplate(shopId, dto);
    return TemplateResponseDto.fromModel(template);
  }

  /**
   * PUT /api/templates/:id
   *
   * Template frissítése
   *
   * Path params:
   * - id: Template ID
   *
   * Body: UpdateTemplateDto (minden mező opcionális)
   *
   * Response: TemplateResponseDto
   *
   * Használat:
   * PUT /api/templates/uuid-123
   * Header: X-Shopify-Shop: example.myshopify.com
   * Body: { "name": "Updated name" }
   */
  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @ShopId() shopId: string,
  ): Promise<TemplateResponseDto> {

    const template = await this.templateService.updateTemplate(id, shopId, dto);
    return TemplateResponseDto.fromModel(template);
  }

  /**
   * DELETE /api/templates/:id
   *
   * Template törlése
   *
   * Path params:
   * - id: Template ID
   *
   * Response: 204 No Content
   *
   * Használat:
   * DELETE /api/templates/uuid-123
   * Header: X-Shopify-Shop: example.myshopify.com
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<void> {
    await this.templateService.deleteTemplate(id, shopId);
  }

  /**
   * PUT /api/templates/:id/activate
   *
   * Template aktiválása
   *
   * Path params:
   * - id: Template ID
   *
   * Response: TemplateResponseDto (isActive = true)
   *
   * Használat:
   * PUT /api/templates/uuid-123/activate
   * Header: X-Shopify-Shop: example.myshopify.com
   */
  @Put(':id/activate')
  async activateTemplate(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<TemplateResponseDto> {

    const template = await this.templateService.activateTemplate(id, shopId);
    return TemplateResponseDto.fromModel(template);
  }

  /**
   * PUT /api/templates/:id/deactivate
   *
   * Template deaktiválása
   *
   * Path params:
   * - id: Template ID
   *
   * Response: TemplateResponseDto (isActive = false)
   *
   * Használat:
   * PUT /api/templates/uuid-123/deactivate
   * Header: X-Shopify-Shop: example.myshopify.com
   */
  @Put(':id/deactivate')
  async deactivateTemplate(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<TemplateResponseDto> {

    const template = await this.templateService.deactivateTemplate(id, shopId);
    return TemplateResponseDto.fromModel(template);
  }
}
