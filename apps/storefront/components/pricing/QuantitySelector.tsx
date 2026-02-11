/**
 * QuantitySelector Component
 *
 * Quantity selector with +/- buttons and preset values
 * Matches Dekormunka design from dekormunka_pc.jpg and dekormunka_mobil.jpg
 */

'use client';

import React from 'react';
import type { FieldOption } from '@/types/pricing';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: FieldOption[]; // Preset values from field.options
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  error?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  options = [],
  min = 1,
  max,
  step = 1,
  required,
  error,
}) => {
  const handleIncrement = () => {
    const newValue = value + step;
    if (!max || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && (!max || newValue <= max)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (presetValue: number) => {
    if (presetValue >= min && (!max || presetValue <= max)) {
      onChange(presetValue);
    }
  };

  // Parse preset values from options
  // Options can have value like "1", "5", "10", etc.
  const presets = options
    .map((opt) => {
      const val = parseInt(opt.value, 10);
      return {
        value: val,
        label: opt.label || `${val} db`,
      };
    })
    .filter((p) => !isNaN(p.value));

  return (
    <div className="dekormunka-quantity-section">
      {/* Main quantity controls */}
      <div className="dekormunka-quantity-controls">
        <button
          type="button"
          className="dekormunka-qty-btn"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Mennyiség csökkentése"
        >
          −
        </button>
        <input
          type="number"
          className="dekormunka-qty-input"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          required={required}
          aria-label="Mennyiség"
        />
        <button
          type="button"
          className="dekormunka-qty-btn"
          onClick={handleIncrement}
          disabled={max ? value >= max : false}
          aria-label="Mennyiség növelése"
        >
          +
        </button>
      </div>

      {/* Preset buttons */}
      {presets.length > 0 && (
        <div className="dekormunka-qty-presets">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              className={`dekormunka-qty-preset ${value === preset.value ? 'selected' : ''}`}
              aria-label={`${preset.label} kiválasztása`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && <div className="dekormunka-qty-error">{error}</div>}
    </div>
  );
};

export default QuantitySelector;
