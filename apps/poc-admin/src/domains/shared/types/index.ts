/**
 * Core domain types for Shopify Product Calculator Admin
 */

// Re-export domain types for backward compatibility
export type { Template, TemplateField, ConditionalRule, TemplateScope } from '@/template';

// ============================================================================
// FIELD TYPES
// ============================================================================

export type FieldType = 
  | 'number' 
  | 'text' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'textarea' 
  | 'file';

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  regex?: string;
  maxLength?: number;
  allowedExtensions?: string[];
  maxFileSize?: number; // in bytes
}

export interface FieldOption {
  label: string;
  value: string;
  priceModifier?: number; // Fixed price modifier
}

export interface FieldHelpContent {
  title?: string;
  description?: string;
  imageUrl?: string;
}

// ============================================================================
// CONDITIONAL LOGIC
// ============================================================================

export type ConditionalOperator = 
  | '==' 
  | '!=' 
  | '>' 
  | '<' 
  | '>=' 
  | '<=' 
  | 'includes' 
  | 'excludes';

// ============================================================================
// PRICING
// ============================================================================

export interface PricingMeta {
  [key: string]: number | string; // e.g., unit_m2_price: 1500
}

export interface PriceBreakdownItem {
  label: string;
  value: number;
  formula?: string; // Optional: show how it was calculated
}

// ============================================================================
// TEMPLATE ASSIGNMENT
// ============================================================================

export interface TemplateAssignment {
  id: string;
  templateId: string;
  productId: string;
  priority: number; // Higher = more important
  assignedBy: string;
  assignedAt: string;
}

// ============================================================================
// COLLISION DETECTION
// ============================================================================

export interface TemplateCollision {
  productId: string;
  productTitle: string;
  templates: {
    templateId: string;
    templateName: string;
    priority: number;
  }[];
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface CalculationLog {
  id: string;
  calculationId: string;
  shop: string;
  productId: string;
  templateId: string;
  templateVersion: number;
  inputs: Record<string, any>;
  outputPrice: number;
  breakdown: PriceBreakdownItem[];
  userSession?: string;
  timestamp: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// UI STATE
// ============================================================================

export interface TemplateFormState {
  template: Partial<Template>;
  isDirty: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

export type ViewMode = 'list' | 'edit' | 'preview';

export interface AppState {
  templates: Template[];
  selectedTemplateId: string | null;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
}
