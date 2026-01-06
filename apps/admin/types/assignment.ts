/**
 * Assignment Types
 */

export interface Assignment {
  id: string;
  shopId: string;
  templateId: string;
  templateName?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentListResponse {
  data: Assignment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateAssignmentInput {
  templateId: string;
  priority?: number;
}

export interface UpdateAssignmentInput {
  priority?: number;
  isActive?: boolean;
}

/**
 * Collision Types
 */
export interface CollisionGroup {
  scopeType: 'PRODUCT' | 'COLLECTION' | 'VENDOR' | 'TAG' | 'GLOBAL';
  scopeValue: string | null;
  templates: {
    id: string;
    name: string;
    priority: number;
  }[];
}
