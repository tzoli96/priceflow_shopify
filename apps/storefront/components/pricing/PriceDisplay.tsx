/**
 * PriceDisplay Component
 *
 * Shows calculated price with breakdown and discount info.
 */

'use client';

import React, { useState } from 'react';
import type { PriceCalculationResult } from '@/types/pricing';

interface PriceDisplayProps {
  result: PriceCalculationResult | null;
  calculating: boolean;
  currency?: string;
}

export function PriceDisplay({
  result,
  calculating,
  currency = 'HUF',
}: PriceDisplayProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!result && !calculating) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="priceflow-price-display">
      {/* Main price */}
      <div className="priceflow-price-main">
        <span className="priceflow-price-label">Végösszeg:</span>
        <span className={`priceflow-price-value ${calculating ? 'calculating' : ''}`}>
          {calculating ? (
            <span className="priceflow-price-calculating">Számítás...</span>
          ) : (
            result?.formattedPrice || '-'
          )}
        </span>
      </div>

      {/* Discount badge */}
      {result?.discountPercent && (
        <div className="priceflow-discount-badge">
          -{result.discountPercent}% kedvezmény
          {result.priceBeforeDiscount && (
            <span className="priceflow-original-price">
              {formatPrice(result.priceBeforeDiscount)}
            </span>
          )}
        </div>
      )}

      {/* Breakdown toggle */}
      {result && result.breakdown.length > 0 && (
        <button
          type="button"
          className="priceflow-breakdown-toggle"
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          {showBreakdown ? 'Részletek elrejtése' : 'Részletek megtekintése'}
          <span className={`priceflow-arrow ${showBreakdown ? 'up' : 'down'}`}>
            ▼
          </span>
        </button>
      )}

      {/* Breakdown details */}
      {showBreakdown && result && (
        <div className="priceflow-breakdown">
          {result.breakdown.map((item, index) => (
            <div
              key={index}
              className={`priceflow-breakdown-item priceflow-breakdown-${item.type}`}
            >
              <span className="priceflow-breakdown-label">{item.label}</span>
              <span className="priceflow-breakdown-value">
                {item.type !== 'total' && item.type !== 'base' && item.value > 0 ? '+' : ''}
                {formatPrice(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
