/**
 * PriceDisplay Component
 *
 * Price transparency card showing original vs custom price
 * Based on Segment 1: Widget/Extension Modification PRD
 */

'use client';

import React from 'react';
import { calculateCustomPrice } from '@/lib/utils/priceCalculator';
import type { PriceCalculation } from '@/types/draft-order';

interface PriceDisplayProps {
  originalPrice: string | number;
  multiplier?: number;
  showComparison?: boolean;
  className?: string;
}

/**
 * Price Display Card
 *
 * Shows original price, custom price, and price difference
 *
 * @example
 * ```tsx
 * <PriceDisplay
 *   originalPrice="50.00"
 *   multiplier={2}
 *   showComparison={true}
 * />
 * ```
 */
export function PriceDisplay({
  originalPrice,
  multiplier = 2,
  showComparison = true,
  className = '',
}: PriceDisplayProps) {
  let priceCalc: PriceCalculation | null = null;
  let error: string | null = null;

  try {
    priceCalc = calculateCustomPrice(originalPrice, multiplier);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Invalid price';
  }

  if (error || !priceCalc) {
    return (
      <div className={`price-display error ${className}`}>
        <p className="text-sm text-red-600">
          {error || 'Unable to calculate price'}
        </p>
      </div>
    );
  }

  const percentageIncrease = ((multiplier - 1) * 100).toFixed(0);

  return (
    <div className={`price-display ${className}`}>
      {/* Custom Price (Main Display) */}
      <div className="custom-price mb-2">
        <span className="text-3xl font-bold text-gray-900">
          {priceCalc.formattedCustom}
        </span>
        {multiplier !== 1 && (
          <span className="ml-2 text-sm font-medium text-blue-600">
            ({multiplier}x price)
          </span>
        )}
      </div>

      {/* Price Comparison */}
      {showComparison && multiplier !== 1 && (
        <div className="price-comparison">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="line-through">
              Original: {priceCalc.formattedOriginal}
            </span>
            <span className="text-red-600 font-semibold">
              +{percentageIncrease}%
            </span>
          </div>

          {/* Price Breakdown */}
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-gray-700 mb-1 font-medium">
              Price Breakdown:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span className="font-medium">{priceCalc.formattedOriginal}</span>
              </div>
              <div className="flex justify-between">
                <span>Multiplier:</span>
                <span className="font-medium">{multiplier}x</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                <span className="font-semibold">Your Price:</span>
                <span className="font-bold text-blue-700">
                  {priceCalc.formattedCustom}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <p className="mt-2 text-xs text-gray-500 italic">
            This custom pricing applies to your checkout
          </p>
        </div>
      )}

      {/* No Multiplier Applied */}
      {multiplier === 1 && (
        <p className="text-sm text-gray-600">Standard pricing</p>
      )}
    </div>
  );
}

/**
 * Compact Price Display (for cart/list views)
 */
export function PriceDisplayCompact({
  originalPrice,
  multiplier = 2,
  className = '',
}: Omit<PriceDisplayProps, 'showComparison'>) {
  let priceCalc: PriceCalculation | null = null;

  try {
    priceCalc = calculateCustomPrice(originalPrice, multiplier);
  } catch {
    return null;
  }

  return (
    <div className={`price-display-compact inline-flex items-center gap-2 ${className}`}>
      <span className="text-lg font-bold text-gray-900">
        {priceCalc.formattedCustom}
      </span>
      {multiplier !== 1 && (
        <>
          <span className="text-sm text-gray-500 line-through">
            {priceCalc.formattedOriginal}
          </span>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {multiplier}x
          </span>
        </>
      )}
    </div>
  );
}
