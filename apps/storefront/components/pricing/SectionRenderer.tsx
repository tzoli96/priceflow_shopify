/**
 * SectionRenderer Component
 *
 * Renders template sections based on their layout type.
 * Supports: VERTICAL, HORIZONTAL, GRID, SPLIT, CHECKBOX_LIST
 */

'use client';

import React from 'react';
import type {
  TemplateSection,
  TemplateField,
  LayoutType,
  BuiltInSectionType,
  FieldOption,
} from '@/types/pricing';
import { CollapsibleSection } from './CollapsibleSection';
import { CardSelector } from './CardSelector';
import { ProductCardSelector } from './ProductCardSelector';
import { DeliveryTimeSelector } from './DeliveryTimeSelector';
import { ExtrasSelector } from './ExtrasSelector';

interface SectionRendererProps {
  section: TemplateSection;
  sectionNumber: number;
  fieldValues: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
  formatPrice: (price: number) => string;
  // Built-in section content (for QUANTITY, EXPRESS, NOTES, FILE_UPLOAD)
  builtInContent?: React.ReactNode;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  sectionNumber,
  fieldValues,
  onFieldChange,
  formatPrice,
  builtInContent,
}) => {
  // If it's a built-in section type, render the provided content
  if (section.builtInType && builtInContent) {
    return (
      <CollapsibleSection
        number={section.showNumber ? sectionNumber : 0}
        title={section.title}
        defaultOpen={section.defaultOpen}
      >
        {builtInContent}
      </CollapsibleSection>
    );
  }

  // Render fields based on layout type
  const renderFields = () => {
    const fields = section.fields || [];

    switch (section.layoutType) {
      case 'VERTICAL':
        return <VerticalLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} />;

      case 'HORIZONTAL':
        return <HorizontalLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} />;

      case 'GRID':
        return <GridLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} columnsCount={section.columnsCount || 4} />;

      case 'SPLIT':
        return <SplitLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} />;

      case 'CHECKBOX_LIST':
        return <CheckboxListLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} />;

      default:
        return <VerticalLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} />;
    }
  };

  return (
    <CollapsibleSection
      number={section.showNumber ? sectionNumber : 0}
      title={section.title}
      defaultOpen={section.defaultOpen}
    >
      {section.description && (
        <p className="section-description">{section.description}</p>
      )}
      {renderFields()}
    </CollapsibleSection>
  );
};

// ============================================================================
// Layout Components
// ============================================================================

interface LayoutProps {
  fields: TemplateField[];
  fieldValues: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
  formatPrice: (price: number) => string;
}

/**
 * VERTICAL Layout - Fields stacked vertically
 */
