export type FieldType = 'number' | 'text' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'file';

export interface TemplateField {
  id: string;
  key: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
