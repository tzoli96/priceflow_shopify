/**
 * FieldEditor - Modal for creating/editing template fields
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, FormLayout, TextField, Select, Checkbox, Banner } from '@shopify/polaris';
import type { TemplateField, FieldType } from '@/types/template';
import { FIELD_TYPE_OPTIONS } from '@/lib/constants/template';

interface FieldEditorProps {
  field: TemplateField | null;
  existingKeys: string[];
  onSave: (field: Omit<TemplateField, 'id'>) => void;
  onClose: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  existingKeys,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    key: field?.key || '',
    label: field?.label || '',
    type: field?.type || ('TEXT' as FieldType),
    required: field?.required || false,
    validation: {
      min: field?.validation?.min?.toString() || '',
      max: field?.validation?.max?.toString() || '',
      pattern: field?.validation?.pattern || '',
      options: field?.validation?.options?.join(', ') || '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate key from label if key is empty
  useEffect(() => {
    if (!field && formData.label && !formData.key) {
      const generatedKey = formData.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setFormData((prev) => ({ ...prev, key: generatedKey }));
    }
  }, [formData.label, formData.key, field]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key) {
      newErrors.key = 'Mező kulcs kötelező';
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.key)) {
      newErrors.key = 'Mező kulcs csak kisbetűkkel, számokkal és alulvonással kezdődhet';
    } else if (existingKeys.includes(formData.key)) {
      newErrors.key = 'Ez a kulcs már létezik';
    }

    if (!formData.label) {
      newErrors.label = 'Megjelenített név kötelező';
    }

    if (
      (formData.type === 'SELECT' || formData.type === 'RADIO') &&
      !formData.validation.options.trim()
    ) {
      newErrors.options = 'Opciók megadása kötelező lista és radio típusoknál';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    // Build validation object
    const validation: any = {};

    if (formData.type === 'NUMBER') {
      if (formData.validation.min) validation.min = Number(formData.validation.min);
      if (formData.validation.max) validation.max = Number(formData.validation.max);
    }

    if (formData.type === 'TEXT' || formData.type === 'TEXTAREA') {
      if (formData.validation.pattern) validation.pattern = formData.validation.pattern;
    }

    if (formData.type === 'SELECT' || formData.type === 'RADIO') {
      validation.options = formData.validation.options
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
    }

    const newField: Omit<TemplateField, 'id'> = {
      key: formData.key,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
    };

    onSave(newField);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={field ? 'Mező szerkesztése' : 'Új mező'}
      primaryAction={{
        content: 'Mentés',
        onAction: handleSave,
      }}
      secondaryActions={[
        {
          content: 'Mégsem',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Mező kulcs"
            value={formData.key}
            onChange={(value) => setFormData((prev) => ({ ...prev, key: value }))}
            placeholder="pl. width_cm"
            error={errors.key}
            helpText="Egyedi azonosító a képletben. Csak kisbetűk, számok és alulvonás"
            autoComplete="off"
          />

          <TextField
            label="Megjelenített név"
            value={formData.label}
            onChange={(value) => setFormData((prev) => ({ ...prev, label: value }))}
            placeholder="pl. Szélesség (cm)"
            error={errors.label}
            autoComplete="off"
            requiredIndicator
          />

          <Select
            label="Mező típusa"
            options={FIELD_TYPE_OPTIONS}
            value={formData.type}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, type: value as FieldType }))
            }
          />

          <Checkbox
            label="Kötelező mező"
            checked={formData.required}
            onChange={(checked) => setFormData((prev) => ({ ...prev, required: checked }))}
          />

          {/* Number validations */}
          {formData.type === 'NUMBER' && (
            <>
              <TextField
                label="Minimum érték (opcionális)"
                type="number"
                value={formData.validation.min}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    validation: { ...prev.validation, min: value },
                  }))
                }
                autoComplete="off"
              />
              <TextField
                label="Maximum érték (opcionális)"
                type="number"
                value={formData.validation.max}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    validation: { ...prev.validation, max: value },
                  }))
                }
                autoComplete="off"
              />
            </>
          )}

          {/* Text pattern validation */}
          {(formData.type === 'TEXT' || formData.type === 'TEXTAREA') && (
            <TextField
              label="Pattern validáció (regex, opcionális)"
              value={formData.validation.pattern}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  validation: { ...prev.validation, pattern: value },
                }))
              }
              placeholder="pl. ^[A-Z0-9]+$"
              autoComplete="off"
            />
          )}

          {/* Options for select/radio */}
          {(formData.type === 'SELECT' || formData.type === 'RADIO') && (
            <TextField
              label="Opciók (vesszővel elválasztva)"
              value={formData.validation.options}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  validation: { ...prev.validation, options: value },
                }))
              }
              placeholder="Opció 1, Opció 2, Opció 3"
              error={errors.options}
              requiredIndicator
              autoComplete="off"
            />
          )}

          {formData.type === 'NUMBER' && (
            <Banner tone="info">
              <p>
                A NUMBER típusú mezők automatikusan használhatók lesznek az árkalkulációs
                képletben.
              </p>
            </Banner>
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
};
