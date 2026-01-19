/**
 * ConfiguratorField Component
 *
 * Renders a single form field based on its type.
 */

'use client';

import React from 'react';
import type { TemplateField } from '@/types/pricing';

interface ConfiguratorFieldProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
}

export function ConfiguratorField({
  field,
  value,
  onChange,
}: ConfiguratorFieldProps) {
  const { type, label, required, placeholder, helpText, validation, options } =
    field;

  const inputId = `field-${field.key}`;

  const renderField = () => {
    switch (type) {
      case 'NUMBER':
        return (
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
