import { Injectable } from '@nestjs/common';
import { create, all, MathJsInstance } from 'mathjs';

/**
 * Formula Validator Service
 *
 * Felelősség: Pricing formula validálása és biztonság ellenőrzés
 *
 * Támogatott operátorok:
 * - Aritmetikai: +, -, *, /, ^, (, )
 *
 * Támogatott függvények:
 * - floor(x): Lefelé kerekítés
 * - ceil(x): Felfelé kerekítés
 * - round(x): Kerekítés
 * - min(a, b, ...): Minimum érték
 * - max(a, b, ...): Maximum érték
 * - if(condition, trueValue, falseValue): Feltételes kifejezés
 *
 * Példa valid formulák:
 * - "(width_cm * height_cm / 10000) * unit_m2_price"
 * - "floor(width_cm / 25) * grommet_fee + base_price"
 * - "if(material === 'premium', base_price * 1.5, base_price)"
 *
 * Biztonsági szabályok:
 * - Csak whitelisted függvények
 * - Nincs eval() vagy Function() használat
 * - Nincs külső függvény hívás
 * - Field változók: alphanumeric + underscore
 */
@Injectable()
export class FormulaValidatorService {
  private readonly math: MathJsInstance;

  constructor() {
    this.math = create(all);
    this.math.import(
      {
        if: function (
          condition: boolean | number,
          trueValue: number,
          falseValue: number,
        ): number {
          return condition ? trueValue : falseValue;
        },
      },
      { override: false },
    );
  }

  private readonly allowedFunctions = [
    'floor',
    'ceil',
    'round',
    'min',
    'max',
    'if',
    'abs',
    'sqrt',
    'pow',
  ];

  private readonly allowedOperators = ['+', '-', '*', '/', '^', '(', ')'];

  /**
   * System variables automatically available in formulas
   * These are provided by the pricing engine at runtime
   */
  private readonly systemVariables = [
    'base_price', // Product base price from Shopify
  ];

  /**
   * Formula validálása
   *
   * @param formula - Pricing formula string
   * @param fields - Elérhető field-ek (változók)
   * @returns Validation result object
   *
   * Validációk:
   * 1. Formula nem lehet üres
   * 2. Zárójel párok egyeznek
   * 3. Csak engedélyezett függvények
   * 4. Csak létező field változók
   * 5. Nincs potenciálisan veszélyes kód (eval, require, import, stb.)
   *
   * Példa használat:
   * ```ts
   * const result = validator.validate(
   *   "(width_cm * height_cm / 10000) * unit_m2_price",
   *   [{ key: "width_cm" }, { key: "height_cm" }, { key: "unit_m2_price" }]
   * );
   *
   * if (!result.valid) {
   *   console.error(result.errors);
   * }
   * ```
   */
  validate(
    formula: string,
    fields: Array<{ key: string }>,
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Üres formula check
    if (!formula || formula.trim().length === 0) {
      errors.push('Formula cannot be empty');
      return { valid: false, errors, warnings };
    }

    const trimmedFormula = formula.trim();

    // 2. Zárójel párosítás
    const parenBalance = this.checkParenthesesBalance(trimmedFormula);
    if (!parenBalance.valid) {
      errors.push(parenBalance.error || 'Parentheses mismatch');
    }

    // 3. Veszélyes kulcsszavak detektálása
    const dangerousKeywords = [
      'eval',
      'Function',
      'require',
      'import',
      'export',
      'process',
      '__proto__',
      'constructor',
    ];

    for (const keyword of dangerousKeywords) {
      if (trimmedFormula.includes(keyword)) {
        errors.push(`Forbidden keyword: ${keyword}`);
      }
    }

    // 4. Függvények validálása
    const functionValidation = this.validateFunctions(trimmedFormula);
    if (!functionValidation.valid) {
      errors.push(...functionValidation.errors);
    }

    // 5. Field változók validálása
    const fieldKeys = fields.map((f) => f.key);
    const variableValidation = this.validateVariables(
      trimmedFormula,
      fieldKeys,
    );
    if (!variableValidation.valid) {
      errors.push(...variableValidation.errors);
    }
    warnings.push(...variableValidation.warnings);

    // 6. Division by zero warning
    if (trimmedFormula.includes('/ 0')) {
      warnings.push('Potential division by zero detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Zárójel párosítás ellenőrzése
   */
  private checkParenthesesBalance(formula: string): {
    valid: boolean;
    error?: string;
  } {
    let balance = 0;

    for (const char of formula) {
      if (char === '(') balance++;
      if (char === ')') balance--;

      if (balance < 0) {
        return { valid: false, error: 'Closing parenthesis without opening' };
      }
    }

    if (balance !== 0) {
      return { valid: false, error: 'Unclosed parenthesis' };
    }

    return { valid: true };
  }

  /**
   * Függvények validálása
   */
  private validateFunctions(formula: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Extract function calls: functionName(...)
    const functionRegex = /([a-z_][a-z0-9_]*)\s*\(/gi;
    const matches = formula.matchAll(functionRegex);

    for (const match of matches) {
      const functionName = match[1].toLowerCase();

      if (!this.allowedFunctions.includes(functionName)) {
        errors.push(`Unknown or forbidden function: ${functionName}()`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Változók (field-ek) validálása
   */
  private validateVariables(
    formula: string,
    availableFields: string[],
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Combine user fields with system variables
    const allAvailableVariables = [
      ...availableFields,
      ...this.systemVariables,
    ];

    // Extract variables: alphanumeric + underscore
    const variableRegex = /\b([a-z_][a-z0-9_]*)\b/gi;
    const matches = formula.matchAll(variableRegex);

    const usedVariables = new Set<string>();

    for (const match of matches) {
      const variable = match[1].toLowerCase();

      // Skip function names and reserved words
      if (this.allowedFunctions.includes(variable)) continue;
      if (['true', 'false', 'null', 'undefined'].includes(variable)) continue;

      usedVariables.add(variable);

      // Check if variable exists in available fields or system variables
      if (!allAvailableVariables.includes(variable)) {
        errors.push(
          `Unknown variable: "${variable}". Available: ${allAvailableVariables.join(', ')}`,
        );
      }
    }

    // Warning: unused user fields (not system variables)
    const unusedFields = availableFields.filter((f) => !usedVariables.has(f));
    if (unusedFields.length > 0) {
      warnings.push(
        `Unused fields in formula: ${unusedFields.join(', ')}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Formula test evaluation (safe)
   *
   * @param formula - Formula string
   * @param testValues - Test értékek field-ekhez
   * @returns Evaluation result
   *
   * Note: Ezt csak tesztelésre használjuk, production-ben
   * a calculation service-ben történik a tényleges kiértékelés
   * mathjs library-val biztonságos környezetben
   */
  testEvaluate(
    formula: string,
    testValues: Record<string, number>,
  ): { success: boolean; result?: number; error?: string } {
    try {
      // Collapse newlines (mathjs treats \n as statement separator)
      const processedFormula = formula.replace(/\s*\n\s*/g, ' ');

      // Evaluate using mathjs (same engine as production)
      const scope = { ...testValues };
      const result = this.math.evaluate(processedFormula, scope);

      if (typeof result !== 'number' || !isFinite(result)) {
        return { success: false, error: 'Formula did not return a valid number' };
      }

      return { success: true, result: Math.round(result * 100) / 100 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
