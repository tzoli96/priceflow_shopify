/**
 * Price Calculator Utility
 * Handles price calculations for Draft Orders with custom multipliers
 */

import type { PriceCalculation } from '@/types/draft-order';

/**
 * Default price multiplier (2x)
 */
export const DEFAULT_PRICE_MULTIPLIER = 2;

/**
 * Calculate custom price based on multiplier
 *
 * @param originalPrice - Original product price (string or number)
 * @param multiplier - Price multiplier (default: 2)
 * @returns Price calculation result with formatted values
 */
export function calculateCustomPrice(
  originalPrice: string | number,
  multiplier: number = DEFAULT_PRICE_MULTIPLIER
): PriceCalculation {
  // Convert to number
  const basePrice = typeof originalPrice === 'string'
    ? parseFloat(originalPrice)
    : originalPrice;

  if (isNaN(basePrice) || basePrice < 0) {
    throw new Error(`Invalid price: ${originalPrice}`);
  }

  if (multiplier <= 0) {
    throw new Error(`Invalid multiplier: ${multiplier}`);
  }

  // Calculate custom price
  const customPrice = basePrice * multiplier;

  // Calculate savings (negative means price increase)
  const savings = basePrice - customPrice;

  return {
    originalPrice: basePrice,
    customPrice: customPrice,
    multiplier: multiplier,
    savings: savings,
    formattedOriginal: formatPrice(basePrice),
    formattedCustom: formatPrice(customPrice),
    formattedSavings: formatPrice(Math.abs(savings)),
  };
}

/**
 * Calculate total price for multiple line items
 *
 * @param lineItems - Array of line items with prices and quantities
 * @returns Total price calculation
 */
export function calculateTotalPrice(
  lineItems: Array<{ customPrice: string | number; quantity: number }>
): { subtotal: number; formatted: string } {
  const subtotal = lineItems.reduce((total, item) => {
    const price = typeof item.customPrice === 'string'
      ? parseFloat(item.customPrice)
      : item.customPrice;
    return total + (price * item.quantity);
  }, 0);

  return {
    subtotal,
    formatted: formatPrice(subtotal),
  };
}

/**
 * Format price with currency symbol
 *
 * @param price - Price amount
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Parse price string to number
 * Handles various formats: "$10.99", "10,99", "10.99 USD"
 *
 * @param priceString - Price string to parse
 * @returns Parsed price number
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols and letters
  const cleaned = priceString.replace(/[^0-9.,]/g, '');

  // Handle comma as decimal separator (European format)
  const normalized = cleaned.replace(',', '.');

  const price = parseFloat(normalized);

  if (isNaN(price)) {
    throw new Error(`Cannot parse price: ${priceString}`);
  }

  return price;
}

/**
 * Validate price value
 *
 * @param price - Price to validate
 * @returns True if valid
 */
export function isValidPrice(price: string | number): boolean {
  try {
    const numPrice = typeof price === 'string' ? parsePrice(price) : price;
    return !isNaN(numPrice) && numPrice >= 0;
  } catch {
    return false;
  }
}

/**
 * Calculate price percentage difference
 *
 * @param originalPrice - Original price
 * @param newPrice - New price
 * @returns Percentage difference (positive means increase)
 */
export function calculatePricePercentage(
  originalPrice: number,
  newPrice: number
): number {
  if (originalPrice === 0) {
    return 0;
  }

  return ((newPrice - originalPrice) / originalPrice) * 100;
}

/**
 * Round price to 2 decimal places
 *
 * @param price - Price to round
 * @returns Rounded price
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}
