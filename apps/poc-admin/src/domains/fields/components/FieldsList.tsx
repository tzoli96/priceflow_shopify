import React, { useState } from 'react';
import { Card, ResourceList, ResourceItem, Text, Button, InlineStack, Badge, EmptyState } from '@shopify/polaris';
import { FieldEditor } from './FieldEditor';
import type { TemplateField } from '../../template/types';

interface FieldsListProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

export const FieldsList: React.FC<FieldsListProps> = ({ fields, onChange }) => {
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case 'number': return 'Szám';
      case 'text': return 'Szöveg';
      case 'select': return 'Lista';
      case 'radio': return 'Radio';
      case 'checkbox': return 'Jelölő';
      case 'textarea': return 'Szövegterület';
      case 'file': return 'Fájl';
      default: return type;
    }
  };

  const handleEdit = (field: TemplateField) => {
    setEditingField(field);
    setShowEditor(true);
  };

  const handleDelete = (fieldKey: string) => {
    onChange(fields.filter(f => f.key !== fieldKey));
  };

  const handleAddNew = () => {
    setEditingField(null);
    setShowEditor(true);
  };

  const handleSave = (field: TemplateField) => {
    if (editingField) {
      // Update existing field
      onChange(fields.map(f => f.key === editingField.key ? field : f));
    } else {
      // Add new field
      onChange([...fields, field]);
    }
    setShowEditor(false);
    setEditingField(null);
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
            onSave={handleSave}
            onClose={() => {
              setShowEditor(false);
              setEditingField(null);
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
        renderItem={(field) => (
          <ResourceItem id={field.key}>
            <InlineStack align="space-between">
              <InlineStack gap="300">
                <Text variant="bodyMd" fontWeight="medium">
                  {field.label}
                </Text>
                <Badge tone="info">{getFieldTypeLabel(field.type)}</Badge>
                <Badge>{field.key}</Badge>
                {field.required && <Badge tone="attention">Kötelező</Badge>}
                {field.useInFormula !== false && (
                  <Badge tone="success">Képletben</Badge>
                )}
              </InlineStack>

              <InlineStack gap="200">
                <Button size="slim" onClick={() => handleEdit(field)}>
                  Szerkeszt
                </Button>
                <Button
                  size="slim"
                  tone="critical"
                  onClick={() => handleDelete(field.key)}
                >
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
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingField(null);
          }}
        />
      )}
    </>
  );
};
