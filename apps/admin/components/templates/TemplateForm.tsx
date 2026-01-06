/**
 * TemplateForm - Create and edit templates
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
} from '@shopify/polaris';
import type { Template, CreateTemplateDto, UpdateTemplateDto, ScopeType } from '@/types/template';
import { FormSection } from '@/components/ui/UIComponents';
import { FieldsList } from './FieldsList';
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
    fields: template?.fields || [],
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

    if (formData.fields.length === 0) {
      newErrors.fields = 'Legalább egy mező hozzáadása kötelező';
    }

    const numberFields = formData.fields.filter((f) => f.type === 'NUMBER');
    if (numberFields.length === 0 && formData.pricingFormula.trim()) {
      newErrors.fields =
        'Legalább egy NUMBER típusú mező szükséges a képlet használatához';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description || undefined,
        pricingFormula: formData.pricingFormula,
        scopeType: formData.scopeType,
        scopeValues: formData.scopeValues,
        fields: formData.fields,
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

        {/* Fields Configuration */}
        <Card>
          <FormSection
            title="Mezők konfigurációja"
            description="Add meg a sablon mezőit és tulajdonságaikat"
          >
            {errors.fields && (
              <div style={{ marginBottom: '16px' }}>
                <Text as="p" tone="critical">
                  {errors.fields}
                </Text>
              </div>
            )}
            <FieldsList
              fields={formData.fields}
              onChange={(fields) => handleChange('fields', fields)}
            />
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
              fields={formData.fields}
              onChange={(formula) => handleChange('pricingFormula', formula)}
              error={errors.pricingFormula}
            />
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
