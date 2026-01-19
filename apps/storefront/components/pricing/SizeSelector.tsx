/**
 * SizeSelector Component
 * Dekormunka-style size selection with dropdowns and preset chips
 */

'use client';

import React from 'react';
import type { TemplateField, PresetValue } from '@/types/pricing';

interface SizeSelectorProps {
  widthField?: TemplateField;
  heightField?: TemplateField;
  widthValue: number;
  heightValue: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  presets?: PresetValue[];
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  widthField,
  heightField,
  widthValue,
  heightValue,
  onWidthChange,
  onHeightChange,
  presets,
}) => {
  // Handle preset selection (sets both width and height)
  const handlePresetSelect = (preset: PresetValue) => {
    if (typeof preset.value === 'object' && 'width' in preset.value && 'height' in preset.value) {
      onWidthChange(preset.value.width as number);
      onHeightChange(preset.value.height as number);
    } else if (typeof preset.value === 'number') {
      // Single value preset - apply to width only
      onWidthChange(preset.value);
    }
  };

  // Check if current size matches a preset
  const isPresetSelected = (preset: PresetValue): boolean => {
    if (typeof preset.value === 'object' && 'width' in preset.value && 'height' in preset.value) {
      return preset.value.width === widthValue && preset.value.height === heightValue;
    }
    return false;
  };

  return (
    <div className="size-selector">
      <div className="size-selector-grid">
        {/* Left side - Dropdowns */}
        <div className="size-inputs">
          {/* Width input */}
          {widthField && (
            <div className="size-input-group">
              <label className="size-label">{widthField.label}</label>
              <div className="size-input-wrapper">
                <input
                  type="number"
                  className="size-input"
                  value={widthValue || ''}
                  onChange={(e) => onWidthChange(Number(e.target.value))}
                  min={widthField.validation?.min}
                  max={widthField.validation?.max}
                  step={widthField.validation?.step || 1}
                  placeholder={widthField.placeholder}
                />
                <span className="size-unit">cm</span>
              </div>
            </div>
          )}

          {/* Height input */}
          {heightField && (
            <div className="size-input-group">
              <label className="size-label">{heightField.label}</label>
              <div className="size-input-wrapper">
                <input
                  type="number"
                  className="size-input"
                  value={heightValue || ''}
                  onChange={(e) => onHeightChange(Number(e.target.value))}
                  min={heightField.validation?.min}
                  max={heightField.validation?.max}
                  step={heightField.validation?.step || 1}
                  placeholder={heightField.placeholder}
                />
                <span className="size-unit">cm</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Preset chips */}
        {presets && presets.length > 0 && (
          <div className="size-presets">
            <span className="size-presets-label">Gyakori méretek</span>
            <div className="size-presets-grid">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`size-preset-chip ${isPresetSelected(preset) ? 'selected' : ''}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SizeSelector;
