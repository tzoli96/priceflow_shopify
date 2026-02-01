import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repositories/template.repository.interface';
import type { ITemplateRepository } from '../repositories/template.repository.interface';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { TemplateModel } from '../models/template.model';
import { TemplateFieldModel } from '../models/template-field.model';
import { TemplateSectionModel } from '../models/template-section.model';
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
   * Helper: Generálja a képletben elérhető változókat a mezők alapján
   *
   * A speciális mező típusok (PRODUCT_CARD, DELIVERY_TIME, EXTRAS, GRAPHIC_SELECT, SELECT, RADIO)
   * `{key}_price` változót generálnak a képlethez.
   * A NUMBER típusú mezők közvetlenül a kulcsukkal elérhetők.
   */
  private getFormulaVariablesFromFields(fields: Array<{ key: string; type: string | any }>): Array<{ key: string }> {
    const variables: Array<{ key: string }> = [];

    // Mezők típusa alapján generált változók
    const priceGeneratingTypes = ['PRODUCT_CARD', 'DELIVERY_TIME', 'EXTRAS', 'GRAPHIC_SELECT', 'SELECT', 'RADIO'];

    for (const field of fields) {
      // Convert type to string in case it's an enum
      const fieldType = String(field.type);

      // NUMBER típusú mezők közvetlenül a kulcsukkal elérhetők
      if (fieldType === 'NUMBER') {
        variables.push({ key: field.key });
      }

      // Speciális mezők _price változót generálnak
      if (priceGeneratingTypes.includes(fieldType)) {
        variables.push({ key: `${field.key}_price` });
      }
    }

    return variables;
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

    // Validate formula - generate available variables from section fields
    // Fields are ONLY in sections, not at top level
    const allFields = (dto.sections || []).flatMap(section => section.fields || []);
    const formulaVariables = this.getFormulaVariablesFromFields(allFields);
    const validation = this.formulaValidator.validate(dto.pricingFormula, formulaVariables);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid pricing formula',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Create section models with their fields (all fields are in sections)
    const sectionModels = (dto.sections || []).map((sectionDto, sectionIndex) => {
      const section = TemplateSectionModel.create(
        '', // templateId will be set after save
        sectionDto.key,
        sectionDto.title,
        {
          description: sectionDto.description,
          layoutType: sectionDto.layoutType,
          columnsCount: sectionDto.columnsCount,
          collapsible: sectionDto.collapsible,
          defaultOpen: sectionDto.defaultOpen,
          showNumber: sectionDto.showNumber,
          order: sectionDto.order ?? sectionIndex,
          builtInType: sectionDto.builtInType,
          presets: sectionDto.presets,
        },
      );

      // Add fields to section
      (sectionDto.fields || []).forEach((fieldDto, fieldIndex) => {
        const field = TemplateFieldModel.create(
          '', // templateId will be set after save
          fieldDto.key,
          fieldDto.type,
          fieldDto.label,
          fieldDto.required ?? false,
          fieldDto.useInFormula ?? true,
          fieldDto.order ?? fieldIndex,
        );

        // Apply additional field properties
        if (fieldDto.placeholder) field.setPlaceholder(fieldDto.placeholder);
        if (fieldDto.helpText) field.setHelpText(fieldDto.helpText);
        if (fieldDto.helpContent) field.helpContent = fieldDto.helpContent;
        if (fieldDto.validation) field.setValidation(fieldDto.validation);
        if (fieldDto.options) field.setOptions(fieldDto.options);
        if (fieldDto.conditionalRules) field.setConditionalRules(fieldDto.conditionalRules);
        if (fieldDto.displayStyle) field.displayStyle = fieldDto.displayStyle;
        if (fieldDto.presetValues) field.presetValues = fieldDto.presetValues;
        if (fieldDto.iconUrl) field.iconUrl = fieldDto.iconUrl;
        if (fieldDto.unit) field.unit = fieldDto.unit;

        section.addField(field);
      });

      return section;
    });

    // Create template model
    const template = TemplateModel.create(
      shopId,
      dto.name,
      dto.description || null,
      dto.pricingFormula,
      dto.scopeType,
      dto.scopeValues,
      sectionModels,
    );

    // Set additional pricing options
    if (dto.minQuantity !== undefined) template.minQuantity = dto.minQuantity;
    if (dto.maxQuantity !== undefined) template.maxQuantity = dto.maxQuantity;
    if (dto.minQuantityMessage !== undefined) template.minQuantityMessage = dto.minQuantityMessage;
    if (dto.maxQuantityMessage !== undefined) template.maxQuantityMessage = dto.maxQuantityMessage;
    if (dto.discountTiers !== undefined) {
      template.discountTiers = dto.discountTiers.map((tier) => ({
        minQty: tier.minQty,
        maxQty: tier.maxQty ?? null,
        discount: tier.discount,
      }));
    }
    if (dto.hasExpressOption !== undefined) template.hasExpressOption = dto.hasExpressOption;
    if (dto.expressMultiplier !== undefined) template.expressMultiplier = dto.expressMultiplier;
    if (dto.expressLabel !== undefined) template.expressLabel = dto.expressLabel;
    if (dto.normalLabel !== undefined) template.normalLabel = dto.normalLabel;

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
      // Fields are ONLY in sections, not at top level
      const sections = dto.sections || template.sections || [];
      const allFields = sections.flatMap((section: any) => section.fields || []);
      const formulaVariables = this.getFormulaVariablesFromFields(allFields);
      const validation = this.formulaValidator.validate(dto.pricingFormula, formulaVariables);

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

    // Update sections if provided
    if (dto.sections !== undefined) {
      const sectionModels = (dto.sections || []).map((sectionDto, sectionIndex) => {
        const section = TemplateSectionModel.create(
          template.id,
          sectionDto.key,
          sectionDto.title,
          {
            description: sectionDto.description,
            layoutType: sectionDto.layoutType,
            columnsCount: sectionDto.columnsCount,
            collapsible: sectionDto.collapsible,
            defaultOpen: sectionDto.defaultOpen,
            showNumber: sectionDto.showNumber,
            order: sectionDto.order ?? sectionIndex,
            builtInType: sectionDto.builtInType,
            presets: sectionDto.presets,
          },
        );

        // Add fields to section
        (sectionDto.fields || []).forEach((fieldDto, fieldIndex) => {
          const field = TemplateFieldModel.create(
            template.id,
            fieldDto.key,
            fieldDto.type,
            fieldDto.label,
            fieldDto.required ?? false,
            fieldDto.useInFormula ?? true,
            fieldDto.order ?? fieldIndex,
          );

          // Apply additional field properties
          if (fieldDto.placeholder) field.setPlaceholder(fieldDto.placeholder);
          if (fieldDto.helpText) field.setHelpText(fieldDto.helpText);
          if (fieldDto.helpContent) field.helpContent = fieldDto.helpContent;
          if (fieldDto.validation) field.setValidation(fieldDto.validation);
          if (fieldDto.options) field.setOptions(fieldDto.options);
          if (fieldDto.conditionalRules) field.setConditionalRules(fieldDto.conditionalRules);
          if (fieldDto.displayStyle) field.displayStyle = fieldDto.displayStyle;
          if (fieldDto.presetValues) field.presetValues = fieldDto.presetValues;
          if (fieldDto.iconUrl) field.iconUrl = fieldDto.iconUrl;
          if (fieldDto.unit) field.unit = fieldDto.unit;

          section.addField(field);
        });

        return section;
      });

      template.sections = sectionModels;
    }

    // Handle isActive
    if (dto.isActive !== undefined) {
      dto.isActive ? template.activate() : template.deactivate();
    }

    // Update pricing options
    if (dto.minQuantity !== undefined) template.minQuantity = dto.minQuantity;
    if (dto.maxQuantity !== undefined) template.maxQuantity = dto.maxQuantity;
    if (dto.minQuantityMessage !== undefined) template.minQuantityMessage = dto.minQuantityMessage;
    if (dto.maxQuantityMessage !== undefined) template.maxQuantityMessage = dto.maxQuantityMessage;
    if (dto.discountTiers !== undefined) {
      template.discountTiers = dto.discountTiers
        ? dto.discountTiers.map((tier) => ({
            minQty: tier.minQty,
            maxQty: tier.maxQty ?? null,
            discount: tier.discount,
          }))
        : null;
    }
    if (dto.hasExpressOption !== undefined) template.hasExpressOption = dto.hasExpressOption;
    if (dto.expressMultiplier !== undefined) template.expressMultiplier = dto.expressMultiplier;
    if (dto.expressLabel !== undefined) template.expressLabel = dto.expressLabel;
    if (dto.normalLabel !== undefined) template.normalLabel = dto.normalLabel;

    // Update notes field options
    if (dto.hasNotesField !== undefined) template.hasNotesField = dto.hasNotesField;
    if (dto.notesFieldLabel !== undefined) template.notesFieldLabel = dto.notesFieldLabel;
    if (dto.notesFieldPlaceholder !== undefined) template.notesFieldPlaceholder = dto.notesFieldPlaceholder;

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
