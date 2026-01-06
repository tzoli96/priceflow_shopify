import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { AssignmentModel } from '../models/assignment.model';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { ASSIGNMENT_REPOSITORY } from '../repositories/assignment.repository.interface';
import type { IAssignmentRepository } from '../repositories/assignment.repository.interface';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { TEMPLATE_REPOSITORY } from '../../template/repositories/template.repository.interface';
import type { ITemplateRepository } from '../../template/repositories/template.repository.interface';

/**
 * Assignment Service
 *
 * Felelősség: Template-ek hozzárendelése shop-okhoz
 *
 * Funkciók:
 * - createAssignment: Új assignment létrehozása
 * - updateAssignment: Assignment frissítése (priority, isActive)
 * - deleteAssignment: Assignment törlése
 * - listAssignments: Assignments listázása pagination-nel
 * - getAssignment: Egy assignment lekérése ID alapján
 */
@Injectable()
export class AssignmentService {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: IAssignmentRepository,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: ITemplateRepository,
  ) {}

  /**
   * Shop domain → UUID konverzió
   */
  private async getShopIdFromDomain(shopDomain: string): Promise<string> {
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }
    return shop.id;
  }

  /**
   * Create assignment
   */
  async createAssignment(
    shopDomain: string,
    dto: CreateAssignmentDto,
  ): Promise<AssignmentModel> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    // Ellenőrizzük, hogy létezik-e a template
    const template = await this.templateRepository.findById(dto.templateId, shopId);
    if (!template) {
      throw new NotFoundException(`Template not found: ${dto.templateId}`);
    }

    // Ellenőrizzük, hogy nincs-e már ilyen assignment
    const existing = await this.assignmentRepository.findByTemplate(dto.templateId, shopId);
    if (existing.length > 0) {
      throw new ConflictException(
        `Template ${dto.templateId} already assigned to shop ${shopDomain}`,
      );
    }

    // Assignment létrehozása
    const assignment = AssignmentModel.create(
      shopId,
      dto.templateId,
      dto.priority || 0,
    );

    return this.assignmentRepository.save(assignment);
  }

  /**
   * Get assignment by ID
   */
  async getAssignment(id: string, shopDomain: string): Promise<AssignmentModel> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    const assignment = await this.assignmentRepository.findById(id, shopId);

    if (!assignment) {
      throw new NotFoundException(`Assignment not found: ${id}`);
    }

    return assignment;
  }

  /**
   * List assignments
   */
  async listAssignments(
    shopDomain: string,
    options?: {
      page?: number;
      limit?: number;
      isActive?: boolean;
    },
  ): Promise<{ assignments: AssignmentModel[]; total: number; page: number; limit: number }> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const result = await this.assignmentRepository.findByShop(shopId, {
      page,
      limit,
      isActive: options?.isActive,
    });

    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    id: string,
    shopDomain: string,
    dto: UpdateAssignmentDto,
  ): Promise<AssignmentModel> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    const assignment = await this.assignmentRepository.findById(id, shopId);

    if (!assignment) {
      throw new NotFoundException(`Assignment not found: ${id}`);
    }

    // Update fields
    if (dto.priority !== undefined) {
      assignment.updatePriority(dto.priority);
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        assignment.activate();
      } else {
        assignment.deactivate();
      }
    }

    return this.assignmentRepository.update(assignment);
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(id: string, shopDomain: string): Promise<void> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    const assignment = await this.assignmentRepository.findById(id, shopId);

    if (!assignment) {
      throw new NotFoundException(`Assignment not found: ${id}`);
    }

    await this.assignmentRepository.delete(id, shopId);
  }

  /**
   * Activate assignment
   */
  async activateAssignment(id: string, shopDomain: string): Promise<AssignmentModel> {
    return this.updateAssignment(id, shopDomain, { isActive: true });
  }

  /**
   * Deactivate assignment
   */
  async deactivateAssignment(id: string, shopDomain: string): Promise<AssignmentModel> {
    return this.updateAssignment(id, shopDomain, { isActive: false });
  }
}
