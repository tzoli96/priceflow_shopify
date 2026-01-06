/**
 * Template API Endpoints
 *
 * All template-related API calls
 */

import { apiClient } from '../client';
import type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateListResponse,
  TemplateListFilters,
} from '@/types/template';

/**
 * Template API
 *
 * Clean, typed interface for template operations
 */
export const templatesApi = {
  /**
   * List templates with pagination and filters
   *
   * GET /api/templates?page=1&limit=20&isActive=true
   */
  async list(filters?: TemplateListFilters): Promise<TemplateListResponse> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }

    const queryString = params.toString();
    const endpoint = `/api/templates${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<TemplateListResponse>(endpoint);
  },

  /**
   * Get a single template by ID
   *
   * GET /api/templates/:id
   */
  async get(id: string): Promise<Template> {
    return apiClient.get<Template>(`/api/templates/${id}`);
  },

  /**
   * Create a new template
   *
   * POST /api/templates
   */
  async create(data: CreateTemplateDto): Promise<Template> {
    return apiClient.post<Template, CreateTemplateDto>('/api/templates', data);
  },

  /**
   * Update an existing template
   *
   * PUT /api/templates/:id
   */
  async update(id: string, data: UpdateTemplateDto): Promise<Template> {
    return apiClient.put<Template, UpdateTemplateDto>(
      `/api/templates/${id}`,
      data
    );
  },

  /**
   * Delete a template
   *
   * DELETE /api/templates/:id
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/templates/${id}`);
  },

  /**
   * Activate a template
   *
   * PUT /api/templates/:id/activate
   */
  async activate(id: string): Promise<Template> {
    return apiClient.put<Template>(`/api/templates/${id}/activate`);
  },

  /**
   * Deactivate a template
   *
   * PUT /api/templates/:id/deactivate
   */
  async deactivate(id: string): Promise<Template> {
    return apiClient.put<Template>(`/api/templates/${id}/deactivate`);
  },
};
