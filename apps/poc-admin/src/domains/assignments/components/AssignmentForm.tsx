import React, { useState } from 'react';
import { Card, Form, FormLayout, TextField, Button, Checkbox, BlockStack } from '@shopify/polaris';
import { FormSection } from '@/common/components/UIComponents';
import { useAssignments } from '../hooks/useAssignments';
import { ScopeSection } from './ScopeSection';
import type { TemplateScope } from '../../template/types';

export const AssignmentForm: React.FC = () => {
  const { createAssignment } = useAssignments();
  const [formData, setFormData] = useState({
    templateId: '',
    templateName: '',
    scope: { type: 'global' } as TemplateScope,
    priority: '1',
    isActive: true
  });

  const handleSubmit = async () => {
    await createAssignment({
      templateId: formData.templateId,
      templateName: formData.templateName,
      scope: formData.scope,
      priority: parseInt(formData.priority),
      isActive: formData.isActive
    });
    
    setFormData({
      templateId: '',
      templateName: '',
      scope: { type: 'global' },
      priority: '1',
      isActive: true
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <BlockStack gap="500">
        <Card>
          <FormSection
            title="Alapadatok"
            description="Add meg a template hozzárendelés adatait"
          >
            <FormLayout>
              <TextField
                label="Template ID"
                value={formData.templateId}
                onChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                requiredIndicator
              />
              
              <TextField
                label="Template Name"
                value={formData.templateName}
                onChange={(value) => setFormData(prev => ({ ...prev, templateName: value }))}
                requiredIndicator
              />
              
              <TextField
                label="Priority"
                type="number"
                value={formData.priority}
                onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              />
              
              <Checkbox
                label="Active"
                checked={formData.isActive}
                onChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </FormLayout>
          </FormSection>
        </Card>

        <Card>
          <FormSection
            title="Hatókör"
            description="Határozd meg, mely termékekre vonatkozik ez a hozzárendelés"
          >
            <ScopeSection
              scope={formData.scope}
              onChange={(scope) => setFormData(prev => ({ ...prev, scope }))}
            />
          </FormSection>
        </Card>

        <Card>
          <Button submit primary>Create Assignment</Button>
        </Card>
      </BlockStack>
    </Form>
  );
};
