/**
 * TemplateForm - Create and edit templates
 *
 * Szekciók:
 * - Alapadatok (név, leírás)
 * - Hatókör (scope)
 * - Mezők konfigurációja
 * - Árkalkulációs képlet
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
import type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  ScopeType,
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

    const quantitySelectorFields = allFields.filter((f) => f.type === 'QUANTITY_SELECTOR');
    if (quantitySelectorFields.length === 0) {
      newErrors.fields = 'Legalább egy Mennyiség választó (QUANTITY_SELECTOR) mező kötelező a sablonban';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
