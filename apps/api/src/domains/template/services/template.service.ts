import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repositories/template.repository.interface';
import type { ITemplateRepository } from '../repositories/template.repository.interface';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { TemplateModel } from '../models/template.model';
import { TemplateFieldModel } from '../models/template-field.model';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { FormulaValidatorService } from './formula-validator.service';

/**
 * Template Service
 *
 * Felelősség: Template üzleti logika és koordináció
 *
 * Funkciók:
 * - Template CRUD műveletek
 * - Formula validálás (FormulaValidatorService használata)
 * - Multi-tenant shop isolation
 * - Field management
 * - Template activation/deactivation
 *
 * Használat:
 * ```ts
 * const template = await templateService.createTemplate(shopId, createDto);
 * const templates = await templateService.listTemplates(shopId, { page: 1, limit: 10 });
 * ```
 */
@Injectable()
export class TemplateService {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: ITemplateRepository,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
    private readonly formulaValidator: FormulaValidatorService,
  ) {}

  /**
   * Helper: Shop ID lekérése domain alapján
   */
  private async getShopIdFromDomain(shopDomain: string): Promise<string> {
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }
    return shop.id;
  }

  /**
   * Template létrehozása
   *
   * @param shopDomain - Shop domain (pl. "example.myshopify.com")
   * @param dto - CreateTemplateDto
   * @returns Létrehozott template
   *
   * Folyamat:
   * 1. Shop ID lekérése domain alapján
   * 2. Formula validálás
   * 3. Field-ek létrehozása
   * 4. Domain model építése
   * 5. Perzisztálás
   */
  async createTemplate(shopDomain: string, dto: CreateTemplateDto): Promise<TemplateModel> {
    // Get shop ID from domain
    const shopId = await this.getShopIdFromDomain(shopDomain);

    // Validate formula
    const fields = dto.fields || [];
    const validation = this.formulaValidator.validate(dto.pricingFormula, fields);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid pricing formula',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Create field models
    const fieldModels = fields.map((fieldDto, index) =>
      TemplateFieldModel.create(
        '', // templateId will be set after save
        fieldDto.key,
        fieldDto.type,
        fieldDto.label,
        fieldDto.required ?? false,
        fieldDto.useInFormula ?? true,
        fieldDto.order ?? index,
      ),
    );

    // Apply additional field properties
    fieldModels.forEach((field, index) => {
      const fieldDto = fields[index];
      if (fieldDto.placeholder) field.setPlaceholder(fieldDto.placeholder);
      if (fieldDto.helpText) field.setHelpText(fieldDto.helpText);
      if (fieldDto.validation) field.setValidation(fieldDto.validation);
      if (fieldDto.options) field.setOptions(fieldDto.options);
      if (fieldDto.conditionalRules) field.setConditionalRules(fieldDto.conditionalRules);
    });

    // Create template model
    const template = TemplateModel.create(
      shopId,
      dto.name,
      dto.description || null,
      dto.pricingFormula,
      dto.scopeType,
      dto.scopeValues,
      fieldModels,
    );

    // Save
    return this.templateRepository.save(template);
  }

  /**
   * Template lekérése ID alapján
   */
  async getTemplate(id: string, shopDomain: string): Promise<TemplateModel> {
    const shopId = await this.getShopIdFromDomain(shopDomain);
    const template = await this.templateRepository.findById(id, shopId);

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Template-ek listázása pagination-nel
   */
  async listTemplates(
    shopDomain: string,
    options: { page?: number; limit?: number; isActive?: boolean } = {},
  ): Promise<{ templates: TemplateModel[]; total: number; page: number; limit: number }> {
    const shopId = await this.getShopIdFromDomain(shopDomain);
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      this.templateRepository.findByShop(shopId, {
        skip,
        take: limit,
        isActive: options.isActive,
      }),
      this.templateRepository.count(shopId, options.isActive),
    ]);

    return { templates, total, page, limit };
  }

  /**
   * Template frissítése
   */
  async updateTemplate(id: string, shopDomain: string, dto: UpdateTemplateDto): Promise<TemplateModel> {
    const template = await this.getTemplate(id, shopDomain);

    // Validate formula if updated
    if (dto.pricingFormula) {
      const fields = dto.fields || template.fields;
      const validation = this.formulaValidator.validate(dto.pricingFormula, fields);

      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Invalid pricing formula',
          errors: validation.errors,
        });
      }
    }

    // Update template properties
    template.update(
      dto.name,
      dto.description,
      dto.pricingFormula,
      dto.scopeType,
      dto.scopeValues,
    );

    // Update fields if provided
    if (dto.fields) {
      template.fields = dto.fields.map((fieldDto, index) => {
        const field = TemplateFieldModel.create(
          template.id,
          fieldDto.key,
          fieldDto.type,
          fieldDto.label,
          fieldDto.required ?? false,
          fieldDto.useInFormula ?? true,
          fieldDto.order ?? index,
        );

        if (fieldDto.placeholder) field.setPlaceholder(fieldDto.placeholder);
        if (fieldDto.helpText) field.setHelpText(fieldDto.helpText);
        if (fieldDto.validation) field.setValidation(fieldDto.validation);
        if (fieldDto.options) field.setOptions(fieldDto.options);
        if (fieldDto.conditionalRules) field.setConditionalRules(fieldDto.conditionalRules);

        return field;
      });
    }

    // Handle isActive
    if (dto.isActive !== undefined) {
      dto.isActive ? template.activate() : template.deactivate();
    }

    return this.templateRepository.update(template);
  }

  /**
   * Template törlése
   */
  async deleteTemplate(id: string, shopDomain: string): Promise<void> {
    const shopId = await this.getShopIdFromDomain(shopDomain);
    const template = await this.getTemplate(id, shopDomain);
    await this.templateRepository.delete(template.id, shopId);
  }

  /**
   * Template aktiválása
   */
  async activateTemplate(id: string, shopDomain: string): Promise<TemplateModel> {
    const template = await this.getTemplate(id, shopDomain);
    template.activate();
    return this.templateRepository.update(template);
  }

  /**
   * Template deaktiválása
   */
  async deactivateTemplate(id: string, shopDomain: string): Promise<TemplateModel> {
    const template = await this.getTemplate(id, shopDomain);
    template.deactivate();
    return this.templateRepository.update(template);
  }
}
