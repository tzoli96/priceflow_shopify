import type { TemplateScope } from '../template/types';

export interface TemplateAssignment {
  id: string;
  templateId: string;
  templateName: string;
  scope: TemplateScope;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCollision {
  productId: string;
  productTitle: string;
  assignments: TemplateAssignment[];
  conflictType: 'multiple_templates' | 'priority_conflict';
}
