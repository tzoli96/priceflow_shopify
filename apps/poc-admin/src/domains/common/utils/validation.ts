/**
 * Validation utilities
 */

import type { TemplateField, FieldValidation } from '@/types';
import { VALIDATION_MESSAGES, FILE_UPLOAD_CONFIG } from '../constants';

// ============================================================================
// FIELD VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateField(
  value: any,
  field: TemplateField
): ValidationResult {
  const { validation, type } = field;

  // Required check
  if (validation.required && !value) {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }

  // Type-specific validation
  switch (type) {
    case 'number':
      return validateNumber(value, validation);
    case 'text':
    case 'textarea':
      return validateText(value, validation);
    case 'file':
      return validateFile(value, validation);
    default:
      return { isValid: true };
  }
}

function validateNumber(
  value: any,
  validation: FieldValidation
): ValidationResult {
  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: VALIDATION_MESSAGES.invalidNumber };
  }

  if (validation.min !== undefined && num < validation.min) {
    return { isValid: false, error: VALIDATION_MESSAGES.minValue(validation.min) };
  }

  if (validation.max !== undefined && num > validation.max) {
    return { isValid: false, error: VALIDATION_MESSAGES.maxValue(validation.max) };
  }

  return { isValid: true };
}

function validateText(
  value: string,
  validation: FieldValidation
): ValidationResult {
  if (validation.maxLength && value.length > validation.maxLength) {
    return { 
      isValid: false, 
      error: `Maximum ${validation.maxLength} karakter` 
    };
  }

  if (validation.regex) {
    const regex = new RegExp(validation.regex);
    if (!regex.test(value)) {
      return { isValid: false, error: 'Érvénytelen formátum' };
    }
  }

  return { isValid: true };
}

function validateFile(
  file: File | null,
  validation: FieldValidation
): ValidationResult {
  if (!file) {
    return { isValid: true };
  }

  const maxSize = validation.maxFileSize || FILE_UPLOAD_CONFIG.maxSize;
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: VALIDATION_MESSAGES.fileTooLarge(maxSize / 1024 / 1024) 
    };
  }

  const allowedExts = validation.allowedExtensions || FILE_UPLOAD_CONFIG.allowedExtensions;
  const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
  
  if (!allowedExts.includes(fileExt)) {
    return { isValid: false, error: VALIDATION_MESSAGES.invalidFileType };
  }

  return { isValid: true };
}

// ============================================================================
// FORMULA VALIDATION
// ============================================================================

const ALLOWED_FUNCTIONS = ['floor', 'ceil', 'round', 'min', 'max', 'if'];
const ALLOWED_OPERATORS = ['+', '-', '*', '/', '^', '(', ')'];

export function validateFormula(formula: string): ValidationResult {
  if (!formula.trim()) {
    return { isValid: false, error: 'A képlet nem lehet üres' };
  }

  // Basic syntax check
  const brackets = formula.match(/[()]/g) || [];
  const openBrackets = brackets.filter(b => b === '(').length;
  const closeBrackets = brackets.filter(b => b === ')').length;

  if (openBrackets !== closeBrackets) {
    return { isValid: false, error: 'Hibás zárójel párosítás' };
  }

  // Check for forbidden characters (basic security)
  const dangerousPatterns = [
    /eval/i,
    /function/i,
    /=>/,
    /import/i,
    /require/i,
    /process/i,
    /global/i,
    /window/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(formula)) {
      return { isValid: false, error: VALIDATION_MESSAGES.invalidFormula };
    }
  }

  return { isValid: true };
}

// ============================================================================
// TEMPLATE VALIDATION
// ============================================================================

export function validateTemplateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }

  if (name.length < 3) {
    return { isValid: false, error: 'A név legalább 3 karakter legyen' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'A név maximum 100 karakter lehet' };
  }

  return { isValid: true };
}

export function validateFieldKey(key: string, existingKeys: string[]): ValidationResult {
  if (!key.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.required };
  }

  // Must be valid variable name
  const validKeyPattern = /^[a-z_][a-z0-9_]*$/i;
  if (!validKeyPattern.test(key)) {
    return { 
      isValid: false, 
      error: 'A kulcs csak betűket, számokat és aláhúzást tartalmazhat (a-z, 0-9, _)' 
    };
  }

  // Check for duplicates
  if (existingKeys.includes(key)) {
    return { isValid: false, error: VALIDATION_MESSAGES.duplicateKey };
  }

  return { isValid: true };
}
