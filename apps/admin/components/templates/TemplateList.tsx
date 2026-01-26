/**
 * TemplateList - Display and manage templates
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  ResourceList,
  ResourceItem,
  Text,
  InlineStack,
  TextField,
  Badge,
  BlockStack,
} from '@shopify/polaris';
import { EditIcon, DeleteIcon } from '@shopify/polaris-icons';
import type { Template } from '@/types/template';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { StatusBadge, ConfirmationModal } from '@/components/ui/UIComponents';

// ============================================================================
// TemplateList Component
// ============================================================================

interface TemplateListProps {
  templates: Template[];
  isLoading?: boolean;
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateList({
  templates,
  isLoading = false,
  onEdit,
  onDelete,
}: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    templateId: string | null;
    templateName: string;
  }>({
    isOpen: false,
    templateId: null,
    templateName: '',
  });

  // Filter templates based on search
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (template: Template) => {
    setDeleteConfirm({
      isOpen: true,
      templateId: template.id,
      templateName: template.name,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.templateId) {
      onDelete(deleteConfirm.templateId);
    }
    setDeleteConfirm({ isOpen: false, templateId: null, templateName: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, templateId: null, templateName: '' });
  };

  const getScopeLabel = (template: Template): string => {
    const { scopeType, scopeValues } = template;
    const count = scopeValues?.length || 0;

    switch (scopeType) {
      case 'PRODUCT':
        return count > 0 ? `${count} termék` : 'Termékek (nincs kiválasztva)';
      case 'COLLECTION':
        return count > 0 ? `${count} kollekció` : 'Kollekciók (nincs kiválasztva)';
      case 'VENDOR':
        return count > 0 ? `${count} gyártó` : 'Gyártók (nincs kiválasztva)';
      case 'TAG':
        return count > 0 ? `${count} címke` : 'Címkék (nincs kiválasztva)';
      case 'GLOBAL':
        return 'Minden termék';
      default:
        return 'Ismeretlen';
    }
  };

  return (
    <>
      <Card>
        <BlockStack gap="400">
          {/* Header with search */}
          <InlineStack align="space-between" blockAlign="center">
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <TextField
                label=""
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Sablonok keresése..."
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setSearchQuery('')}
              />
            </div>
          </InlineStack>

          {/* Template list */}
          <ResourceList
            resourceName={{ singular: 'sablon', plural: 'sablonok' }}
            items={filteredTemplates}
            loading={isLoading}
            emptyState={
              <Text as="p" tone="subdued">
                {searchQuery
                  ? 'Nincs találat a keresésre.'
                  : 'Még nincs sablon létrehozva. Kezdj egy új sablon létrehozásával!'}
              </Text>
            }
            renderItem={(template) => {
              const { id, name, description, isActive, updatedAt, sections } = template;
              // Count fields from sections
              const fieldsCount = (sections || []).reduce((sum, s) => sum + (s.fields?.length || 0), 0);
              const shortcutActions = [
                {
                  content: 'Szerkesztés',
                  icon: EditIcon,
                  onAction: () => onEdit(template),
                },
                {
                  content: 'Törlés',
                  icon: DeleteIcon,
                  destructive: true,
                  onAction: () => handleDeleteClick(template),
                },
              ];

              return (
                <ResourceItem
                  id={id}
                  onClick={() => onEdit(template)}
                  shortcutActions={shortcutActions}
                  persistActions
                >
                  <BlockStack gap="200">
                    {/* Title and status */}
                    <InlineStack align="space-between" blockAlign="start">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd" fontWeight="semibold">
                          {name}
                        </Text>
                        {description && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {description}
                          </Text>
                        )}
                      </BlockStack>
                      <StatusBadge status={isActive ? 'active' : 'inactive'} />
                    </InlineStack>

                    {/* Metadata */}
                    <InlineStack gap="400" wrap={false}>
                      <Badge tone="info">{fieldsCount} mező</Badge>
                      <Badge>{getScopeLabel(template)}</Badge>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Módosítva: {formatRelativeTime(updatedAt)}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </ResourceItem>
              );
            }}
          />
        </BlockStack>
      </Card>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Sablon törlése"
        message={`Biztosan törölni szeretnéd a "${deleteConfirm.templateName}" sablont? Ez a művelet nem vonható vissza.`}
        confirmLabel="Törlés"
        isDangerous
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
