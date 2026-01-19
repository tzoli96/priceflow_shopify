/**
 * FieldEditor - Modal for creating/editing template fields
 *
 * Támogatott mezők:
 * - Alapadatok: key, label, type, required
 * - UI: placeholder, helpText
 * - Logika: useInFormula, order
 * - Validáció: min, max, step (NUMBER), pattern (TEXT)
 * - Opciók: SELECT/RADIO áras opciókkal
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Banner,
  Divider,
  Text,
  InlineStack,
  Button,
  BlockStack,
  Box,
} from '@shopify/polaris';
import { PlusIcon, DeleteIcon } from '@shopify/polaris-icons';
import type { TemplateField, FieldType, FieldOption } from '@/types/template';
import { FIELD_TYPE_OPTIONS } from '@/lib/constants/template';

interface FieldEditorProps {
  field: TemplateField | null;
  existingKeys: string[];
  fieldCount?: number; // Hány mező van már - order alapértékhez
  onSave: (field: Omit<TemplateField, 'id'>) => void;
  onClose: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  existingKeys,
  fieldCount = 0,
  onSave,
  onClose,
}) => {
  // Opciók inicializálása a meglévő field-ből
  const initOptions = (): FieldOption[] => {
    if (field?.options && Array.isArray(field.options)) {
      return field.options;
    }
    // Legacy format: validation.options string array
    if (field?.validation?.options && Array.isArray(field.validation.options)) {
      return field.validation.options.map((opt) => ({
        label: opt,
        value: opt.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        price: undefined,
      }));
    }
    return [];
  };

  const [formData, setFormData] = useState({
    key: field?.key || '',
    label: field?.label || '',
    type: field?.type || ('TEXT' as FieldType),
    required: field?.required || false,
    placeholder: field?.placeholder || '',
    helpText: field?.helpText || '',
    useInFormula: field?.useInFormula ?? true, // Alapértelmezetten igen
    order: field?.order ?? fieldCount, // Új mező a végére kerül
    validation: {
      min: field?.validation?.min?.toString() || '',
      max: field?.validation?.max?.toString() || '',
      step: field?.validation?.step?.toString() || '',
      pattern: field?.validation?.pattern || '',
    },
  });

  const [options, setOptions] = useState<FieldOption[]>(initOptions());
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
      options.length === 0
    ) {
      newErrors.options = 'Legalább egy opció megadása kötelező';
    }

    // Validáljuk az opciókat
    if (formData.type === 'SELECT' || formData.type === 'RADIO') {
      const hasEmptyLabel = options.some((opt) => !opt.label.trim());
      if (hasEmptyLabel) {
        newErrors.options = 'Minden opciónak kell címke';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Opció kezelő függvények
  const addOption = () => {
    setOptions([...options, { label: '', value: '', price: undefined }]);
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };

    // Auto-generate value from label if empty
    if (updates.label && !newOptions[index].value) {
      newOptions[index].value = updates.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!validate()) return;

    // Build validation object
    const validation: Record<string, any> = {};

    if (formData.type === 'NUMBER') {
      if (formData.validation.min) validation.min = Number(formData.validation.min);
      if (formData.validation.max) validation.max = Number(formData.validation.max);
      if (formData.validation.step) validation.step = Number(formData.validation.step);
    }

    if (formData.type === 'TEXT' || formData.type === 'TEXTAREA') {
      if (formData.validation.pattern) validation.pattern = formData.validation.pattern;
    }

    const newField: Omit<TemplateField, 'id'> = {
      key: formData.key,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      placeholder: formData.placeholder || undefined,
      helpText: formData.helpText || undefined,
      useInFormula: formData.useInFormula,
      order: formData.order,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
      options:
        (formData.type === 'SELECT' || formData.type === 'RADIO') && options.length > 0
          ? options
          : undefined,
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
      large
    >
      <Modal.Section>
        <BlockStack gap="400">
          {/* Alapadatok szekció */}
          <Text variant="headingMd" as="h3">Alapadatok</Text>
          <FormLayout>
            <FormLayout.Group>
              <TextField
                label="Megjelenített név"
                value={formData.label}
                onChange={(value) => setFormData((prev) => ({ ...prev, label: value }))}
                placeholder="pl. Szélesség (cm)"
                error={errors.label}
                autoComplete="off"
                requiredIndicator
              />

              <TextField
                label="Mező kulcs"
                value={formData.key}
                onChange={(value) => setFormData((prev) => ({ ...prev, key: value }))}
                placeholder="pl. width_cm"
                error={errors.key}
                helpText="Azonosító a képletben (kisbetűk, számok, _)"
                autoComplete="off"
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Select
                label="Mező típusa"
                options={FIELD_TYPE_OPTIONS}
                value={formData.type}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value as FieldType }))
                }
              />

              <TextField
                label="Placeholder"
                value={formData.placeholder}
                onChange={(value) => setFormData((prev) => ({ ...prev, placeholder: value }))}
                placeholder="pl. Add meg a szélességet"
                autoComplete="off"
              />
            </FormLayout.Group>

            <TextField
              label="Segítő szöveg"
              value={formData.helpText}
              onChange={(value) => setFormData((prev) => ({ ...prev, helpText: value }))}
              placeholder="Rövid magyarázat a mezőhöz"
              helpText="Ez a szöveg jelenik meg a mező mellett info ikonként"
              autoComplete="off"
              multiline={2}
            />
          </FormLayout>

          <Divider />

          {/* Viselkedés szekció */}
          <Text variant="headingMd" as="h3">Viselkedés</Text>
          <FormLayout>
            <InlineStack gap="400">
              <Checkbox
                label="Kötelező mező"
                checked={formData.required}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, required: checked }))
                }
              />

              <Checkbox
                label="Használat árképletben"
                checked={formData.useInFormula}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, useInFormula: checked }))
                }
                helpText="Ha nincs bejelölve, a mező értéke nem befolyásolja az árat"
              />
            </InlineStack>
          </FormLayout>

          <Divider />

          {/* NUMBER típusú validáció */}
          {formData.type === 'NUMBER' && (
            <>
              <Text variant="headingMd" as="h3">Szám validáció</Text>
              <FormLayout>
                <FormLayout.Group condensed>
                  <TextField
                    label="Minimum"
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
                    label="Maximum"
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
                  <TextField
                    label="Lépésköz"
                    type="number"
                    value={formData.validation.step}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        validation: { ...prev.validation, step: value },
                      }))
                    }
                    placeholder="pl. 1, 0.5, 10"
                    autoComplete="off"
                  />
                </FormLayout.Group>
              </FormLayout>
              <Banner tone="info">
                A NUMBER típusú mezők automatikusan használhatók az árkalkulációs képletben.
              </Banner>
            </>
          )}

          {/* TEXT/TEXTAREA pattern validáció */}
          {(formData.type === 'TEXT' || formData.type === 'TEXTAREA') && (
            <>
              <Text variant="headingMd" as="h3">Szöveg validáció</Text>
              <FormLayout>
                <TextField
                  label="Pattern validáció (regex)"
                  value={formData.validation.pattern}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      validation: { ...prev.validation, pattern: value },
                    }))
                  }
                  placeholder="pl. ^[A-Z0-9]+$"
                  helpText="Opcionális regex pattern a bevitt szöveg ellenőrzésére"
                  autoComplete="off"
                />
              </FormLayout>
            </>
          )}

          {/* SELECT/RADIO opciók */}
          {(formData.type === 'SELECT' || formData.type === 'RADIO') && (
            <>
              <Text variant="headingMd" as="h3">Opciók</Text>
              {errors.options && (
                <Banner tone="critical">{errors.options}</Banner>
              )}

              <BlockStack gap="300">
                {options.map((option, index) => (
                  <Box
                    key={index}
                    padding="300"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <InlineStack gap="300" align="center" blockAlign="end">
                      <div style={{ flex: 2 }}>
                        <TextField
                          label="Címke"
                          value={option.label}
                          onChange={(value) => updateOption(index, { label: value })}
                          placeholder="pl. PVC anyag"
                          autoComplete="off"
                          labelHidden={index > 0}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Érték"
                          value={option.value}
                          onChange={(value) => updateOption(index, { value })}
                          placeholder="pvc"
                          autoComplete="off"
                          labelHidden={index > 0}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Felár (Ft)"
                          type="number"
                          value={option.price?.toString() || ''}
                          onChange={(value) =>
                            updateOption(index, {
                              price: value ? Number(value) : undefined,
                            })
                          }
                          placeholder="0"
                          autoComplete="off"
                          labelHidden={index > 0}
                        />
                      </div>
                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        onClick={() => removeOption(index)}
                        accessibilityLabel="Opció törlése"
                      />
                    </InlineStack>
                  </Box>
                ))}

                <Button icon={PlusIcon} onClick={addOption}>
                  Opció hozzáadása
                </Button>
              </BlockStack>

              <Banner tone="info">
                A felár hozzáadódik az árhoz, ha ezt az opciót választja a vásárló.
                Hagyja üresen, ha nincs felár.
              </Banner>
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};
