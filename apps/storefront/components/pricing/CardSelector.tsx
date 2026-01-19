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
  label: string;
  required?: boolean;
  error?: string;
  columns?: 2 | 3 | 4; // Oszlopok száma
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  options,
  value,
  onChange,
  label,
  required = false,
  error,
  columns = 4,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className="card-selector">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Cards Grid */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                relative flex flex-col p-4 rounded-lg border-2 transition-all duration-200
                text-left cursor-pointer
                ${isSelected
                  ? 'border-pink-500 bg-pink-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
                }
              `}
            >
              {/* Selection Indicator */}
              <div className={`
                absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected
                  ? 'border-pink-500 bg-pink-500'
                  : 'border-gray-300 bg-white'
                }
              `}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Image */}
              {option.imageUrl && (
                <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={option.imageUrl}
                    alt={option.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <h4 className={`
                font-semibold text-sm mb-1
                ${isSelected ? 'text-pink-700' : 'text-gray-900'}
              `}>
                {option.label}
              </h4>

              {/* Description */}
              {option.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {option.description}
                </p>
              )}

              {/* Features */}
              {option.features && option.features.length > 0 && (
                <ul className="text-xs text-gray-600 mb-3 space-y-1">
                  {option.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-pink-500 mr-1">•</span>
                      <span className="line-clamp-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Price */}
              {option.price !== undefined && (
                <div className={`
                  mt-auto pt-2 border-t border-gray-100 text-sm font-semibold
                  ${isSelected ? 'text-pink-600' : 'text-gray-700'}
                `}>
                  {option.price > 0 ? (
                    <span>{formatPrice(option.price)}-tól</span>
                  ) : (
                    <span className="text-green-600">Alap ár</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Styles */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CardSelector;
