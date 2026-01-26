/**
 * FieldTypeSelector - Visual field type picker component
 *
 * Displays field types in categorized cards with icons and descriptions,
 * similar to how layout types are selected in SectionEditor.
 */

'use client';

import React from 'react';
import { Text, BlockStack, Box } from '@shopify/polaris';
import type { FieldType } from '@/types/template';
import { FIELD_TYPE_CATEGORIES } from '@/lib/constants/template';

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
}

export const FieldTypeSelector: React.FC<FieldTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <BlockStack gap="400">
      {FIELD_TYPE_CATEGORIES.map((category) => (
        <Box key={category.title}>
          <BlockStack gap="200">
            <div>
              <Text as="p" variant="headingSm" tone="subdued">
                {category.title}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {category.description}
              </Text>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(category.types.length, 5)}, 1fr)`,
                gap: '10px',
              }}
            >
              {category.types.map((fieldType) => {
                const isSelected = value === fieldType.value;
                return (
                  <label
                    key={fieldType.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px 8px',
                      border: `2px solid ${isSelected ? '#2c6ecb' : '#e1e3e5'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f4f6f8' : '#fff',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      minHeight: '100px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#8c9196';
                        e.currentTarget.style.backgroundColor = '#fafbfb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e1e3e5';
                        e.currentTarget.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="fieldType"
                      value={fieldType.value}
                      checked={isSelected}
                      onChange={() => onChange(fieldType.value)}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        color: isSelected ? '#2c6ecb' : '#6d7175',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '40px',
                      }}
                    >
                      {fieldType.icon}
                    </div>
                    <Text
                      as="span"
                      variant="bodySm"
                      fontWeight={isSelected ? 'semibold' : 'regular'}
                    >
                      {fieldType.label}
                    </Text>
                    <Text
                      as="span"
                      variant="bodySm"
                      tone="subdued"
                      breakWord
                    >
                      {fieldType.description}
                    </Text>
                  </label>
                );
              })}
            </div>
          </BlockStack>
        </Box>
      ))}
    </BlockStack>
  );
};
