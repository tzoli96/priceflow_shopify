/**
 * FieldsList - Manage template fields with drag & drop reordering
 */

'use client';

import React, { useState, useRef } from 'react';
import {
  Text,
  Button,
  InlineStack,
  Badge,
  EmptyState,
  BlockStack,
  Box,
} from '@shopify/polaris';
import { DragHandleIcon } from '@shopify/polaris-icons';
import { FieldEditor } from './FieldEditor';
import type { TemplateField, FieldType, FieldDisplayStyle } from '@/types/template';

interface FieldsListProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

export const FieldsList: React.FC<FieldsListProps> = ({ fields, onChange }) => {
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      case 'PRODUCT_CARD':
        return 'Termék kártya';
      case 'DELIVERY_TIME':
        return 'Átfutási idő';
      case 'EXTRAS':
        return 'Extrák';
      default:
        return type;
    }
  };

  const getDisplayStyleLabel = (style?: FieldDisplayStyle): string | null => {
    switch (style) {
      case 'card':
        return 'Kártyás';
      case 'chip':
        return 'Chip';
      default:
        return null;
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
      // Add new field with order
      const newField = { ...field, order: fields.length };
      onChange([...fields, newField]);
    }
    setShowEditor(false);
    setEditingField(null);
    setEditingIndex(null);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    // Update order values
    const reorderedFields = newFields.map((f, i) => ({ ...f, order: i }));
    onChange(reorderedFields);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
            fieldCount={fields.length}
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

      <BlockStack gap="200">
        {fields.map((field, index) => {
          const displayStyleLabel = getDisplayStyleLabel(field.displayStyle);
          const hasPresets = field.presetValues && field.presetValues.length > 0;
          const hasOptions = field.options && field.options.length > 0;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={field.key}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                padding: '12px 16px',
                backgroundColor: isDragOver ? '#f0f5ff' : isDragging ? '#f4f6f8' : '#fff',
                border: `1px solid ${isDragOver ? '#2c6ecb' : '#e1e3e5'}`,
                borderRadius: '8px',
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="300" wrap={false} blockAlign="center">
                  {/* Drag handle */}
                  <div style={{ color: '#8c9196', cursor: 'grab' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                    </svg>
                  </div>
                  <Text variant="bodyMd" fontWeight="medium" as="span">
                    {field.label}
                  </Text>
                  <Badge tone="info">{getFieldTypeLabel(field.type)}</Badge>
                  <Badge>{field.key}</Badge>
                  {field.required && <Badge tone="attention">Kötelező</Badge>}
                  {field.useInFormula !== false && field.type === 'NUMBER' && (
                    <Badge tone="success">Képletben</Badge>
                  )}
                  {field.useInFormula === false && (
                    <Badge>Nincs árhatás</Badge>
                  )}
                  {displayStyleLabel && (
                    <Badge tone="warning">{displayStyleLabel}</Badge>
                  )}
                  {hasOptions && (
                    <Badge>{String(field.options!.length)} opció</Badge>
                  )}
                  {hasPresets && (
                    <Badge tone="success">{String(field.presetValues!.length)} gyors érték</Badge>
                  )}
                  {field.helpText && <Badge tone="info">Segítség</Badge>}
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
            </div>
          );
        })}
      </BlockStack>

      {showEditor && (
        <FieldEditor
          field={editingField}
          existingKeys={fields
            .map((f) => f.key)
            .filter((_, i) => i !== editingIndex)}
          fieldCount={fields.length}
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
