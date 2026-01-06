import { AssignmentModel } from '../models/assignment.model';

/**
 * Assignment Response DTO
 *
 * Output: Assignment API response
 */
export class AssignmentResponseDto {
  id: string;
  shopId: string;
  templateId: string;
  templateName?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static fromModel(assignment: AssignmentModel, templateName?: string): AssignmentResponseDto {
    return {
      id: assignment.id,
      shopId: assignment.shopId,
      templateId: assignment.templateId,
      templateName,
      priority: assignment.priority,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    };
  }
}

/**
 * Assignment List Response DTO
 *
 * Output: Paginated assignment lista
 */
export class AssignmentListResponseDto {
  data: AssignmentResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;

  static create(
    assignments: AssignmentResponseDto[],
    total: number,
    page: number,
    limit: number,
  ): AssignmentListResponseDto {
    return {
      data: assignments,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }
}
