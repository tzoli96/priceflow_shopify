/**
 * FieldsList - Manage template fields
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Button,
  InlineStack,
  Badge,
  EmptyState,
} from '@shopify/polaris';
import { FieldEditor } from './FieldEditor';
import type { TemplateField, FieldType } from '@/types/template';

interface FieldsListProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

export const FieldsList: React.FC<FieldsListProps> = ({ fields, onChange }) => {
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const getFieldTypeLabel = (type: FieldType): string => {
    switch (type) {
      case 'NUMBER':
        return 'Szám';
      case 'TEXT':
        return 'Szöveg';
      case 'SELECT':
        return 'Lista';
      case 'RADIO':
        return 'Radio';
      case 'CHECKBOX':
        return 'Jelölő';
      case 'TEXTAREA':
        return 'Szövegterület';
      case 'FILE':
        return 'Fájl';
      default:
        return type;
    }
  };

  const handleEdit = (field: TemplateField, index: number) => {
    setEditingField(field);
    setEditingIndex(index);
    setShowEditor(true);
  };

  const handleDelete = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const handleAddNew = () => {
    setEditingField(null);
    setEditingIndex(null);
    setShowEditor(true);
  };

  const handleSave = (field: TemplateField) => {
    if (editingIndex !== null) {
      // Update existing field
      const updatedFields = [...fields];
      updatedFields[editingIndex] = field;
      onChange(updatedFields);
    } else {
      // Add new field
      onChange([...fields, field]);
    }
    setShowEditor(false);
    setEditingField(null);
    setEditingIndex(null);
  };

  if (fields.length === 0) {
    return (
      <>
        <EmptyState
          heading="Még nincsenek mezők"
          action={{
            content: '+ Új mező hozzáadása',
            onAction: handleAddNew,
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Add meg a mezőket, amelyeket a felhasználók kitölthetnek az árkalkulációhoz.</p>
        </EmptyState>

        {showEditor && (
          <FieldEditor
            field={editingField}
            existingKeys={fields.map((f) => f.key)}
            onSave={handleSave}
            onClose={() => {
              setShowEditor(false);
              setEditingField(null);
              setEditingIndex(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Mezők ({fields.length})
          </Text>
          <Button onClick={handleAddNew}>+ Új mező</Button>
        </InlineStack>
      </div>

      <ResourceList
        resourceName={{ singular: 'mező', plural: 'mezők' }}
        items={fields}
        renderItem={(field, _, index) => (
          <ResourceItem id={field.key}>
            <InlineStack align="space-between">
              <InlineStack gap="300">
                <Text variant="bodyMd" fontWeight="medium">
                  {field.label}
                </Text>
                <Badge tone="info">{getFieldTypeLabel(field.type)}</Badge>
                <Badge>{field.key}</Badge>
                {field.required && <Badge tone="attention">Kötelező</Badge>}
                {field.type === 'NUMBER' && <Badge tone="success">Képletben</Badge>}
              </InlineStack>

              <InlineStack gap="200">
                <Button size="slim" onClick={() => handleEdit(field, index)}>
                  Szerkeszt
                </Button>
                <Button size="slim" tone="critical" onClick={() => handleDelete(index)}>
                  Törlés
                </Button>
              </InlineStack>
            </InlineStack>
          </ResourceItem>
        )}
      />

      {showEditor && (
        <FieldEditor
          field={editingField}
          existingKeys={fields
            .map((f) => f.key)
            .filter((_, i) => i !== editingIndex)}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingField(null);
            setEditingIndex(null);
          }}
        />
      )}
    </>
  );
};
