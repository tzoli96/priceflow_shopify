/**
 * TemplateManager - Main feature component for template management
 */

import React, { useState } from 'react';
import { Page, Layout, Toast, Frame } from '@shopify/polaris';
import type { Template } from '../types';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateList } from './TemplateList';
import { TemplateForm } from './TemplateForm';
import {
  LoadingState,
  ErrorState,
  EmptyStateCard,
} from '@/common/components/UIComponents';
import { deepClone } from '@/common/utils/helpers';

type ViewMode = 'list' | 'create' | 'edit';

export function TemplateManager() {
  const { templates, isLoading, error, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const [toast, setToast] = useState<{
    active: boolean;
    message: string;
    error?: boolean;
  }>({
    active: false,
    message: '',
  });

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setViewMode('create');
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(deepClone(template));
    setViewMode('edit');
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      showToast('Sablon sikeresen törölve');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Hiba történt a törlés során', true);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      // Create a copy with new name
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (másolat)`,
        id: undefined, // Remove ID so backend creates new one
      };
      
      await createTemplate(duplicatedTemplate);
      showToast('Sablon sikeresen duplikálva');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Hiba történt a duplikálás során', true);
    }
  };

  const handleSave = async (templateData: Partial<Template>) => {
    try {
      const isEdit = viewMode === 'edit' && selectedTemplate;
      
      const result = isEdit
        ? await updateTemplate(selectedTemplate.id, templateData)
        : await createTemplate(templateData);

      showToast(isEdit ? 'Sablon sikeresen frissítve' : 'Sablon sikeresen létrehozva');
      setViewMode('list');
      setSelectedTemplate(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Hiba történt a mentés során', true);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTemplate(null);
  };

  const showToast = (message: string, error = false) => {
    setToast({ active: true, message, error });
  };

  const dismissToast = () => {
    setToast(prev => ({ ...prev, active: false }));
  };

  const renderContent = () => {
    if (isLoading) return <LoadingState message="Sablonok betöltése..." />;
    if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

    if (viewMode === 'list') {
      if (templates.length === 0) {
        return (
          <EmptyStateCard
            title="Még nincsenek sablonok"
            description="Hozz létre az első sablont a termékek árkalkulációjához"
            action={{ content: 'Új sablon létrehozása', onAction: handleCreateNew }}
          />
        );
      }

      return (
        <TemplateList
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      );
    }

    return (
      <TemplateForm
        template={selectedTemplate}
        onSubmit={handleSave}
        onCancel={handleCancel}
      />
    );
  };

  return (
    <Frame>
      <Page
        title="Sablonkezelő"
        subtitle="Árkalkulációs sablonok létrehozása és kezelése"
        backAction={viewMode !== 'list' ? {
          content: 'Vissza a listához',
          onAction: handleCancel,
        } : undefined}
        primaryAction={viewMode === 'list' ? {
          content: 'Új sablon',
          onAction: handleCreateNew,
        } : undefined}
      >
        <Layout>
          <Layout.Section>
            {renderContent()}
          </Layout.Section>
        </Layout>
      </Page>

      {toast.active && (
        <Toast
          content={toast.message}
          error={toast.error}
          onDismiss={dismissToast}
        />
      )}
    </Frame>
  );
}
