/**
 * ConfiguratorField Component
 *
 * Renders a single form field based on its type and display style.
 * Supports card-based selection and preset value chips.
 */

'use client';

import React from 'react';
import type { TemplateField } from '@/types/pricing';
import { CardSelector } from './CardSelector';
import { PresetChips } from './PresetChips';

interface ConfiguratorFieldProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function ConfiguratorField({
  field,
  value,
  onChange,
  error,
}: ConfiguratorFieldProps) {
  const { type, label, required, placeholder, helpText, validation, options, displayStyle, presetValues } =
    field;

  const inputId = `field-${field.key}`;

  // Card display style for SELECT/RADIO
  if ((type === 'SELECT' || type === 'RADIO') && displayStyle === 'card' && options) {
    return (
      <div className={`priceflow-field priceflow-field-card`}>
        <CardSelector
          options={options}
          value={value || ''}
          onChange={onChange}
          label={label}
          required={required}
          error={error}
          columns={options.length <= 2 ? 2 : options.length <= 3 ? 3 : 4}
        />
        {helpText && <div className="priceflow-help-text">{helpText}</div>}
      </div>
    );
  }

  const renderField = () => {
    switch (type) {
      case 'NUMBER':
        return (
          <>
            <input
              id={inputId}
              type="number"
              className="priceflow-input priceflow-input-number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
              placeholder={placeholder}
              required={required}
              min={validation?.min}
              max={validation?.max}
              step={validation?.step || 1}
            />
            {presetValues && presetValues.length > 0 && (
              <div className="mt-2">
                <PresetChips
                  presets={presetValues}
                  currentValue={value}
                  onSelect={onChange}
                  label="Gyors választás:"
                />
              </div>
            )}
          </>
        );

      case 'TEXT':
        return (
          <input
            id={inputId}
            type="text"
            className="priceflow-input priceflow-input-text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            minLength={validation?.minLength}
            maxLength={validation?.maxLength}
            pattern={validation?.pattern}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            id={inputId}
            className="priceflow-input priceflow-textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            minLength={validation?.minLength}
            maxLength={validation?.maxLength}
            rows={4}
          />
        );

      case 'SELECT':
        // Chip style rendering
        if (displayStyle === 'chip' && options) {
          return (
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  className={`
                    px-4 py-2 text-sm rounded-full border transition-all duration-200
                    ${value === opt.value
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400 hover:text-pink-600'
                    }
                  `}
                >
                  {opt.label}
                  {opt.price !== undefined && opt.price > 0 && (
                    <span className="ml-1 text-xs opacity-75">+{formatPrice(opt.price)}</span>
                  )}
                </button>
              ))}
            </div>
          );
        }
        // Default select dropdown
        return (
          <select
            id={inputId}
            className="priceflow-input priceflow-select"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
          >
            {!required && <option value="">Válasszon...</option>}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {opt.price !== undefined && opt.price > 0 && ` (+${formatPrice(opt.price)})`}
              </option>
            ))}
          </select>
        );

      case 'RADIO':
        // Chip style rendering for RADIO
        if (displayStyle === 'chip' && options) {
          return (
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  className={`
                    px-4 py-2 text-sm rounded-full border transition-all duration-200
                    ${value === opt.value
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400 hover:text-pink-600'
                    }
                  `}
                >
                  {opt.label}
                  {opt.price !== undefined && opt.price > 0 && (
                    <span className="ml-1 text-xs opacity-75">+{formatPrice(opt.price)}</span>
                  )}
                </button>
              ))}
            </div>
          );
        }
        // Default radio group
        return (
          <div className="priceflow-radio-group">
            {options?.map((opt) => (
              <label
                key={opt.value}
                className={`priceflow-radio-option ${value === opt.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={field.key}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  required={required}
                />
                <span className="priceflow-radio-label">
                  {opt.label}
                  {opt.price !== undefined && opt.price > 0 && (
                    <span className="priceflow-option-price">
                      +{formatPrice(opt.price)}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <label className="priceflow-checkbox-label">
            <input
              id={inputId}
              type="checkbox"
              className="priceflow-checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>{label}</span>
          </label>
        );

      case 'FILE':
        return (
          <input
            id={inputId}
            type="file"
            className="priceflow-input priceflow-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onChange(file || null);
            }}
            required={required}
          />
        );

      default:
        return (
          <input
            id={inputId}
            type="text"
            className="priceflow-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
          />
        );
    }
  };

  // Checkbox has its own label structure
  if (type === 'CHECKBOX') {
    return (
      <div className="priceflow-field priceflow-field-checkbox">
        {renderField()}
        {helpText && <div className="priceflow-help-text">{helpText}</div>}
      </div>
    );
  }

  return (
    <div className={`priceflow-field priceflow-field-${type.toLowerCase()}`}>
      <label htmlFor={inputId} className="priceflow-label">
        {label}
        {required && <span className="priceflow-required">*</span>}
      </label>
      {renderField()}
      {helpText && <div className="priceflow-help-text">{helpText}</div>}
      {error && <div className="priceflow-error text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
