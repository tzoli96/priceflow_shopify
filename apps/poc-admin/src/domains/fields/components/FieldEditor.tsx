import React, { useState } from 'react';
import { Modal, FormLayout, TextField, Select, Checkbox } from '@shopify/polaris';
import type { TemplateField, FieldType } from '../../template/types';

interface FieldEditorProps {
  field: TemplateField | null;
  onSave: (field: TemplateField) => void;
  onClose: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({ field, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    key: field?.key || '',
    label: field?.label || '',
    type: field?.type || 'text' as FieldType,
    required: field?.required || false,
    useInFormula: field?.useInFormula !== undefined ? field.useInFormula : true,
    placeholder: field?.placeholder || '',
    helpText: field?.helpText || '',
    options: field?.options?.map(o => o.label).join(', ') || ''
  });

  const fieldTypeOptions = [
    { label: 'Szám', value: 'number' },
    { label: 'Szöveg', value: 'text' },
    { label: 'Lista', value: 'select' },
    { label: 'Radio gombok', value: 'radio' },
    { label: 'Jelölőnégyzet', value: 'checkbox' },
    { label: 'Szövegterület', value: 'textarea' },
    { label: 'Fájl', value: 'file' }
  ];

  const handleSave = () => {
    const newField: TemplateField = {
      key: formData.key,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      useInFormula: formData.useInFormula,
      placeholder: formData.placeholder,
      helpText: formData.helpText,
      options: (formData.type === 'select' || formData.type === 'radio') && formData.options
        ? formData.options.split(',').map(o => ({ label: o.trim(), value: o.trim().toLowerCase() }))
        : undefined
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
      secondaryActions={[{
        content: 'Mégsem',
        onAction: onClose,
      }]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Mező kulcs"
            value={formData.key}
            onChange={(value) => setFormData(prev => ({ ...prev, key: value }))}
            placeholder="pl. width_cm"
          />
          
          <TextField
            label="Megjelenített név"
            value={formData.label}
            onChange={(value) => setFormData(prev => ({ ...prev, label: value }))}
            placeholder="pl. Szélesség (cm)"
          />
          
          <Select
            label="Mező típusa"
            options={fieldTypeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as FieldType }))}
          />
          
          <Checkbox
            label="Kötelező mező"
            checked={formData.required}
            onChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
          />

          <Checkbox
            label="Használható a képletben"
            checked={formData.useInFormula}
            onChange={(checked) => setFormData(prev => ({ ...prev, useInFormula: checked }))}
            helpText="Ha be van jelölve, ez a mező használható lesz az árkalkulációs képletben"
          />

          <TextField
            label="Placeholder szöveg"
            value={formData.placeholder}
            onChange={(value) => setFormData(prev => ({ ...prev, placeholder: value }))}
          />
          
          <TextField
            label="Segítő szöveg"
            value={formData.helpText}
            onChange={(value) => setFormData(prev => ({ ...prev, helpText: value }))}
          />
          
          {(formData.type === 'select' || formData.type === 'radio') && (
            <TextField
              label="Opciók (vesszővel elválasztva)"
              value={formData.options}
              onChange={(value) => setFormData(prev => ({ ...prev, options: value }))}
              placeholder="Opció 1, Opció 2, Opció 3"
            />
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
};
