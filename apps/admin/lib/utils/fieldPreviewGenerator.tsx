/**
 * Field Preview Generator
 *
 * Generates SVG/Canvas-based preview images for field types
 * Shows how the field will appear on the storefront
 */

import React from 'react';
import type { FieldType, TemplateField } from '@/types/template';

export interface FieldPreviewOptions {
  width?: number;
  height?: number;
  showLabel?: boolean;
  showPresets?: boolean;
}

/**
 * Generate SVG preview for a field type
 */
export function generateFieldPreview(
  field: TemplateField,
  options: FieldPreviewOptions = {}
): React.ReactElement {
  const {
    width = 400,
    height = 200,
    showLabel = true,
    showPresets = true,
  } = options;

  switch (field.type) {
    case 'QUANTITY_SELECTOR':
      return generateQuantitySelectorPreview(field, width, height, showLabel, showPresets);

    case 'NUMBER':
      return generateNumberFieldPreview(field, width, height, showLabel);

    case 'SELECT':
    case 'RADIO':
      return generateSelectFieldPreview(field, width, height, showLabel);

    default:
      return generateGenericPreview(field, width, height);
  }
}

/**
 * Generate preview for QUANTITY_SELECTOR field
 */
function generateQuantitySelectorPreview(
  field: TemplateField,
  width: number,
  height: number,
  showLabel: boolean,
  showPresets: boolean
): React.ReactElement {
  const presets = field.options?.slice(0, 4) || [];
  const hasPresets = showPresets && presets.length > 0;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width={width} height={height} fill="#fafafa" />

      {/* Label */}
      {showLabel && (
        <text x="20" y="30" fontSize="14" fontWeight="600" fill="#333">
          {field.label}
        </text>
      )}

      {/* Quantity Controls (- [5] +) */}
      <g transform={`translate(${width / 2 - 90}, ${showLabel ? 50 : 30})`}>
        {/* Container */}
        <rect x="0" y="0" width="180" height="48" rx="8" fill="white" stroke="#e5e5e5" strokeWidth="1" />

        {/* Minus button */}
        <rect x="0" y="0" width="48" height="48" fill="#fafafa" />
        <line x1="14" y1="24" x2="34" y2="24" stroke="#333" strokeWidth="2" strokeLinecap="round" />

        {/* Input area */}
        <line x1="48" y1="0" x2="48" y2="48" stroke="#e5e5e5" strokeWidth="1" />
        <line x1="132" y1="0" x2="132" y2="48" stroke="#e5e5e5" strokeWidth="1" />
        <text x="90" y="30" fontSize="18" fontWeight="600" fill="#333" textAnchor="middle">5</text>

        {/* Plus button */}
        <rect x="132" y="0" width="48" height="48" fill="#fafafa" />
        <line x1="146" y1="24" x2="166" y2="24" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        <line x1="156" y1="14" x2="156" y2="34" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Preset buttons */}
      {hasPresets && (
        <g transform={`translate(${width / 2 - 120}, ${showLabel ? 120 : 100})`}>
          {presets.map((preset, idx) => {
            const x = idx * 65;
            const isSelected = idx === 1; // Highlight middle preset
            return (
              <g key={idx} transform={`translate(${x}, 0)`}>
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="32"
                  rx="16"
                  fill={isSelected ? '#e91e8c' : 'white'}
                  stroke={isSelected ? '#e91e8c' : '#e5e5e5'}
                  strokeWidth="1"
                />
                <text
                  x="30"
                  y="20"
                  fontSize="12"
                  fontWeight="500"
                  fill={isSelected ? 'white' : '#333'}
                  textAnchor="middle"
                >
                  {preset.label || preset.value}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Help text */}
      {field.helpText && (
        <text x="20" y={height - 20} fontSize="11" fill="#999">
          {field.helpText.substring(0, 50)}{field.helpText.length > 50 ? '...' : ''}
        </text>
      )}
    </svg>
  );
}

/**
 * Generate preview for NUMBER field
 */
function generateNumberFieldPreview(
  field: TemplateField,
  width: number,
  height: number,
  showLabel: boolean
): React.ReactElement {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#fafafa" />

      {showLabel && (
        <text x="20" y="30" fontSize="14" fontWeight="600" fill="#333">
          {field.label}
        </text>
      )}

      <rect x="20" y={showLabel ? 45 : 20} width="200" height="44" rx="8" fill="white" stroke="#e5e5e5" strokeWidth="1" />
      <text x="30" y={showLabel ? 73 : 48} fontSize="16" fill="#666">
        {field.placeholder || '0'}
      </text>
      {field.unit && (
        <text x="190" y={showLabel ? 73 : 48} fontSize="14" fontWeight="500" fill="#999" textAnchor="end">
          {field.unit}
        </text>
      )}
    </svg>
  );
}

/**
 * Generate preview for SELECT/RADIO field
 */
function generateSelectFieldPreview(
  field: TemplateField,
  width: number,
  height: number,
  showLabel: boolean
): React.ReactElement {
  const options = field.options?.slice(0, 3) || [];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#fafafa" />

      {showLabel && (
        <text x="20" y="30" fontSize="14" fontWeight="600" fill="#333">
          {field.label}
        </text>
      )}

      {options.map((opt, idx) => {
        const y = (showLabel ? 50 : 20) + idx * 50;
        const isSelected = idx === 0;
        return (
          <g key={idx}>
            <rect
              x="20"
              y={y}
              width="250"
              height="40"
              rx="8"
              fill={isSelected ? '#fdf2f8' : 'white'}
              stroke={isSelected ? '#e91e8c' : '#e5e5e5'}
              strokeWidth={isSelected ? 2 : 1}
            />
            <circle
              cx="35"
              cy={y + 20}
              r="6"
              fill="none"
              stroke={isSelected ? '#e91e8c' : '#e5e5e5'}
              strokeWidth="2"
            />
            {isSelected && <circle cx="35" cy={y + 20} r="3" fill="#e91e8c" />}
            <text x="50" y={y + 24} fontSize="13" fontWeight="500" fill="#333">
              {opt.label}
            </text>
            {opt.price && opt.price > 0 && (
              <text x="240" y={y + 24} fontSize="13" fontWeight="600" fill="#e91e8c" textAnchor="end">
                +{opt.price} Ft
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Generic preview for unknown field types
 */
function generateGenericPreview(
  field: TemplateField,
  width: number,
  height: number
): React.ReactElement {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="#fafafa" />
      <text x={width / 2} y={height / 2} fontSize="14" fill="#999" textAnchor="middle">
        Preview not available
      </text>
    </svg>
  );
}

/**
 * Convert SVG React element to data URL
 */
export function svgToDataUrl(svgElement: React.ReactElement): string {
  // This is a simplified version - in production, you'd use renderToStaticMarkup
  // from react-dom/server or a similar approach
  const svgString = `<svg>${svgElement}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

/**
 * Export preview as PNG (requires canvas)
 */
export async function exportPreviewAsPng(
  field: TemplateField,
  options: FieldPreviewOptions = {}
): Promise<Blob> {
  const svgElement = generateFieldPreview(field, options);

  // This would need to be implemented using canvas
  // For now, return a placeholder
  return new Blob([], { type: 'image/png' });
}
