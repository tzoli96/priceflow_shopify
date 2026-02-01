/**
 * ConfigSummary Component
 * Összegző sidebar a konfigurátor mellett
 * Dekormunka design alapján - sticky sidebar jobb oldalon
 */

'use client';

import React from 'react';
import type { PriceCalculationResult, TemplateField, FieldOption } from '@/types/pricing';

interface ConfigSummaryProps {
  productTitle: string;
  productImage: string;
  fields: TemplateField[];
  fieldValues: Record<string, any>;
  quantity: number;
  isExpress: boolean;
  expressLabel?: string;
  normalLabel?: string;
  priceResult: PriceCalculationResult | null;
  calculating: boolean;
  discountPercent?: number;
  hasNotesField?: boolean;
  notesFieldLabel?: string;
  notes?: string;
  onAddToCart: () => void;
  isFormValid: boolean;
  className?: string;
}

export const ConfigSummary: React.FC<ConfigSummaryProps> = ({
  productTitle,
  productImage,
  fields,
  fieldValues,
  quantity,
  isExpress,
  expressLabel = 'Expressz gyártás',
  normalLabel = 'Normál gyártás',
  priceResult,
  calculating,
  discountPercent,
  hasNotesField,
  notesFieldLabel,
  notes,
  onAddToCart,
  isFormValid,
  className = '',
}) => {
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get display value for a field
  const getFieldDisplayValue = (field: TemplateField): string | null => {
    const value = fieldValues[field.key];

    if (value === undefined || value === '' || value === null) {
      return null;
    }

    switch (field.type) {
      case 'NUMBER':
        return `${value}${field.validation?.step === 0.01 ? '' : ''}`;
      case 'SELECT':
      case 'RADIO':
        const option = field.options?.find((o: FieldOption) => o.value === value);
        if (option) {
          return option.price && option.price > 0
            ? `${option.label} (+${formatPrice(option.price)})`
            : option.label;
        }
        return value;
      case 'CHECKBOX':
        return value ? 'Igen' : 'Nem';
      default:
        return value.toString();
    }
  };

  // Get filled fields with values
  const filledFields = fields
    .filter((field) => {
      const value = fieldValues[field.key];
      return value !== undefined && value !== '' && value !== null;
    })
    .sort((a, b) => a.order - b.order);

  return (
    <div className={`config-summary ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-4">
        {/* Header with product image and title */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 text-white">
          <div className="flex items-center gap-3">
            {productImage && (
              <img
                src={productImage}
                alt={productTitle}
                className="w-16 h-16 rounded-lg object-cover border-2 border-white/30"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{productTitle}</h3>
              <p className="text-sm text-pink-100">Konfiguráció összegzése</p>
            </div>
          </div>
        </div>

        {/* Selections summary */}
        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Kiválasztott opciók
          </h4>

          {filledFields.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Válassz opciókat a bal oldali űrlapon
            </p>
          ) : (
            <ul className="space-y-2">
              {filledFields.map((field) => {
                const displayValue = getFieldDisplayValue(field);
                if (!displayValue) return null;

                return (
                  <li key={field.key} className="flex justify-between items-start text-sm">
                    <span className="text-gray-600">{field.label}:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">
                      {displayValue}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Quantity */}
          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-600">Mennyiség:</span>
            <span className="font-medium text-gray-900">{quantity} db</span>
          </div>

          {/* Express/Normal */}
          {(expressLabel || normalLabel) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Gyártás:</span>
              <span className={`font-medium ${isExpress ? 'text-pink-600' : 'text-gray-900'}`}>
                {isExpress ? expressLabel : normalLabel}
              </span>
            </div>
          )}

          {/* Notes */}
          {hasNotesField && notes && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{notesFieldLabel || 'Megjegyzés'}:</span>
              <p className="text-sm text-gray-700 mt-1 italic">{notes}</p>
            </div>
          )}
        </div>

        {/* Price section */}
        <div className="p-4 bg-gray-50">
          {/* Price breakdown - detailed */}
          {priceResult?.breakdown && priceResult.breakdown.length > 0 && (
            <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200">
              {priceResult.breakdown
                .filter((item) => item.type !== 'total')
                .map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between text-xs ${
                      item.type === 'base'
                        ? 'text-gray-600 font-medium'
                        : item.type === 'calculation'
                        ? 'text-blue-600 font-medium'
                        : item.value < 0
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    <span className="flex-1 pr-2">{item.label}</span>
                    <span className="whitespace-nowrap">
                      {item.value < 0 ? '' : '+'}
                      {formatPrice(item.value)}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Discount badge */}
          {discountPercent && discountPercent > 0 && (
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                -{discountPercent}% kedvezmény
              </span>
              {priceResult?.priceBeforeDiscount && (
                <span className="text-gray-400 line-through text-sm">
                  {formatPrice(priceResult.priceBeforeDiscount)}
                </span>
              )}
            </div>
          )}

          {/* Final price */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Összesen:</span>
            {calculating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400">Számolás...</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-pink-600">
                {priceResult ? formatPrice(priceResult.calculatedPrice) : '-'}
              </span>
            )}
          </div>

          {/* Unit price if quantity > 1 */}
          {quantity > 1 && priceResult && (
            <div className="text-right text-xs text-gray-500 mt-1">
              ({formatPrice(priceResult.calculatedPrice / quantity)} / db)
            </div>
          )}
        </div>

        {/* Add to cart button */}
        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!isFormValid || calculating || !priceResult}
            className={`
              w-full py-3 px-6 rounded-lg font-semibold text-white
              transition-all duration-200 flex items-center justify-center gap-2
              ${isFormValid && !calculating && priceResult
                ? 'bg-pink-500 hover:bg-pink-600 shadow-md hover:shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Kosárba teszem
          </button>

          {!isFormValid && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Kérjük, töltse ki az összes kötelező mezőt
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigSummary;