const VerticalLayout: React.FC<LayoutProps> = ({ fields, fieldValues, onFieldChange, formatPrice }) => {
  return (
    <div className="section-layout-vertical">
      {fields.map((field) => (
        <div key={field.key} className="section-field">
          <FieldRenderer
            field={field}
            value={fieldValues[field.key]}
            onChange={(value) => onFieldChange(field.key, value)}
            formatPrice={formatPrice}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * HORIZONTAL Layout - Fields side by side
 */
const HorizontalLayout: React.FC<LayoutProps> = ({ fields, fieldValues, onFieldChange, formatPrice }) => {
  return (
    <div className="section-layout-horizontal">
      {fields.map((field) => (
        <div key={field.key} className="section-field">
          <FieldRenderer
            field={field}
            value={fieldValues[field.key]}
            onChange={(value) => onFieldChange(field.key, value)}
            formatPrice={formatPrice}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * GRID Layout - Card-based grid (for SELECT/RADIO/PRODUCT_CARD with card style)
 */
const GridLayout: React.FC<LayoutProps & { columnsCount: number }> = ({
  fields,
  fieldValues,
  onFieldChange,
  formatPrice,
  columnsCount,
}) => {
  // For GRID layout, check for PRODUCT_CARD first, then SELECT/RADIO
  const productCardField = fields.find((f) => f.type === 'PRODUCT_CARD');
  const selectField = fields.find((f) => f.type === 'SELECT' || f.type === 'RADIO');

  // PRODUCT_CARD gets priority
  if (productCardField && productCardField.options) {
    return (
      <ProductCardSelector
        options={productCardField.options}
        value={fieldValues[productCardField.key] || ''}
        onChange={(value) => onFieldChange(productCardField.key, value)}
        label={productCardField.label}
        columns={columnsCount as 2 | 3 | 4}
        required={productCardField.required}
      />
    );
  }

  // Then check for regular SELECT/RADIO
  if (selectField && selectField.options) {
    return (
      <CardSelector
        options={selectField.options}
        value={fieldValues[selectField.key] || ''}
        onChange={(value) => onFieldChange(selectField.key, value)}
        label={selectField.label}
        columns={columnsCount as 2 | 3 | 4}
        required={selectField.required}
      />
    );
  }

  // Fallback to vertical layout if no select field
  return <VerticalLayout fields={fields} fieldValues={fieldValues} onFieldChange={onFieldChange} formatPrice={formatPrice} />;
};

/**
 * SPLIT Layout - Left: inputs, Right: presets (for size selection)
 */
const SplitLayout: React.FC<LayoutProps> = ({ fields, fieldValues, onFieldChange, formatPrice }) => {
  const numberFields = fields.filter((f) => f.type === 'NUMBER');

  // Get combined presets from fields
  const getCombinedPresets = () => {
    for (const field of numberFields) {
      if (field.presetValues?.some((p) => typeof p.value === 'object')) {
        return field.presetValues.filter((p) => typeof p.value === 'object');
      }
    }
    return [];
  };

  const presets = getCombinedPresets();

  const handlePresetClick = (preset: { label: string; value: any }) => {
    if (typeof preset.value === 'object') {
      const values = preset.value as Record<string, number>;
      Object.entries(values).forEach(([key, val]) => {
        if (numberFields.some((f) => f.key === key)) {
          onFieldChange(key, val);
        }
      });
    }
  };

  return (
    <div className="dekormunka-size-section">
      <div className="dekormunka-size-row">
        {/* Left side - Size inputs */}
        <div className="dekormunka-size-inputs-col">
          {numberFields.map((field) => (
            <div key={field.key} className="dekormunka-size-input-group">
              <label className="dekormunka-label">{field.label}</label>
              <div className="dekormunka-input-with-unit">
                <input
                  type="number"
                  className="dekormunka-input"
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => onFieldChange(field.key, Number(e.target.value))}
                  min={field.validation?.min}
                  max={field.validation?.max}
                  step={field.validation?.step || 1}
                  placeholder={field.placeholder}
                />
                <span className="dekormunka-unit">cm</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right side - Combined size presets */}
        {presets.length > 0 && (
          <div className="dekormunka-size-presets-col">
            <label className="dekormunka-label">Gyakori méretek</label>
            <div className="dekormunka-combined-presets">
              {presets.map((preset, idx) => {
                const presetValue = preset.value as Record<string, number>;
                const isSelected = Object.entries(presetValue).some(
                  ([key, val]) => fieldValues[key] === val
                );
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`dekormunka-preset-chip ${isSelected ? 'selected' : ''}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * CHECKBOX_LIST Layout - Checkbox cards with description (for extras)
 */
const CheckboxListLayout: React.FC<LayoutProps> = ({ fields, fieldValues, onFieldChange, formatPrice }) => {
  const checkboxFields = fields.filter((f) => f.type === 'CHECKBOX');

  return (
    <div className="dekormunka-extras">
      {checkboxFields.map((field) => (
        <label key={field.key} className="dekormunka-checkbox-card">
          <input
            type="checkbox"
            checked={!!fieldValues[field.key]}
            onChange={(e) => onFieldChange(field.key, e.target.checked)}
          />
          <div className="dekormunka-checkbox-content">
            <span className="dekormunka-checkbox-label">{field.label}</span>
            {field.helpText && (
              <span className="dekormunka-checkbox-help">{field.helpText}</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

// ============================================================================
// Field Renderer (generic)
// ============================================================================

interface FieldRendererProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
  formatPrice: (price: number) => string;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, formatPrice }) => {
  switch (field.type) {
    case 'NUMBER':
      return (
        <div className="dekormunka-size-input-group">
          <label className="dekormunka-label">{field.label}</label>
          <div className="dekormunka-input-with-unit">
            <input
              type="number"
              className="dekormunka-input"
              value={value || ''}
              onChange={(e) => onChange(Number(e.target.value))}
              min={field.validation?.min}
              max={field.validation?.max}
              step={field.validation?.step || 1}
              placeholder={field.placeholder}
            />
            {field.key.includes('width') || field.key.includes('height') ||
             field.key.includes('szelesseg') || field.key.includes('magassag') ? (
              <span className="dekormunka-unit">cm</span>
            ) : null}
          </div>
        </div>
      );

    case 'PRODUCT_CARD':
      if (field.options) {
        return (
          <ProductCardSelector
            options={field.options}
            value={value || ''}
            onChange={onChange}
            label={field.label}
            columns={field.options.length <= 2 ? 2 : 4}
            required={field.required}
          />
        );
      }
      return null;

    case 'DELIVERY_TIME':
      if (field.options) {
        return (
          <DeliveryTimeSelector
            options={field.options}
            value={value || ''}
            onChange={onChange}
            label={field.label}
            required={field.required}
          />
        );
      }
      return null;

    case 'EXTRAS':
      if (field.options) {
        return (
          <ExtrasSelector
            options={field.options}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            label={field.label}
            required={field.required}
            columns={field.options.length <= 2 ? 2 : 2}
          />
        );
      }
      return null;

    case 'SELECT':
    case 'RADIO':
      if (field.displayStyle === 'card' && field.options) {
        return (
          <CardSelector
            options={field.options}
            value={value || ''}
            onChange={onChange}
            label={field.label}
            columns={field.options.length <= 2 ? 2 : 4}
            required={field.required}
          />
        );
      }

      if (field.displayStyle === 'chip' && field.options) {
        return (
          <div>
            <label className="dekormunka-label">{field.label}</label>
            <div className="dekormunka-chip-group">
              {field.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={`dekormunka-chip ${value === option.value ? 'selected' : ''}`}
                >
                  {option.label}
                  {option.price !== undefined && option.price > 0 && (
                    <span className="dekormunka-chip-price">+{formatPrice(option.price)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      }

      // Default radio style
      return (
        <div>
          <label className="dekormunka-label">{field.label}</label>
          <div className="dekormunka-radio-cards">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className={`dekormunka-radio-card ${value === option.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={field.key}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                <div className="dekormunka-radio-card-content">
                  <span className="dekormunka-radio-card-label">{option.label}</span>
                  {option.price !== undefined && option.price > 0 && (
                    <span className="dekormunka-radio-card-price">+{formatPrice(option.price)}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      );

    case 'CHECKBOX':
      return (
        <label className="dekormunka-checkbox-card">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="dekormunka-checkbox-content">
            <span className="dekormunka-checkbox-label">{field.label}</span>
            {field.helpText && (
              <span className="dekormunka-checkbox-help">{field.helpText}</span>
            )}
          </div>
        </label>
      );

    case 'TEXT':
      return (
        <div className="dekormunka-size-input-group">
          <label className="dekormunka-label">{field.label}</label>
          <input
            type="text"
            className="dekormunka-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );

    case 'TEXTAREA':
      return (
        <div className="dekormunka-notes-section">
          <label className="dekormunka-label">{field.label}</label>
          <textarea
            className="dekormunka-notes-textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        </div>
      );

    default:
      return null;
  }
};

export default SectionRenderer;
