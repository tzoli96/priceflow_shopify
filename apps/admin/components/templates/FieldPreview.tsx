/**
 * FieldPreview Component
 *
 * Displays a visual preview of how a field will appear on the storefront
 * Uses SVG-based rendering for fast, lightweight previews
 */

'use client';

import React from 'react';
import { Card, Text, BlockStack } from '@shopify/polaris';
import type { TemplateField } from '@/types/template';
import { generateFieldPreview, type FieldPreviewOptions } from '@/lib/utils/fieldPreviewGenerator';

interface FieldPreviewProps {
  field: TemplateField;
  options?: FieldPreviewOptions;
  title?: string;
  showCard?: boolean;
}

export const FieldPreview: React.FC<FieldPreviewProps> = ({
  field,
  options = {},
  title = 'Storefront előnézet',
  showCard = true,
}) => {
  const preview = generateFieldPreview(field, {
    width: 400,
    height: 200,
    showLabel: true,
    showPresets: true,
    ...options,
  });

  const content = (
    <BlockStack gap="200">
      {title && (
        <Text as="p" variant="headingSm">
          {title}
        </Text>
      )}
      <div
        style={{
          padding: '16px',
          background: '#fafafa',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {preview}
      </div>
    </BlockStack>
  );

  if (showCard) {
    return <Card>{content}</Card>;
  }

  return content;
};

export default FieldPreview;
