/**
 * ExpressSelector Component
 *
 * Radio selector for normal vs express production option.
 */

'use client';

import React from 'react';

interface ExpressSelectorProps {
  isExpress: boolean;
  onChange: (isExpress: boolean) => void;
  normalLabel: string;
  expressLabel: string;
  normalPrice?: number;
  expressPrice?: number;
  expressMultiplier?: number;
}

export function ExpressSelector({
  isExpress,
  onChange,
  normalLabel,
  expressLabel,
  normalPrice,
  expressPrice,
  expressMultiplier,
}: ExpressSelectorProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="priceflow-express-selector">
      <div className="priceflow-express-title">Gyártási idő</div>

      <div className="priceflow-express-options">
        {/* Normal option */}
        <label
          className={`priceflow-express-option ${!isExpress ? 'selected' : ''}`}
        >
          <input
            type="radio"
            name="express-option"
            checked={!isExpress}
            onChange={() => onChange(false)}
          />
          <div className="priceflow-express-content">
            <span className="priceflow-express-label">{normalLabel}</span>
            {normalPrice !== undefined && (
              <span className="priceflow-express-price">
                {formatPrice(normalPrice)}
              </span>
            )}
          </div>
        </label>

        {/* Express option */}
        <label
          className={`priceflow-express-option ${isExpress ? 'selected' : ''}`}
        >
          <input
            type="radio"
            name="express-option"
            checked={isExpress}
            onChange={() => onChange(true)}
          />
          <div className="priceflow-express-content">
            <div className="priceflow-express-label-wrapper">
              <span className="priceflow-express-label">{expressLabel}</span>
              {expressMultiplier && expressMultiplier > 1 && (
                <span className="priceflow-express-badge">
                  +{Math.round((expressMultiplier - 1) * 100)}%
                </span>
              )}
            </div>
            {expressPrice !== undefined && (
              <span className="priceflow-express-price">
                {formatPrice(expressPrice)}
              </span>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
