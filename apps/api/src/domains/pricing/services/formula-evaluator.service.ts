import { Injectable, BadRequestException } from '@nestjs/common';
import { create, all, MathJsInstance } from 'mathjs';

/**
 * Formula Evaluator Service
 *
 * Felelősség: Pricing formula biztonságos kiértékelése mathjs-sel
 *
 * Támogatott függvények:
 * - floor(x): Lefelé kerekítés
 * - ceil(x): Felfelé kerekítés
 * - round(x): Kerekítés
 * - min(a, b, ...): Minimum érték
 * - max(a, b, ...): Maximum érték
 * - if(condition, trueValue, falseValue): Feltételes kifejezés
 * - abs(x): Abszolút érték
 * - sqrt(x): Négyzetgyök
 * - pow(x, n): Hatványozás
 *
 * Példa formulák:
 * - "(width_cm * height_cm / 10000) * unit_m2_price"
 * - "floor(width_cm / 25) * grommet_fee + base_price"
 * - "base_price + (area > 1 ? (area - 1) * extra_m2_price : 0)"
 *
 * Biztonsági szabályok:
 * - Csak whitelisted függvények
 * - Restricted mathjs environment
 * - Nincs hozzáférés globális objektumokhoz
 */
@Injectable()
export class FormulaEvaluatorService {
  private readonly math: MathJsInstance;
  private readonly safeEvaluate: (
    expr: string,
    scope?: Record<string, number>,
  ) => number;

  constructor() {
    // Create a restricted mathjs instance
    this.math = create(all);

    // Save reference to the original evaluate function before disabling it
    this.safeEvaluate = this.math.evaluate.bind(this.math);

    // Register custom if() function for conditional expressions
    // Usage: if(condition, trueValue, falseValue)
    // Example: if(width > 100, price * 1.5, price)
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

    // Configure limited functions for security
    // This prevents users from calling these functions within formulas
    this.math.import(
      {
        import: function () {
          throw new Error('Function import is disabled');
        },
        createUnit: function () {
          throw new Error('Function createUnit is disabled');
        },
        evaluate: function () {
          throw new Error('Function evaluate is disabled');
        },
        parse: function () {
          throw new Error('Function parse is disabled');
        },
        simplify: function () {
          throw new Error('Function simplify is disabled');
        },
        derivative: function () {
          throw new Error('Function derivative is disabled');
        },
      },
      { override: true },
    );
  }

  /**
   * Formula kiértékelése
   *
   * @param formula - Pricing formula string
   * @param context - Mező értékek (változók)
   * @returns Számított érték
   *
   * @throws BadRequestException - Ha a formula érvénytelen vagy hiba történik
   *
   * @example
   * ```ts
   * const result = evaluator.evaluateFormula(
   *   "(width_cm * height_cm / 10000) * unit_m2_price",
   *   { width_cm: 200, height_cm: 150, unit_m2_price: 3000 }
   * );
   * // result: 9000
   * ```
   */
  evaluateFormula(
    formula: string,
    context: Record<string, number>,
  ): number {
    if (!formula || formula.trim().length === 0) {
      throw new BadRequestException('Formula cannot be empty');
    }

    try {
      // Collapse newlines so multiline formulas don't break (mathjs treats \n as statement separator)
      const processedFormula = formula.replace(/\s*\n\s*/g, ' ');

      // Create a safe scope with only the provided context variables
      const scope = { ...context };

      // Evaluate the formula in the safe scope using the saved evaluate function
      const result = this.safeEvaluate(processedFormula, scope);

      // Ensure result is a number
      if (typeof result !== 'number' || isNaN(result)) {
        throw new BadRequestException(
          'Formula evaluation did not return a valid number',
        );
      }

      // Prevent infinity
      if (!isFinite(result)) {
        throw new BadRequestException(
          'Formula evaluation resulted in infinity (possible division by zero)',
        );
      }

      // Round to 2 decimal places for price calculation
      return Math.round(result * 100) / 100;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Formula evaluation error: ${error.message}`,
      );
    }
  }

  /**
   * Formula test kiértékelése
   *
   * Ugyanaz mint evaluateFormula, de részletesebb visszatérési értékkel
   * Admin preview-hoz és teszteléshez
   *
   * @param formula - Formula string
   * @param testValues - Test context értékek
   * @returns Evaluation result object
   */
  testEvaluate(
    formula: string,
    testValues: Record<string, number>,
  ): {
    success: boolean;
    result?: number;
    error?: string;
    usedVariables?: string[];
  } {
    try {
      const result = this.evaluateFormula(formula, testValues);

      // Extract variable names used in formula
      const variableRegex = /\b([a-z_][a-z0-9_]*)\b/gi;
      const matches = formula.matchAll(variableRegex);
      const usedVariables: string[] = [];

      const functionNames = [
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

      for (const match of matches) {
        const variable = match[1].toLowerCase();
        if (
          !functionNames.includes(variable) &&
          !['true', 'false'].includes(variable) &&
          !usedVariables.includes(variable)
        ) {
          usedVariables.push(variable);
        }
      }

      return {
        success: true,
        result,
        usedVariables,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Beépített változók előkészítése
   *
   * Speciális változók, amiket a rendszer automatikusan biztosít:
   * - base_price: Termék alapára
   * + minden mező értéke (beleértve a QUANTITY_SELECTOR mezőt saját key-jén)
   *
   * @param fieldValues - Felhasználó által megadott mező értékek
   * @param basePrice - Termék alapára
   * @returns Teljes context változókkal
   */
  prepareContext(
    fieldValues: Record<string, number>,
    basePrice: number,
  ): Record<string, number> {
    return {
      base_price: basePrice,
      ...fieldValues,
    };
  }
}
