import { TemplateAssignment, TemplateCollision } from '../types';

export const mockAssignments: TemplateAssignment[] = [
  {
    id: '1',
    templateId: 'tpl_001',
    templateName: 'Premium Product Template',
    scope: {
      type: 'collection',
      values: ['premium-collection', 'luxury-items']
    },
    priority: 1,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    templateId: 'tpl_002',
    templateName: 'Sale Template',
    scope: {
      type: 'tag',
      values: ['sale', 'discount']
    },
    priority: 2,
    isActive: true,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z'
  }
];

export const mockCollisions: TemplateCollision[] = [
  {
    productId: 'prod_001',
    productTitle: 'Premium Headphones',
    assignments: [mockAssignments[0], mockAssignments[1]],
    conflictType: 'multiple_templates'
  }
];
