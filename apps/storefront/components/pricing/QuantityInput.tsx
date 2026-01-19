/**
 * QuantityInput Component
 *
 * Quantity selector with +/- buttons and validation.
 */

'use client';

import React from 'react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  error?: string | null;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  error,
}: QuantityInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      onChange(newValue);
    }
  };

  return (
    <div className="priceflow-quantity">
      <label className="priceflow-quantity-label">Mennyiség</label>

      <div className="priceflow-quantity-controls">
        <button
          type="button"
          className="priceflow-quantity-btn priceflow-quantity-minus"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Csökkentés"
        >
          −
        </button>

        <input
          type="number"
          className="priceflow-quantity-input"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
        />

        <button
          type="button"
          className="priceflow-quantity-btn priceflow-quantity-plus"
          onClick={handleIncrement}
          disabled={max !== undefined && value >= max}
          aria-label="Növelés"
        >
          +
        </button>
      </div>

      {error && <div className="priceflow-quantity-error">{error}</div>}
    </div>
  );
}
