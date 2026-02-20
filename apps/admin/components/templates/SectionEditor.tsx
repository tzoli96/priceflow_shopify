/**
 * SectionEditor - Modal for creating/editing template sections
 *
 * Támogatott beállítások:
 * - Alapadatok: key, title, description
 * - Layout: layoutType, columnsCount
 * - Viselkedés: collapsible, defaultOpen, showNumber
 * - Built-in típus: SIZE, QUANTITY, EXPRESS, NOTES, FILE_UPLOAD
 * - Mezők kezelése a szekcióban
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Divider,
  Text,
  InlineStack,
  BlockStack,
} from '@shopify/polaris';
import type {
  TemplateSection,
  TemplateField,
  LayoutType,
  PresetValue,
} from '@/types/template';
import { FieldsList } from './FieldsList';
import { Button, Box, Banner } from '@shopify/polaris';
import { PlusIcon, DeleteIcon } from '@shopify/polaris-icons';
import { generateKey } from '@/lib/utils/helpers';

// Layout type options with visual representations
const LAYOUT_TYPES: Array<{
  value: LayoutType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'VERTICAL',
    label: 'Függőleges',
    description: 'Mezők egymás alatt',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="32" height="10" rx="2" fill="currentColor" opacity="0.8"/>
        <rect x="8" y="19" width="32" height="10" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="8" y="32" width="32" height="10" rx="2" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  {
    value: 'HORIZONTAL',
    label: 'Vízszintes',
    description: 'Mezők egymás mellett',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="14" width="12" height="20" rx="2" fill="currentColor" opacity="0.8"/>
        <rect x="18" y="14" width="12" height="20" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="32" y="14" width="12" height="20" rx="2" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  {
    value: 'GRID',
    label: 'Rács',
    description: 'Kártyák rácsban',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="18" height="16" rx="2" fill="currentColor" opacity="0.8"/>
        <rect x="26" y="6" width="18" height="16" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="4" y="26" width="18" height="16" rx="2" fill="currentColor" opacity="0.5"/>
        <rect x="26" y="26" width="18" height="16" rx="2" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  {
    value: 'SPLIT',
    label: 'Osztott',
    description: 'Bal: inputok, Jobb: presetek',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="18" height="8" rx="2" fill="currentColor" opacity="0.8"/>
        <rect x="4" y="20" width="18" height="8" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="4" y="32" width="18" height="8" rx="2" fill="currentColor" opacity="0.4"/>
        <rect x="26" y="8" width="18" height="32" rx="2" fill="currentColor" opacity="0.3"/>
        <rect x="29" y="12" width="12" height="5" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="29" y="20" width="12" height="5" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="29" y="28" width="12" height="5" rx="1" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
  {
    value: 'CHECKBOX_LIST',
    label: 'Checkbox lista',
    description: 'Checkbox kártyák',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="40" height="10" rx="2" fill="currentColor" opacity="0.3"/>
        <rect x="7" y="9" width="4" height="4" rx="1" fill="currentColor" opacity="0.8"/>
        <path d="M8 11L9.5 12.5L12 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="19" width="40" height="10" rx="2" fill="currentColor" opacity="0.3"/>
        <rect x="7" y="22" width="4" height="4" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="4" y="32" width="40" height="10" rx="2" fill="currentColor" opacity="0.3"/>
        <rect x="7" y="35" width="4" height="4" rx="1" fill="currentColor" opacity="0.8"/>
        <path d="M8 37L9.5 38.5L12 35.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];


const COLUMNS_OPTIONS = [
  { label: '2 oszlop', value: '2' },
  { label: '3 oszlop', value: '3' },
  { label: '4 oszlop', value: '4' },
];

interface SectionEditorProps {
  section: TemplateSection | null;
  existingKeys: string[];
  allFieldKeys?: string[]; // All field keys for cross-namespace collision warning
  pricingFormula?: string; // Current formula for reference
  sectionCount?: number;
  onSave: (section: Omit<TemplateSection, 'id'>) => void;
  onClose: () => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  existingKeys,
  allFieldKeys = [],
  pricingFormula = '',
  sectionCount = 0,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    key: section?.key || '',
    title: section?.title || '',
    description: section?.description || '',
    layoutType: section?.layoutType || ('VERTICAL' as LayoutType),
    columnsCount: section?.columnsCount?.toString() || '',
    collapsible: section?.collapsible ?? true,
    defaultOpen: section?.defaultOpen ?? true,
    showNumber: section?.showNumber ?? true,
    order: section?.order ?? sectionCount,
  });

  const [fields, setFields] = useState<TemplateField[]>(section?.fields || []);
  const [presets, setPresets] = useState<PresetValue[]>(section?.presets || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate key from title on blur (lazy - only when user leaves the title field)
  const handleTitleBlur = () => {
    if (!section && formData.title && !formData.key) {
      setFormData((prev) => ({ ...prev, key: generateKey(formData.title) }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key) {
      newErrors.key = 'Szekció kulcs kötelező';
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.key)) {
      newErrors.key = 'Szekció kulcs csak kisbetűkkel, számokkal és alulvonással kezdődhet';
    } else if (existingKeys.includes(formData.key)) {
      newErrors.key = 'Ez a kulcs már létezik egy másik szekciónál';
    } else if (allFieldKeys.includes(formData.key)) {
      newErrors.key = 'Ez a kulcs már létezik egy mezőnél — ütközést okozhat';
    }

    if (!formData.title) {
      newErrors.title = 'Szekció cím kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const newSection: Omit<TemplateSection, 'id'> = {
      key: formData.key,
      title: formData.title,
      description: formData.description || undefined,
      layoutType: formData.layoutType,
      columnsCount: formData.columnsCount ? Number(formData.columnsCount) : undefined,
      collapsible: formData.collapsible,
      defaultOpen: formData.defaultOpen,
      showNumber: formData.showNumber,
      order: formData.order,
      fields: fields,
      presets: formData.layoutType === 'SPLIT' && presets.length > 0 ? presets : undefined,
    };

    onSave(newSection);
  };

  // Preset kezelő függvények
  const addPreset = () => {
    setPresets([...presets, { label: '', value: {} }]);
  };

  const updatePreset = (index: number, updates: Partial<PresetValue>) => {
    const newPresets = [...presets];
    newPresets[index] = { ...newPresets[index], ...updates };
    setPresets(newPresets);
  };

  const removePreset = (index: number) => {
    setPresets(presets.filter((_, i) => i !== index));
  };

  const updatePresetValue = (index: number, fieldKey: string, fieldValue: number) => {
    const newPresets = [...presets];
    const currentValue = typeof newPresets[index].value === 'object' ? newPresets[index].value as Record<string, number> : {};
    newPresets[index] = {
      ...newPresets[index],
      value: { ...currentValue, [fieldKey]: fieldValue },
    };
    setPresets(newPresets);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={section ? 'Szekció szerkesztése' : 'Új szekció'}
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
      size="large"
    >
      <Modal.Section>
        <BlockStack gap="400">
          {/* Alapadatok szekció */}
          <Text variant="headingMd" as="h3">Alapadatok</Text>
          <FormLayout>
            <FormLayout.Group>
              <TextField
                label="Szekció címe"
                value={formData.title}
                onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
                onBlur={handleTitleBlur}
                placeholder="pl. Válassz méretet!"
                error={errors.title}
                autoComplete="off"
                requiredIndicator
              />

              <TextField
                label="Szekció kulcs"
                value={formData.key}
                onChange={(value) => setFormData((prev) => ({ ...prev, key: value }))}
                placeholder="pl. size_selection"
                error={errors.key}
                helpText="Egyedi azonosító (kisbetűk, számok, _)"
                autoComplete="off"
              />
            </FormLayout.Group>

            <TextField
              label="Leírás (opcionális)"
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              placeholder="Segítő szöveg a szekcióhoz..."
              autoComplete="off"
              multiline={2}
            />
          </FormLayout>

          <Divider />

          {/* Layout beállítások */}
          <Text variant="headingMd" as="h3">Megjelenítés</Text>

          {/* Visual Layout Type Selector */}
          <div>
            <Text as="p" variant="bodyMd" tone="subdued">Layout típus</Text>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
              marginTop: '8px',
            }}>
              {LAYOUT_TYPES.map((layout) => {
                const isSelected = formData.layoutType === layout.value;
                return (
                  <label
                    key={layout.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px 8px',
                      border: `2px solid ${isSelected ? '#2c6ecb' : '#e1e3e5'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f4f6f8' : '#fff',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type="radio"
                      name="layoutType"
                      value={layout.value}
                      checked={isSelected}
                      onChange={() => setFormData((prev) => ({ ...prev, layoutType: layout.value }))}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      color: isSelected ? '#2c6ecb' : '#6d7175',
                      marginBottom: '8px',
                    }}>
                      {layout.icon}
                    </div>
                    <Text as="span" variant="bodySm" fontWeight={isSelected ? 'semibold' : 'regular'}>
                      {layout.label}
                    </Text>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {layout.description}
                    </Text>
                  </label>
                );
              })}
            </div>
          </div>

          {formData.layoutType === 'GRID' && (
            <div style={{ marginTop: '16px' }}>
              <Select
                label="Oszlopok száma"
                options={COLUMNS_OPTIONS}
                value={formData.columnsCount || '4'}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, columnsCount: value }))
                }
              />
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <InlineStack gap="400">
              <Checkbox
                label="Összecsukható"
                checked={formData.collapsible}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, collapsible: checked }))
                }
              />

              <Checkbox
                label="Alapból nyitva"
                checked={formData.defaultOpen}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, defaultOpen: checked }))
                }
              />

              <Checkbox
                label="Sorszám mutatása"
                checked={formData.showNumber}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, showNumber: checked }))
                }
              />
            </InlineStack>
          </div>

          <Divider />

          {/* Mezők kezelése */}
          <Text variant="headingMd" as="h3">Mezők ebben a szekcióban</Text>
          <FieldsList
            fields={fields}
            onChange={setFields}
            allSectionKeys={existingKeys}
            pricingFormula={pricingFormula}
          />

          {/* Presetek kezelése - csak SPLIT layout esetén */}
          {formData.layoutType === 'SPLIT' && (
            <>
              <Divider />
              <Text variant="headingMd" as="h3">Gyors értékválasztók (Presetek)</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Gyakori értékkombinációk, amiket a vásárló egy kattintással választhat (pl. "100 x 50 cm")
              </Text>

              <BlockStack gap="300">
                {presets.map((preset, index) => {
                  const presetValueObj = typeof preset.value === 'object' ? preset.value as Record<string, number> : {};
                  const numberFields = fields.filter(f => f.type === 'NUMBER');

                  return (
                    <Box
                      key={index}
                      padding="400"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            Preset #{index + 1}
                          </Text>
                          <Button
                            icon={DeleteIcon}
                            tone="critical"
                            size="slim"
                            onClick={() => removePreset(index)}
                            accessibilityLabel="Preset törlése"
                          />
                        </InlineStack>

                        <TextField
                          label="Megjelenített címke"
                          value={preset.label}
                          onChange={(value) => updatePreset(index, { label: value })}
                          placeholder="pl. 100 x 50 cm"
                          autoComplete="off"
                        />

                        {numberFields.length > 0 ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.min(numberFields.length, 4)}, 1fr)`,
                            gap: '12px',
                          }}>
                            {numberFields.map((field) => (
                              <TextField
                                key={field.key}
                                label={field.label}
                                type="number"
                                value={presetValueObj[field.key]?.toString() || ''}
                                onChange={(value) => updatePresetValue(index, field.key, Number(value))}
                                autoComplete="off"
                              />
                            ))}
                          </div>
                        ) : (
                          <Text as="p" tone="subdued">
                            Adj hozzá NUMBER típusú mezőket a preset értékek beállításához
                          </Text>
                        )}
                      </BlockStack>
                    </Box>
                  );
                })}

                <Button icon={PlusIcon} onClick={addPreset}>
                  Új preset hozzáadása
                </Button>
              </BlockStack>
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};
