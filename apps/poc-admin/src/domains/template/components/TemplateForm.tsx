/**
 * TemplateForm - Create and edit templates
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  InlineStack,
  BlockStack,
  Banner,
  Text,
} from '@shopify/polaris';
import type { Template, TemplateScope } from '../types';
import { SCOPE_TYPE_OPTIONS } from '../constants';
import { validateTemplateName, validateFormula } from '@/common/utils/validation';
import { FormSection } from '@/common/components/UIComponents';
import { useForm } from '@/common/hooks';
import { ScopeSection } from '../../assignments/components/ScopeSection';
import { FieldsList } from '../../fields/components/FieldsList';
import { FormulaBuilder } from './FormulaBuilder';

// ============================================================================
// TemplateForm Component
// ============================================================================

interface TemplateFormProps {
  template?: Template | null;
  onSubmit: (template: Partial<Template>) => Promise<void>;
  onCancel: () => void;
}

export function TemplateForm({
  template,
  onSubmit,
  onCancel,
}: TemplateFormProps) {
  const isEditMode = Boolean(template);

  const {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleSubmit,
    setFieldError,
  } = useForm<Partial<Template>>({
    initialValues: template || {
      name: '',
      description: '',
      isActive: true,
      scope: { type: 'global' },
      fields: [],
      conditionalRules: [],
      pricingFormula: '',
      pricingMeta: {},
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
    validate: (values) => {
      const errors: any = {};

      // Name validation
      const nameValidation = validateTemplateName(values.name || '');
      if (!nameValidation.isValid) {
        errors.name = nameValidation.error;
      }

      // Formula validation
      if (values.pricingFormula) {
        const formulaValidation = validateFormula(values.pricingFormula);
        if (!formulaValidation.isValid) {
          errors.pricingFormula = formulaValidation.error;
        }
      }

      return errors;
    },
  });

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
                value={values.name || ''}
                onChange={(value) => handleChange('name', value)}
                error={errors.name}
                autoComplete="off"
                placeholder="pl. Molinó kalkulátor"
                requiredIndicator
              />

              <TextField
                label="Leírás (opcionális)"
                value={values.description || ''}
                onChange={(value) => handleChange('description', value)}
                multiline={3}
                autoComplete="off"
                placeholder="Rövid leírás a sablon céljáról"
              />

              <Checkbox
                label="Sablon aktív"
                checked={values.isActive}
                onChange={(checked) => handleChange('isActive', checked)}
                helpText="Az inaktív sablonok nem jelennek meg a termékoldalakon"
              />
            </FormLayout>
          </FormSection>
        </Card>

        {/* Scope Configuration */}
        <Card>
          <FormSection
            title="Hatókör"
            description="Határozd meg, mely termékekre vonatkozik ez a sablon"
          >
            <ScopeSection
              scope={values.scope as TemplateScope}
              onChange={(scope) => handleChange('scope', scope)}
            />
          </FormSection>
        </Card>

        {/* Fields Configuration - MOVED UP */}
        <Card>
          <FormSection
            title="Mezők konfigurációja"
            description="Add meg a sablon mezőit és tulajdonságaikat"
          >
            <FieldsList
              fields={values.fields || []}
              onChange={(fields) => handleChange('fields', fields)}
            />
          </FormSection>
        </Card>

        {/* Pricing Formula - MOVED DOWN */}
        <Card>
          <FormSection
            title="Árkalkulációs képlet"
            description="Add meg a matematikai képletet, amely kiszámítja a végleges árat"
          >
            <FormulaBuilder
              formula={values.pricingFormula || ''}
              fields={values.fields || []}
              onChange={(formula) => handleChange('pricingFormula', formula)}
              error={errors.pricingFormula}
            />
          </FormSection>
        </Card>

        {/* Action Buttons */}
        <Card>
          <InlineStack align="end" gap="300">
            <Button onClick={onCancel}>
              Mégsem
            </Button>
            <Button
              variant="primary"
              submit
              loading={isSubmitting}
              disabled={!isDirty}
            >
              {isEditMode ? 'Módosítások mentése' : 'Sablon létrehozása'}
            </Button>
          </InlineStack>
        </Card>
      </BlockStack>
    </Form>
  );
}
