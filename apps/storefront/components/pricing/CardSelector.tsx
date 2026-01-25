/**
 * CardSelector Component
 * Kártyás megjelenítésű választó SELECT/RADIO mezőkhöz
 * Dekormunka design alapján
 */

'use client';

import React from 'react';
import type { FieldOption } from '@/types/pricing';

interface CardSelectorProps {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  columns?: 2 | 3 | 4;
  showFeatures?: boolean;
  showDescription?: boolean;
  compact?: boolean;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  options,
  value,
  onChange,
  label,
  required = false,
  error,
  columns = 4,
  showFeatures = true,
  showDescription = true,
  compact = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' Ft';
  };

  return (
    <div className={`card-selector ${compact ? 'card-selector-compact' : ''}`}>
      {label && (
        <label className="card-selector-label">
          {label}
          {required && <span className="card-selector-required">*</span>}
        </label>
      )}

      <div className={`card-selector-grid card-selector-grid-${columns}`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const hasImage = !!option.imageUrl;
          const hasFeatures = showFeatures && option.features && option.features.length > 0;
          const hasDescription = showDescription && option.description;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`card-selector-card ${isSelected ? 'selected' : ''} ${hasImage ? 'with-image' : ''} ${compact ? 'compact' : ''}`}
            >
              {/* Selection indicator */}
              <div className={`card-selector-check ${isSelected ? 'selected' : ''}`}>
                {isSelected && (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Image */}
              {hasImage && (
                <div className="card-selector-image">
                  <img src={option.imageUrl} alt={option.label} loading="lazy" />
                </div>
              )}

              {/* Content */}
              <div className="card-selector-content">
                <h4 className="card-selector-title">{option.label}</h4>

                {hasDescription && (
                  <p className="card-selector-description">{option.description}</p>
                )}

                {hasFeatures && (
                  <ul className="card-selector-features">
                    {option.features!.slice(0, 6).map((feature, idx) => (
                      <li key={idx}>
                        <span className="card-selector-bullet">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price */}
              {option.price !== undefined && (
                <div className="card-selector-price">
                  {option.price > 0 ? (
                    <span className="card-selector-price-value">{formatPrice(option.price)}-tól</span>
                  ) : (
                    <span className="card-selector-price-included">Alap árban</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="card-selector-error">{error}</p>}
    </div>
  );
};

export default CardSelector;
