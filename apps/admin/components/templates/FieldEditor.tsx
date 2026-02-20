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
import { PlusIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon } from '@shopify/polaris-icons';
import type { TemplateField, FieldType, FieldOption, FieldDisplayStyle, PresetValue } from '@/types/template';
import { ImageUploader } from '@/components/common/ImageUploader';
import { FieldTypeSelector } from './FieldTypeSelector';
import { generateKey } from '@/lib/utils/helpers';

const DISPLAY_STYLE_OPTIONS = [
  { label: 'Alapértelmezett', value: 'default' },
  { label: 'Kártyás megjelenítés', value: 'card' },
  { label: 'Chip/Gomb stílus', value: 'chip' },
];

interface FieldEditorProps {
  field: TemplateField | null;
  existingKeys: string[];
  allSectionKeys?: string[]; // All section keys for cross-namespace collision warning
  pricingFormula?: string; // Current formula for key-in-use warnings
  fieldCount?: number; // Hány mező van már - order alapértékhez
  onSave: (field: Omit<TemplateField, 'id'>) => void;
  onClose: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  existingKeys,
  allSectionKeys = [],
  pricingFormula = '',
  fieldCount = 0,
  onSave,
  onClose,
}) => {
  // Opciók inicializálása a meglévő field-ből
  const initOptions = (): FieldOption[] => {
    if (field?.options && Array.isArray(field.options)) {
      return field.options.map(opt => ({
        ...opt,
        imageUrl: opt.imageUrl || '',
        patternUrl: opt.patternUrl || '',
        badge: opt.badge || '',
        description: opt.description || '',
        htmlContent: opt.htmlContent || '',
        features: opt.features || [],
        enableUpload: opt.enableUpload || false,
      }));
    }
    // Legacy format: validation.options string array
    if (field?.validation?.options && Array.isArray(field.validation.options)) {
      return field.validation.options.map((opt) => ({
        label: opt,
        value: opt.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        price: undefined,
        imageUrl: '',
        patternUrl: '',
        badge: '',
        description: '',
        htmlContent: '',
        features: [],
        enableUpload: false,
      }));
    }
    return [];
  };

  // Preset értékek inicializálása
  const initPresetValues = (): PresetValue[] => {
    if (field?.presetValues && Array.isArray(field.presetValues)) {
      return field.presetValues;
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
    displayStyle: (field?.displayStyle || 'default') as FieldDisplayStyle,
    unit: field?.unit || '', // Mértékegység (pl. "cm")
    iconUrl: field?.iconUrl || '', // Ikon URL
    validation: {
      min: field?.validation?.min?.toString() || '',
      max: field?.validation?.max?.toString() || '',
      step: field?.validation?.step?.toString() || '',
      pattern: field?.validation?.pattern || '',
    },
  });

  const [options, setOptions] = useState<FieldOption[]>(initOptions());
  const [presetValues, setPresetValues] = useState<PresetValue[]>(initPresetValues());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate key from label on blur (lazy - only when user leaves the label field)
  const handleLabelBlur = () => {
    if (!field && formData.label && !formData.key) {
      setFormData((prev) => ({ ...prev, key: generateKey(formData.label) }));
    }
  };

  // QUANTITY_SELECTOR mezőnél useInFormula mindig true
  useEffect(() => {
    if (formData.type === 'QUANTITY_SELECTOR' && !formData.useInFormula) {
      setFormData((prev) => ({ ...prev, useInFormula: true }));
    }
  }, [formData.type]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key) {
      newErrors.key = 'Mező kulcs kötelező';
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.key)) {
      newErrors.key = 'Mező kulcs csak kisbetűkkel, számokkal és alulvonással kezdődhet';
    } else if (existingKeys.includes(formData.key)) {
      newErrors.key = 'Ez a kulcs már létezik egy másik mezőnél';
    } else if (allSectionKeys.includes(formData.key)) {
      newErrors.key = 'Ez a kulcs már létezik egy szekciónál — ütközést okozhat';
    }

    if (!formData.label) {
      newErrors.label = 'Megjelenített név kötelező';
    }

    const typesWithOptions = ['SELECT', 'RADIO', 'PRODUCT_CARD', 'DELIVERY_TIME', 'EXTRAS', 'GRAPHIC_SELECT', 'QUANTITY_SELECTOR'];

    if (typesWithOptions.includes(formData.type) && options.length === 0) {
      newErrors.options = 'Legalább egy opció megadása kötelező';
    }

    // Validáljuk az opciókat
    if (typesWithOptions.includes(formData.type)) {
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
    setOptions([...options, {
      label: '',
      value: '',
      price: undefined,
      imageUrl: '',
      patternUrl: '',
      badge: '',
      description: '',
      htmlContent: '',
      features: []
    }]);
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    setOptions(newOptions);
  };

  // Generate option value from label on blur (lazy)
  const handleOptionLabelBlur = (index: number) => {
    const option = options[index];
    if (option && option.label && !option.value) {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], value: generateKey(option.label) };
      setOptions(newOptions);
    }
  };

  const updateOptionFeature = (optionIndex: number, featureIndex: number, value: string) => {
    const newOptions = [...options];
    const features = [...(newOptions[optionIndex].features || [])];
    features[featureIndex] = value;
    newOptions[optionIndex] = { ...newOptions[optionIndex], features };
    setOptions(newOptions);
  };

  const addOptionFeature = (optionIndex: number) => {
    const newOptions = [...options];
    const features = [...(newOptions[optionIndex].features || []), ''];
    newOptions[optionIndex] = { ...newOptions[optionIndex], features };
    setOptions(newOptions);
  };

  const removeOptionFeature = (optionIndex: number, featureIndex: number) => {
    const newOptions = [...options];
    const features = (newOptions[optionIndex].features || []).filter((_, i) => i !== featureIndex);
    newOptions[optionIndex] = { ...newOptions[optionIndex], features };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    if (direction === 'up' && index > 0) {
      [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    } else if (direction === 'down' && index < newOptions.length - 1) {
      [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    }
    setOptions(newOptions);
  };

  // Preset értékek kezelése
  const addPresetValue = () => {
    setPresetValues([...presetValues, { label: '', value: 0 }]);
  };

  const updatePresetValue = (index: number, updates: Partial<PresetValue>) => {
    const newPresets = [...presetValues];
    newPresets[index] = { ...newPresets[index], ...updates };
    setPresetValues(newPresets);
  };

  const removePresetValue = (index: number) => {
    setPresetValues(presetValues.filter((_, i) => i !== index));
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

    // Clean up options - remove empty fields
    const cleanedOptions = options.map(opt => {
      const cleanOpt: FieldOption = {
        label: opt.label,
        value: opt.value,
      };
      if (opt.price !== undefined) cleanOpt.price = opt.price;
      if (opt.imageUrl) cleanOpt.imageUrl = opt.imageUrl;
      if (opt.patternUrl) cleanOpt.patternUrl = opt.patternUrl;
      if (opt.badge) cleanOpt.badge = opt.badge;
      if (opt.description) cleanOpt.description = opt.description;
      if (opt.htmlContent) cleanOpt.htmlContent = opt.htmlContent;
      if (opt.features && opt.features.filter(f => f.trim()).length > 0) {
        cleanOpt.features = opt.features.filter(f => f.trim());
      }
      if (opt.enableUpload !== undefined) cleanOpt.enableUpload = opt.enableUpload;
      return cleanOpt;
    });

    const newField: Omit<TemplateField, 'id'> = {
      key: formData.key,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      placeholder: formData.placeholder || undefined,
      helpText: formData.helpText || undefined,
      useInFormula: formData.useInFormula,
      order: formData.order,
      displayStyle: formData.displayStyle !== 'default' ? formData.displayStyle : undefined,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
      options:
        (formData.type === 'SELECT' || formData.type === 'RADIO' || formData.type === 'PRODUCT_CARD' || formData.type === 'DELIVERY_TIME' || formData.type === 'EXTRAS' || formData.type === 'GRAPHIC_SELECT' || formData.type === 'QUANTITY_SELECTOR') && cleanedOptions.length > 0
          ? cleanedOptions
          : undefined,
      presetValues:
        formData.type === 'NUMBER' && presetValues.length > 0
          ? presetValues.filter(p => p.label.trim())
          : undefined,
      unit: formData.type === 'NUMBER' && formData.unit ? formData.unit : undefined,
      iconUrl: formData.iconUrl || undefined,
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
      size="large"
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
                onBlur={handleLabelBlur}
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

            {/* Warning when editing a key that's referenced in the formula */}
            {field && formData.key !== field.key && pricingFormula && (
              pricingFormula.includes(field.key) || pricingFormula.includes(`${field.key}_price`)
            ) && (
              <Banner tone="warning">
                A régi kulcs (<strong>{field.key}</strong>) szerepel az árképletben.
                Ha átírod, a képletet is frissítened kell, különben mentési hiba lesz!
              </Banner>
            )}

            <TextField
              label="Placeholder"
              value={formData.placeholder}
              onChange={(value) => setFormData((prev) => ({ ...prev, placeholder: value }))}
              placeholder="pl. Add meg a szélességet"
              autoComplete="off"
            />
          </FormLayout>

          <Divider />

          {/* Mező típus választás - vizuális */}
          <Text variant="headingMd" as="h3">Mező típusa</Text>
          <FieldTypeSelector
            value={formData.type}
            onChange={(type) => setFormData((prev) => ({ ...prev, type }))}
          />

          <FormLayout>

            <TextField
              label="Segítő szöveg"
              value={formData.helpText}
              onChange={(value) => setFormData((prev) => ({ ...prev, helpText: value }))}
              placeholder="Rövid magyarázat a mezőhöz"
              helpText="Ez a szöveg jelenik meg a mező mellett info ikonként"
              autoComplete="off"
              multiline={2}
            />

            <Box paddingBlockStart="200">
              <ImageUploader
                label="Mező ikon (opcionális)"
                value={formData.iconUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, iconUrl: url }))}
                endpoint="icon"
                maxSizeMB={1}
                previewSize={40}
                helpText="Ikon, ami a mező neve mellett jelenik meg"
              />
            </Box>
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
                helpText={
                  formData.type === 'QUANTITY_SELECTOR'
                    ? 'Mennyiség választó mező mindig szerepel az árkalkulációs képletben'
                    : 'Ha nincs bejelölve, a mező értéke nem befolyásolja az árat'
                }
                disabled={formData.type === 'QUANTITY_SELECTOR'}
              />
            </InlineStack>
          </FormLayout>

          <Divider />

          {/* NUMBER típusú validáció */}
          {formData.type === 'NUMBER' && (
            <>
              <Text variant="headingMd" as="h3">Szám beállítások</Text>
              <FormLayout>
                <TextField
                  label="Mértékegység"
                  value={formData.unit}
                  onChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                  placeholder="pl. cm, db, m², kg"
                  helpText="Ez jelenik meg az input mező végén (nem szerkeszthető a felhasználó által)"
                  autoComplete="off"
                />
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

              <Divider />

              {/* Preset értékek (gyorsgombok) */}
              <Text variant="headingMd" as="h3">Gyors értékek (opcionális)</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Előre meghatározott értékek, amiket a vásárló egy kattintással választhat.
              </Text>

              <BlockStack gap="300">
                {presetValues.map((preset, index) => (
                  <Box
                    key={index}
                    padding="300"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <InlineStack gap="300" align="center" blockAlign="end">
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Címke"
                          value={preset.label}
                          onChange={(value) => updatePresetValue(index, { label: value })}
                          placeholder="pl. Kicsi (50cm)"
                          autoComplete="off"
                          labelHidden={index > 0}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Érték"
                          type="number"
                          value={preset.value?.toString() || ''}
                          onChange={(value) =>
                            updatePresetValue(index, { value: value ? Number(value) : 0 })
                          }
                          placeholder="50"
                          autoComplete="off"
                          labelHidden={index > 0}
                        />
                      </div>
                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        onClick={() => removePresetValue(index)}
                        accessibilityLabel="Érték törlése"
                      />
                    </InlineStack>
                  </Box>
                ))}

                <Button icon={PlusIcon} onClick={addPresetValue}>
                  Gyors érték hozzáadása
                </Button>
              </BlockStack>
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

          {/* PRODUCT_CARD opciók - Gazdag termék kártyák */}
          {formData.type === 'PRODUCT_CARD' && (
            <>
              <Text variant="headingMd" as="h3">Termék kártyák</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Gazdag termék/anyag választó kártyák képpel, mintával, badge-el és HTML leírással.
              </Text>
              {errors.options && (
                <Banner tone="critical">{errors.options}</Banner>
              )}

              <BlockStack gap="500">
                {options.map((option, index) => (
                  <Box
                    key={index}
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                  >
                    <BlockStack gap="400">
                      {/* Header: Sorszám, sorrendezés és törlés */}
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingSm" as="h4">
                          {index + 1}. kártya
                          {option.badge && (
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 8px',
                              backgroundColor: '#d72c0d',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              {option.badge}
                            </span>
                          )}
                        </Text>
                        <InlineStack gap="100">
                          <Button
                            icon={ArrowUpIcon}
                            onClick={() => moveOption(index, 'up')}
                            disabled={index === 0}
                            accessibilityLabel="Feljebb"
                          />
                          <Button
                            icon={ArrowDownIcon}
                            onClick={() => moveOption(index, 'down')}
                            disabled={index === options.length - 1}
                            accessibilityLabel="Lejjebb"
                          />
                          <Button
                            icon={DeleteIcon}
                            tone="critical"
                            onClick={() => removeOption(index)}
                            accessibilityLabel="Kártya törlése"
                          />
                        </InlineStack>
                      </InlineStack>

                      {/* Alap mezők */}
                      <FormLayout>
                        <FormLayout.Group>
                          <TextField
                            label="Megnevezés"
                            value={option.label}
                            onChange={(value) => updateOption(index, { label: value })}
                            onBlur={() => handleOptionLabelBlur(index)}
                            placeholder="pl. Standard molnió"
                            autoComplete="off"
                            requiredIndicator
                          />
                          <TextField
                            label="Érték (kulcs)"
                            value={option.value}
                            onChange={(value) => updateOption(index, { value })}
                            placeholder="standard_molnio"
                            autoComplete="off"
                            helpText="Azonosító a rendszerben"
                          />
                        </FormLayout.Group>

                        <FormLayout.Group>
                          <TextField
                            label="Badge/Címke"
                            value={option.badge || ''}
                            onChange={(value) => updateOption(index, { badge: value })}
                            placeholder="pl. Legnépszerűbb"
                            autoComplete="off"
                            helpText="Kiemelő címke a kártya tetején"
                          />
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
                            helpText="Ár, ami megjelenik a kártyán"
                          />
                        </FormLayout.Group>
                      </FormLayout>

                      <Divider />

                      {/* Képek */}
                      <Text variant="bodyMd" as="span" fontWeight="semibold">Képek</Text>
                      <InlineStack gap="400" wrap={false}>
                        <div style={{ flex: 1 }}>
                          <ImageUploader
                            label="Termék kép"
                            value={option.imageUrl || ''}
                            onChange={(url) => updateOption(index, { imageUrl: url })}
                            endpoint="option-image"
                            maxSizeMB={2}
                            previewSize={80}
                            helpText="Fő termék/anyag fotó"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <ImageUploader
                            label="Minta kép"
                            value={option.patternUrl || ''}
                            onChange={(url) => updateOption(index, { patternUrl: url })}
                            endpoint="option-image"
                            maxSizeMB={2}
                            previewSize={80}
                            helpText="Textúra/minta előnézet"
                          />
                        </div>
                      </InlineStack>

                      <Divider />

                      {/* HTML tartalom */}
                      <TextField
                        label="HTML tartalom"
                        value={option.htmlContent || ''}
                        onChange={(value) => updateOption(index, { htmlContent: value })}
                        placeholder="<p>Részletes leírás <strong>formázással</strong>...</p>"
                        autoComplete="off"
                        multiline={4}
                        helpText="HTML formázott szöveg (p, strong, em, ul, li tagek támogatottak)"
                      />

                      {/* Rövid leírás */}
                      <TextField
                        label="Rövid leírás"
                        value={option.description || ''}
                        onChange={(value) => updateOption(index, { description: value })}
                        placeholder="Egyszerű szöveges leírás..."
                        autoComplete="off"
                        multiline={2}
                        helpText="Alternatíva a HTML tartalomhoz"
                      />

                      {/* Features lista */}
                      <BlockStack gap="200">
                        <Text variant="bodyMd" as="span" fontWeight="semibold">
                          Jellemzők (bullet pointok)
                        </Text>
                        {(option.features || []).map((feature, fIdx) => (
                          <InlineStack key={fIdx} gap="200" blockAlign="center">
                            <div style={{ flex: 1 }}>
                              <TextField
                                label={`Jellemző ${fIdx + 1}`}
                                labelHidden
                                value={feature}
                                onChange={(value) => updateOptionFeature(index, fIdx, value)}
                                placeholder="pl. UV álló, vízálló"
                                autoComplete="off"
                              />
                            </div>
                            <Button
                              icon={DeleteIcon}
                              tone="critical"
                              onClick={() => removeOptionFeature(index, fIdx)}
                              accessibilityLabel="Jellemző törlése"
                              size="slim"
                            />
                          </InlineStack>
                        ))}
                        <Button
                          icon={PlusIcon}
                          onClick={() => addOptionFeature(index)}
                          size="slim"
                        >
                          Jellemző hozzáadása
                        </Button>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                ))}

                <Button icon={PlusIcon} onClick={addOption} variant="primary">
                  Új kártya hozzáadása
                </Button>
              </BlockStack>

              <Banner tone="info">
                A PRODUCT_CARD típus ideális anyag- vagy termékválasztóhoz, ahol vizuális megjelenítés és részletes információk szükségesek.
              </Banner>
            </>
          )}

          {/* DELIVERY_TIME opciók - Átfutási idő választó */}
          {formData.type === 'DELIVERY_TIME' && (
            <>
              <Text variant="headingMd" as="h3">Átfutási idő opciók</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Válassz átfutási idő típus - egyszerű választó névvel, leírással és árral.
              </Text>
              {errors.options && (
                <Banner tone="critical">{errors.options}</Banner>
              )}

              <BlockStack gap="300">
                {options.map((option, index) => (
                  <Box
                    key={index}
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <InlineStack gap="300" align="center" blockAlign="end">
                      <div style={{ flex: 2 }}>
                        <TextField
                          label="Megnevezés"
                          value={option.label}
                          onChange={(value) => updateOption(index, { label: value })}
                          onBlur={() => handleOptionLabelBlur(index)}
                          placeholder="pl. Expressz (3 munkanap)"
                          autoComplete="off"
                          requiredIndicator
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Érték (kulcs)"
                          value={option.value}
                          onChange={(value) => updateOption(index, { value })}
                          placeholder="express"
                          autoComplete="off"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Ár (Ft)"
                          type="number"
                          value={option.price?.toString() || ''}
                          onChange={(value) =>
                            updateOption(index, {
                              price: value ? Number(value) : undefined,
                            })
                          }
                          placeholder="0"
                          autoComplete="off"
                        />
                      </div>
                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        onClick={() => removeOption(index)}
                        accessibilityLabel="Opció törlése"
                      />
                    </InlineStack>
                    <div style={{ marginTop: '12px' }}>
                      <TextField
                        label="Rövid leírás"
                        value={option.description || ''}
                        onChange={(value) => updateOption(index, { description: value })}
                        placeholder="pl. Gyorsított gyártás, hétvégi kiszállítás"
                        autoComplete="off"
                      />
                    </div>
                  </Box>
                ))}

                <Button icon={PlusIcon} onClick={addOption}>
                  Új opció hozzáadása
                </Button>
              </BlockStack>

              <Banner tone="info">
                Az DELIVERY_TIME típus ideális átfutási idő vagy szállítási mód választáshoz.
              </Banner>
            </>
          )}

          {/* EXTRAS opciók - Extrák választó (több is választható) */}
          {formData.type === 'EXTRAS' && (
            <>
              <Text variant="headingMd" as="h3">Extra opciók</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Kiegészítők/extrák - a vásárló többet is választhat. Mindegyiknek van képe, címe, leírása és ára.
              </Text>
              {errors.options && (
                <Banner tone="critical">{errors.options}</Banner>
              )}

              <BlockStack gap="400">
                {options.map((option, index) => (
                  <Box
                    key={index}
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <BlockStack gap="300">
                      {/* Header */}
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingSm" as="h4">
                          {index + 1}. extra
                        </Text>
                        <Button
                          icon={DeleteIcon}
                          tone="critical"
                          onClick={() => removeOption(index)}
                          accessibilityLabel="Extra törlése"
                        />
                      </InlineStack>

                      {/* Alap mezők */}
                      <FormLayout>
                        <FormLayout.Group>
                          <TextField
                            label="Megnevezés"
                            value={option.label}
                            onChange={(value) => updateOption(index, { label: value })}
                            onBlur={() => handleOptionLabelBlur(index)}
                            placeholder="pl. Laminálás"
                            autoComplete="off"
                            requiredIndicator
                          />
                          <TextField
                            label="Érték (kulcs)"
                            value={option.value}
                            onChange={(value) => updateOption(index, { value })}
                            placeholder="laminalas"
                            autoComplete="off"
                          />
                          <TextField
                            label="Ár (Ft)"
                            type="number"
                            value={option.price?.toString() || ''}
                            onChange={(value) =>
                              updateOption(index, {
                                price: value ? Number(value) : undefined,
                              })
                            }
                            placeholder="0"
                            autoComplete="off"
                          />
                        </FormLayout.Group>
                      </FormLayout>

                      {/* Kép */}
                      <ImageUploader
                        label="Extra kép"
                        value={option.imageUrl || ''}
                        onChange={(url) => updateOption(index, { imageUrl: url })}
                        endpoint="option-image"
                        maxSizeMB={2}
                        previewSize={60}
                        helpText="Opcionális illusztráció"
                      />

                      {/* Leírás */}
                      <TextField
                        label="Leírás"
                        value={option.description || ''}
                        onChange={(value) => updateOption(index, { description: value })}
                        placeholder="pl. Extra védőréteg a tartósságért"
                        autoComplete="off"
                        multiline={2}
                      />
                    </BlockStack>
                  </Box>
                ))}

                <Button icon={PlusIcon} onClick={addOption}>
                  Új extra hozzáadása
                </Button>
              </BlockStack>

              <Banner tone="info">
                Az EXTRAS típusnál a vásárló több opciót is kiválaszthat egyszerre. Az árak összeadódnak.
              </Banner>
            </>
          )}

          {/* GRAPHIC_SELECT opciók - Grafika választó */}
          {formData.type === 'GRAPHIC_SELECT' && (
            <>
              <Text variant="headingMd" as="h3">Grafika opciók</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                A vásárló választhat: feltölti saját grafikáját, vagy grafikai tervezést kér (felárért).
              </Text>
              {errors.options && (
                <Banner tone="critical">{errors.options}</Banner>
              )}

              <BlockStack gap="400">
                {options.length === 0 && (
                  <Banner tone="warning">
                    Adj hozzá legalább két opciót: egy "Feltöltöm" és egy "Tervezést kérek" lehetőséget.
                  </Banner>
                )}

                {options.map((option, index) => (
                  <Box
                    key={index}
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                  >
                    <BlockStack gap="400">
                      {/* Header */}
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingSm" as="h4">
                          {index + 1}. opció
                          {option.enableUpload && (
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 8px',
                              backgroundColor: '#1f8547',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              Feltöltés engedélyezve
                            </span>
                          )}
                        </Text>
                        <Button
                          icon={DeleteIcon}
                          tone="critical"
                          onClick={() => removeOption(index)}
                          accessibilityLabel="Opció törlése"
                        />
                      </InlineStack>

                      {/* Alap mezők */}
                      <FormLayout>
                        <FormLayout.Group>
                          <TextField
                            label="Megnevezés"
                            value={option.label}
                            onChange={(value) => updateOption(index, { label: value })}
                            onBlur={() => handleOptionLabelBlur(index)}
                            placeholder="pl. Feltöltöm a grafikát"
                            autoComplete="off"
                            requiredIndicator
                          />
                          <TextField
                            label="Érték (kulcs)"
                            value={option.value}
                            onChange={(value) => updateOption(index, { value })}
                            placeholder="feltoltes"
                            autoComplete="off"
                            helpText="Azonosító a rendszerben"
                          />
                        </FormLayout.Group>

                        <FormLayout.Group>
                          <TextField
                            label="Ár (Ft)"
                            type="number"
                            value={option.price?.toString() || ''}
                            onChange={(value) =>
                              updateOption(index, {
                                price: value ? Number(value) : undefined,
                              })
                            }
                            placeholder="0"
                            autoComplete="off"
                            helpText="Felár ezért az opcióért"
                          />
                          <div style={{ paddingTop: '24px' }}>
                            <Checkbox
                              label="Fájl feltöltés engedélyezése"
                              checked={option.enableUpload || false}
                              onChange={(checked) => updateOption(index, { enableUpload: checked })}
                              helpText="Ha be van jelölve, a vásárló feltölthet grafikát"
                            />
                          </div>
                        </FormLayout.Group>
                      </FormLayout>

                      {/* Leírás */}
                      <TextField
                        label="Leírás"
                        value={option.description || ''}
                        onChange={(value) => updateOption(index, { description: value })}
                        placeholder="pl. Töltsd fel a kész grafikád PNG vagy PDF formátumban"
                        autoComplete="off"
                        multiline={2}
                      />

                      {/* Kép */}
                      <ImageUploader
                        label="Illusztráció (opcionális)"
                        value={option.imageUrl || ''}
                        onChange={(url) => updateOption(index, { imageUrl: url })}
                        endpoint="option-image"
                        maxSizeMB={2}
                        previewSize={60}
                        helpText="Kép az opció mellé"
                      />
                    </BlockStack>
                  </Box>
                ))}

                <InlineStack gap="300">
                  <Button
                    icon={PlusIcon}
                    onClick={() => {
                      setOptions([...options, {
                        label: 'Feltöltöm a grafikát',
                        value: 'feltoltes',
                        price: 0,
                        enableUpload: true,
                        description: 'Töltsd fel a kész grafikád',
                        imageUrl: '',
                        features: []
                      }]);
                    }}
                  >
                    "Feltöltöm" opció
                  </Button>
                  <Button
                    icon={PlusIcon}
                    onClick={() => {
                      setOptions([...options, {
                        label: 'Grafikai tervezést kérek',
                        value: 'tervezes',
                        price: 5000,
                        enableUpload: false,
                        description: 'Grafikusunk elkészíti a tervet',
                        imageUrl: '',
                        features: []
                      }]);
                    }}
                  >
                    "Tervezést kérek" opció
                  </Button>
                </InlineStack>
              </BlockStack>

              <Banner tone="info">
                A GRAPHIC_SELECT típusnál tipikusan két opció van: egy feltöltéses (ingyenes vagy olcsóbb) és egy tervezést kérő (felárért).
                Az "enableUpload" beállítás határozza meg, melyik opciónál jelenjen meg a fájlfeltöltő.
              </Banner>
            </>
          )}

          {/* QUANTITY_SELECTOR opciók - Mennyiség preset értékek */}
          {formData.type === 'QUANTITY_SELECTOR' && (
            <>
              <Text variant="headingMd" as="h3">Mennyiség preset értékek</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Gyors választás gombok (pl. 1 db, 5 db, 10 db). A label az érték amit a felhasználó lát, a value a tényleges szám.
              </Text>

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
                    <InlineStack gap="300" align="end">
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Címke (pl. '10 db')"
                          value={option.label}
                          onChange={(value) => updateOption(index, { label: value })}
                          onBlur={() => handleOptionLabelBlur(index)}
                          placeholder="10 db"
                          autoComplete="off"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Érték (szám)"
                          type="number"
                          value={option.value}
                          onChange={(value) => updateOption(index, { value })}
                          placeholder="10"
                          autoComplete="off"
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
                  Preset hozzáadása
                </Button>
              </BlockStack>

              <Banner tone="info">
                A QUANTITY_SELECTOR preset értékei gyors választást biztosítanak a vásárlónak.
                Például: 1 db, 5 db, 10 db, 25 db.
              </Banner>
            </>
          )}

          {/* SELECT/RADIO opciók */}
          {(formData.type === 'SELECT' || formData.type === 'RADIO') && (
            <>
              <Text variant="headingMd" as="h3">Megjelenítés</Text>
              <FormLayout>
                <Select
                  label="Megjelenítési stílus"
                  options={DISPLAY_STYLE_OPTIONS}
                  value={formData.displayStyle}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, displayStyle: value as FieldDisplayStyle }))
                  }
                  helpText="Kártyás: képpel és leírással. Chip: kompakt gombok."
                />
              </FormLayout>

              <Divider />

              <Text variant="headingMd" as="h3">Opciók</Text>
              {errors.options && (
                <Banner tone="critical">{errors.options}</Banner>
              )}

              <BlockStack gap="400">
                {options.map((option, index) => (
                  <Box
                    key={index}
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <BlockStack gap="300">
                      {/* Alap mezők */}
                      <InlineStack gap="300" align="center" blockAlign="end">
                        <div style={{ flex: 2 }}>
                          <TextField
                            label="Címke"
                            value={option.label}
                            onChange={(value) => updateOption(index, { label: value })}
                            onBlur={() => handleOptionLabelBlur(index)}
                            placeholder="pl. PVC anyag"
                            autoComplete="off"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Érték"
                            value={option.value}
                            onChange={(value) => updateOption(index, { value })}
                            placeholder="pvc"
                            autoComplete="off"
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
                          />
                        </div>
                        <Button
                          icon={DeleteIcon}
                          tone="critical"
                          onClick={() => removeOption(index)}
                          accessibilityLabel="Opció törlése"
                        />
                      </InlineStack>

                      {/* Kártyás megjelenítés extra mezői */}
                      {formData.displayStyle === 'card' && (
                        <>
                          <ImageUploader
                            label="Opció kép"
                            value={option.imageUrl || ''}
                            onChange={(url) => updateOption(index, { imageUrl: url })}
                            endpoint="option-image"
                            maxSizeMB={2}
                            previewSize={48}
                            helpText="Opcionális kép a kártyán"
                          />

                          <TextField
                            label="Leírás"
                            value={option.description || ''}
                            onChange={(value) => updateOption(index, { description: value })}
                            placeholder="Rövid leírás az opcióról..."
                            autoComplete="off"
                            multiline={2}
                          />

                          {/* Features lista */}
                          <BlockStack gap="200">
                            <Text variant="bodyMd" as="span">Jellemzők (felsorolás pontok)</Text>
                            {(option.features || []).map((feature, fIdx) => (
                              <InlineStack key={fIdx} gap="200" blockAlign="center">
                                <div style={{ flex: 1 }}>
                                  <TextField
                                    label={`Jellemző ${fIdx + 1}`}
                                    labelHidden
                                    value={feature}
                                    onChange={(value) => updateOptionFeature(index, fIdx, value)}
                                    placeholder="pl. UV álló"
                                    autoComplete="off"
                                  />
                                </div>
                                <Button
                                  icon={DeleteIcon}
                                  tone="critical"
                                  onClick={() => removeOptionFeature(index, fIdx)}
                                  accessibilityLabel="Jellemző törlése"
                                  size="slim"
                                />
                              </InlineStack>
                            ))}
                            <Button
                              icon={PlusIcon}
                              onClick={() => addOptionFeature(index)}
                              size="slim"
                            >
                              Jellemző hozzáadása
                            </Button>
                          </BlockStack>
                        </>
                      )}
                    </BlockStack>
                  </Box>
                ))}

                <Button icon={PlusIcon} onClick={addOption}>
                  Opció hozzáadása
                </Button>
              </BlockStack>

              <Banner tone="info">
                A felár hozzáadódik az árhoz, ha ezt az opciót választja a vásárló.
                {formData.displayStyle === 'card' && ' Kártyás megjelenítésnél kép és leírás is megadható.'}
              </Banner>
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};
