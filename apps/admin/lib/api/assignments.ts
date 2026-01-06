/**
 * Assignment API Client
 */

import { apiClient } from './client';
import type {
  Assignment,
  AssignmentListResponse,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CollisionGroup,
} from '@/types/assignment';

/**
 * List assignments
 */
export async function listAssignments(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}): Promise<AssignmentListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

  const query = searchParams.toString();
  return apiClient.get<AssignmentListResponse>(
    `/api/assignments${query ? `?${query}` : ''}`
  );
}

/**
 * Get assignment by ID
 */
export async function getAssignment(id: string): Promise<Assignment> {
  return apiClient.get<Assignment>(`/api/assignments/${id}`);
}

/**
 * Create assignment
 */
export async function createAssignment(data: CreateAssignmentInput): Promise<Assignment> {
  return apiClient.post<Assignment>('/api/assignments', data);
}

/**
 * Update assignment
 */
export async function updateAssignment(
  id: string,
  data: UpdateAssignmentInput
): Promise<Assignment> {
  return apiClient.put<Assignment>(`/api/assignments/${id}`, data);
}

/**
 * Delete assignment
 */
export async function deleteAssignment(id: string): Promise<void> {
  return apiClient.delete(`/api/assignments/${id}`);
}

/**
 * Activate assignment
 */
export async function activateAssignment(id: string): Promise<Assignment> {
  return apiClient.put<Assignment>(`/api/assignments/${id}/activate`);
}

/**
 * Deactivate assignment
 */
export async function deactivateAssignment(id: string): Promise<Assignment> {
  return apiClient.put<Assignment>(`/api/assignments/${id}/deactivate`);
}

/**
 * Get collisions
 */
export async function getCollisions(): Promise<CollisionGroup[]> {
  return apiClient.get<CollisionGroup[]>('/api/assignments/collisions');
}
