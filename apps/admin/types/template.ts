/**
 * Template TypeScript Types
 *
 * Corresponding to backend DTOs and models
 */

export enum ScopeType {
  PRODUCT = 'PRODUCT',
  COLLECTION = 'COLLECTION',
  VENDOR = 'VENDOR',
  TAG = 'TAG',
  GLOBAL = 'GLOBAL',
}

export enum FieldType {
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
  SELECT = 'SELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  TEXTAREA = 'TEXTAREA',
  FILE = 'FILE',
}

export interface TemplateField {
  id?: string;
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
    [key: string]: any;
  };
}

export interface Template {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  pricingFormula: string;
  pricingMeta?: {
    variables?: string[];
    [key: string]: any;
  };
  scopeType: ScopeType;
  scopeValues: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields: TemplateField[];
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  pricingFormula: string;
  scopeType?: ScopeType;
  scopeValues?: string[];
  fields: Omit<TemplateField, 'id'>[];
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  pricingFormula?: string;
  scopeType?: ScopeType;
  scopeValues?: string[];
  fields?: Omit<TemplateField, 'id'>[];
}

export interface TemplateListResponse {
  data: Template[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TemplateListFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface FormulaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  variables?: string[];
}
