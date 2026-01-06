import type { 
  FieldType, 
  ConditionalOperator, 
  FieldValidation, 
  FieldOption, 
  FieldHelpContent 
} from '@/types';

export interface TemplateField {
  key: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  helpContent?: FieldHelpContent;
  validation?: FieldValidation;
  options?: FieldOption[];
  conditionalRules?: ConditionalRule[];
  useInFormula?: boolean; // Whether this field can be used in pricing formula
}

export interface ConditionalRule {
  fieldKey: string;
  operator: ConditionalOperator;
  value: any;
  action: 'show' | 'hide' | 'require';
}

export interface TemplateScope {
  type: 'product' | 'collection' | 'vendor' | 'tag' | 'global';
  values?: string[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  pricingFormula: string;
  pricingMeta: Record<string, any>;
  scope: TemplateScope;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
