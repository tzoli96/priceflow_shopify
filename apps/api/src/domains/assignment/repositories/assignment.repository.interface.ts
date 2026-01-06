import { AssignmentModel } from '../models/assignment.model';

export interface IAssignmentRepository {
  findById(id: string, shopId: string): Promise<AssignmentModel | null>;
  findByShop(
    shopId: string,
    options?: {
      page?: number;
      limit?: number;
      isActive?: boolean;
    },
  ): Promise<{ assignments: AssignmentModel[]; total: number }>;
  findByTemplate(templateId: string, shopId: string): Promise<AssignmentModel[]>;
  save(assignment: AssignmentModel): Promise<AssignmentModel>;
  update(assignment: AssignmentModel): Promise<AssignmentModel>;
  delete(id: string, shopId: string): Promise<void>;
}

export const ASSIGNMENT_REPOSITORY = Symbol('IAssignmentRepository');
