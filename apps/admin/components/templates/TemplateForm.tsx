/**
 * TemplateForm - Create and edit templates
 *
 * Szekciók:
 * - Alapadatok (név, leírás)
 * - Hatókör (scope)
 * - Mezők konfigurációja
 * - Árkalkulációs képlet
 * - Rendelési mennyiség (min/max)
 * - Sávos kedvezmények
 * - Megjegyzés mező
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  Form,
  FormLayout,
  TextField,
  Checkbox,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Banner,
  Divider,
  Box,
} from '@shopify/polaris';
import { PlusIcon, DeleteIcon } from '@shopify/polaris-icons';
import type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  ScopeType,
  DiscountTier,
  TemplateSection,
} from '@/types/template';
import { FormSection } from '@/components/ui/UIComponents';
import { SectionsList } from './SectionsList';
import { FormulaBuilder } from './FormulaBuilder';
import { ScopeSelector } from './ScopeSelector';

// ============================================================================
// TemplateForm Component
// ============================================================================

interface TemplateFormProps {
  template?: Template | null;
  onSubmit: (data: CreateTemplateDto | UpdateTemplateDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TemplateForm({
  template,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TemplateFormProps) {
  const isEditMode = Boolean(template);

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    pricingFormula: template?.pricingFormula || '',
    scopeType: template?.scopeType || ('GLOBAL' as ScopeType),
    scopeValues: template?.scopeValues || [],
    sections: template?.sections || ([] as TemplateSection[]),

    // Rendelési mennyiség
    minQuantity: template?.minQuantity?.toString() || '',
    maxQuantity: template?.maxQuantity?.toString() || '',
    minQuantityMessage: template?.minQuantityMessage || '',
    maxQuantityMessage: template?.maxQuantityMessage || '',

    // Sávos kedvezmények
    discountTiers: template?.discountTiers || ([] as DiscountTier[]),

    // Megjegyzés mező
    hasNotesField: template?.hasNotesField || false,
    notesFieldLabel: template?.notesFieldLabel || 'Megjegyzés',
    notesFieldPlaceholder: template?.notesFieldPlaceholder || 'Írja ide az egyedi kéréseit...',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Sablon neve kötelező';
    }

    if (!formData.pricingFormula || formData.pricingFormula.trim().length === 0) {
      newErrors.pricingFormula = 'Árkalkulációs képlet kötelező';
    }

    // Collect all fields from sections
    const allFields = formData.sections.flatMap((s) => s.fields || []);

    if (formData.sections.length === 0) {
      newErrors.fields = 'Legalább egy szekció hozzáadása kötelező';
    }

    const numberFields = allFields.filter((f) => f.type === 'NUMBER');
    if (numberFields.length === 0 && formData.pricingFormula.trim()) {
      newErrors.fields =
        'Legalább egy NUMBER típusú mező szükséges a képlet használatához';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sávos kedvezmény kezelő függvények
  const addDiscountTier = () => {
    const lastTier = formData.discountTiers[formData.discountTiers.length - 1];
    const newTier: DiscountTier = {
      minQty: lastTier ? (lastTier.maxQty || 0) + 1 : 1,
      maxQty: null,
      discount: 0,
    };
    handleChange('discountTiers', [...formData.discountTiers, newTier]);
  };

  const updateDiscountTier = (index: number, updates: Partial<DiscountTier>) => {
    const newTiers = [...formData.discountTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    handleChange('discountTiers', newTiers);
  };

  const removeDiscountTier = (index: number) => {
    handleChange(
      'discountTiers',
      formData.discountTiers.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      const submitData: CreateTemplateDto | UpdateTemplateDto = {
        name: formData.name,
        description: formData.description || undefined,
        pricingFormula: formData.pricingFormula,
        scopeType: formData.scopeType,
        scopeValues: formData.scopeValues,
        sections: formData.sections,

        // Rendelési mennyiség
        minQuantity: formData.minQuantity ? Number(formData.minQuantity) : undefined,
        maxQuantity: formData.maxQuantity ? Number(formData.maxQuantity) : undefined,
        minQuantityMessage: formData.minQuantityMessage || undefined,
        maxQuantityMessage: formData.maxQuantityMessage || undefined,

        // Sávos kedvezmények
        discountTiers:
          formData.discountTiers.length > 0 ? formData.discountTiers : undefined,

        // Megjegyzés mező
        hasNotesField: formData.hasNotesField,
        notesFieldLabel: formData.hasNotesField ? formData.notesFieldLabel : undefined,
        notesFieldPlaceholder: formData.hasNotesField ? formData.notesFieldPlaceholder : undefined,
      };

      await onSubmit(submitData);
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Hiba történt a mentés során' });
      }
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <BlockStack gap="500">
        {/* Basic Information */}
        <Card>
          <FormSection
            title="Alapadatok"
            description="Add meg a sablon nevét és leírását"
          >
            <FormLayout>
              <TextField
                label="Sablon neve"
                value={formData.name}
                onChange={(value) => handleChange('name', value)}
                error={errors.name}
                autoComplete="off"
                placeholder="pl. Molinó kalkulátor"
                requiredIndicator
              />

              <TextField
                label="Leírás (opcionális)"
                value={formData.description}
                onChange={(value) => handleChange('description', value)}
                multiline={3}
                autoComplete="off"
                placeholder="Rövid leírás a sablon céljáról"
              />
            </FormLayout>
          </FormSection>
        </Card>

        {/* Scope Configuration */}
        <Card>
          <FormSection
            title="Hatókör"
            description="Válaszd ki, hogy a sablon mely termékekre vonatkozzon"
          >
            <ScopeSelector
              scopeType={formData.scopeType}
              scopeValues={formData.scopeValues}
              onChange={(scopeType, scopeValues) => {
                handleChange('scopeType', scopeType);
                handleChange('scopeValues', scopeValues);
              }}
              disabled={isSubmitting}
            />
          </FormSection>
        </Card>

        {/* Sections Configuration */}
        <Card>
          <FormSection
            title="Szekciók konfigurációja"
            description="Csoportosítsd a mezőket szekciókba a jobb felhasználói élmény érdekében"
          >
            {errors.fields && (
              <div style={{ marginBottom: '16px' }}>
                <Text as="p" tone="critical">
                  {errors.fields}
                </Text>
              </div>
            )}
            <Banner tone="info">
              <p>
                A szekciók segítségével a mezők logikus csoportokba rendezhetők.
                Minden szekció egy összecsukható kártya lesz a storefront-on.
                A built-in típusú szekciók (Mennyiség, Expressz, Megjegyzés) automatikusan renderelődnek.
              </p>
            </Banner>
            <div style={{ marginTop: '16px' }}>
              <SectionsList
                sections={formData.sections}
                onChange={(sections) => handleChange('sections', sections)}
              />
            </div>
          </FormSection>
        </Card>

        {/* Pricing Formula */}
        <Card>
          <FormSection
            title="Árkalkulációs képlet"
            description="Add meg a matematikai képletet, amely kiszámítja a végleges árat"
          >
            <FormulaBuilder
              formula={formData.pricingFormula}
              fields={formData.sections.flatMap((s) => s.fields || [])}
              onChange={(formula) => handleChange('pricingFormula', formula)}
              error={errors.pricingFormula}
            />
          </FormSection>
        </Card>

        {/* Quantity Limits */}
        <Card>
          <FormSection
            title="Rendelési mennyiség"
            description="Állítsd be a minimális és maximális rendelhető mennyiséget (opcionális)"
          >
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  label="Minimum mennyiség"
                  type="number"
                  value={formData.minQuantity}
                  onChange={(value) => handleChange('minQuantity', value)}
                  placeholder="pl. 1"
                  autoComplete="off"
                />
                <TextField
                  label="Maximum mennyiség"
                  type="number"
                  value={formData.maxQuantity}
                  onChange={(value) => handleChange('maxQuantity', value)}
                  placeholder="pl. 100"
                  autoComplete="off"
                />
              </FormLayout.Group>

              <TextField
                label="Minimum üzenet"
                value={formData.minQuantityMessage}
                onChange={(value) => handleChange('minQuantityMessage', value)}
                placeholder="pl. Minimum 5 db rendelhető"
                helpText="Ez jelenik meg, ha a vevő kevesebbet próbál rendelni"
                autoComplete="off"
              />

              <TextField
                label="Maximum üzenet"
                value={formData.maxQuantityMessage}
                onChange={(value) => handleChange('maxQuantityMessage', value)}
                placeholder="pl. Maximum 100 db rendelhető online, nagyobb mennyiséghez kérj ajánlatot"
                helpText="Ez jelenik meg, ha a vevő többet próbál rendelni"
                autoComplete="off"
              />
            </FormLayout>
          </FormSection>
        </Card>

        {/* Discount Tiers */}
        <Card>
          <FormSection
            title="Sávos kedvezmények"
            description="Mennyiségi kedvezmények beállítása - termékenként számítva"
          >
            <BlockStack gap="400">
              {formData.discountTiers.length > 0 && (
                <BlockStack gap="300">
                  {formData.discountTiers.map((tier, index) => (
                    <Box
                      key={index}
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <InlineStack gap="300" align="center" blockAlign="end">
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Min. db"
                            type="number"
                            value={tier.minQty.toString()}
                            onChange={(value) =>
                              updateDiscountTier(index, { minQty: Number(value) })
                            }
                            autoComplete="off"
                            labelHidden={index > 0}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Max. db"
                            type="number"
                            value={tier.maxQty?.toString() || ''}
                            onChange={(value) =>
                              updateDiscountTier(index, {
                                maxQty: value ? Number(value) : null,
                              })
                            }
                            placeholder="∞"
                            autoComplete="off"
                            labelHidden={index > 0}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Kedvezmény %"
                            type="number"
                            value={tier.discount.toString()}
                            onChange={(value) =>
                              updateDiscountTier(index, { discount: Number(value) })
                            }
                            suffix="%"
                            autoComplete="off"
                            labelHidden={index > 0}
                          />
                        </div>
                        <Button
                          icon={DeleteIcon}
                          tone="critical"
                          onClick={() => removeDiscountTier(index)}
                          accessibilityLabel="Sáv törlése"
                        />
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              )}

              <Button icon={PlusIcon} onClick={addDiscountTier}>
                Kedvezmény sáv hozzáadása
              </Button>

              {formData.discountTiers.length > 0 && (
                <Banner tone="info">
                  Példa: 1-5 db = 0%, 6-9 db = 10%, 10+ db = 15%. A kedvezmény a végső
                  számított árból vonódik le.
                </Banner>
              )}
            </BlockStack>
          </FormSection>
        </Card>

        {/* Notes Field */}
        <Card>
          <FormSection
            title="Megjegyzés mező"
            description="Opcionális szöveges mező a vásárlói megjegyzésekhez"
          >
            <BlockStack gap="400">
              <Checkbox
                label="Megjegyzés mező megjelenítése a storefront-on"
                checked={formData.hasNotesField}
                onChange={(checked) => handleChange('hasNotesField', checked)}
              />

              {formData.hasNotesField && (
                <>
                  <Divider />
                  <FormLayout>
                    <TextField
                      label="Mező címkéje"
                      value={formData.notesFieldLabel}
                      onChange={(value) => handleChange('notesFieldLabel', value)}
                      placeholder="Megjegyzés"
                      autoComplete="off"
                    />

                    <TextField
                      label="Placeholder szöveg"
                      value={formData.notesFieldPlaceholder}
                      onChange={(value) => handleChange('notesFieldPlaceholder', value)}
                      placeholder="Írja ide az egyedi kéréseit..."
                      autoComplete="off"
                    />
                  </FormLayout>

                  <Banner tone="info">
                    A megjegyzés mező a storefront-on jelenik meg, ahol a vásárló egyedi
                    kéréseket írhat a rendeléséhez.
                  </Banner>
                </>
              )}
            </BlockStack>
          </FormSection>
        </Card>

        {/* Submit Error */}
        {errors.submit && (
          <Card>
            <Text as="p" tone="critical">
              {errors.submit}
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <InlineStack align="end" gap="300">
            <Button onClick={onCancel} disabled={isSubmitting}>
              Mégsem
            </Button>
            <Button
              variant="primary"
              submit
              loading={isSubmitting}
              disabled={!isDirty || isSubmitting}
            >
              {isEditMode ? 'Módosítások mentése' : 'Sablon létrehozása'}
            </Button>
          </InlineStack>
        </Card>
      </BlockStack>
    </Form>
  );
}
