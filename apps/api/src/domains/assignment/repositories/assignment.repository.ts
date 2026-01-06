import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AssignmentModel } from '../models/assignment.model';
import { IAssignmentRepository } from './assignment.repository.interface';

/**
 * Assignment Repository
 *
 * Felelősség: Assignment entitások perzisztálása Prisma-val
 */
@Injectable()
export class AssignmentRepository implements IAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find assignment by ID
   */
  async findById(id: string, shopId: string): Promise<AssignmentModel | null> {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, shopId },
    });

    if (!assignment) {
      return null;
    }

    return AssignmentModel.fromPersistence(assignment);
  }

  /**
   * Find assignments by shop
   */
  async findByShop(
    shopId: string,
    options?: {
      page?: number;
      limit?: number;
      isActive?: boolean;
    },
  ): Promise<{ assignments: AssignmentModel[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      assignments: assignments.map((a) => AssignmentModel.fromPersistence(a)),
      total,
    };
  }

  /**
   * Find assignments by template
   */
  async findByTemplate(templateId: string, shopId: string): Promise<AssignmentModel[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: { templateId, shopId },
      orderBy: { priority: 'desc' },
    });

    return assignments.map((a) => AssignmentModel.fromPersistence(a));
  }

  /**
   * Save new assignment
   */
  async save(assignment: AssignmentModel): Promise<AssignmentModel> {
    const data = assignment.toPersistence();

    const created = await this.prisma.assignment.create({
      data,
    });

    return AssignmentModel.fromPersistence(created);
  }

  /**
   * Update existing assignment
   */
  async update(assignment: AssignmentModel): Promise<AssignmentModel> {
    const data = assignment.toPersistence();

    const updated = await this.prisma.assignment.update({
      where: { id: assignment.id },
      data,
    });

    return AssignmentModel.fromPersistence(updated);
  }

  /**
   * Delete assignment
   */
  async delete(id: string, shopId: string): Promise<void> {
    await this.prisma.assignment.deleteMany({
      where: { id, shopId },
    });
  }
}
