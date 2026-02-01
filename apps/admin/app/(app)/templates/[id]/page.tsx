/**
 * Edit Template Page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Page, Layout, Toast, Frame } from '@shopify/polaris';
import { TemplateForm } from '@/components/templates/TemplateForm';
import { LoadingState, ErrorState } from '@/components/ui/UIComponents';
import { api } from '@/lib/api';
import type { Template, UpdateTemplateDto } from '@/types/template';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.templates.get(templateId);
      setTemplate(data);
    } catch (err: any) {
      console.error('Failed to load template:', err);
      setError(err.message || 'Nem sikerült betölteni a sablont');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateTemplateDto) => {
    try {
      setIsSubmitting(true);
      const updatedTemplate = await api.templates.update(templateId, data);
      setTemplate(updatedTemplate);
      setToastMessage('Sablon sikeresen frissítve!');

      // Redirect to the template list after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update template:', err);
      setToastMessage(err.message || 'Hiba történt a sablon frissítése során');
      throw err; // Re-throw so the form can handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <Page title="Sablon szerkesztése" backAction={{ content: 'Sablonok', url: '/' }}>
        <LoadingState message="Sablon betöltése..." />
      </Page>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <Page title="Sablon szerkesztése" backAction={{ content: 'Sablonok', url: '/' }}>
        <ErrorState message={error || 'Sablon nem található'} onRetry={loadTemplate} />
      </Page>
    );
  }

  return (
    <Frame>
      <Page
        title={`Sablon szerkesztése: ${template.name}`}
        backAction={{ content: 'Sablonok', url: '/' }}
        narrowWidth
      >
        <Layout>
          <Layout.Section>
            <TemplateForm
              template={template}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </Layout.Section>
        </Layout>
      </Page>

      {toastMessage && (
        <Toast
          content={toastMessage}
          onDismiss={() => setToastMessage(null)}
          duration={3000}
        />
      )}
    </Frame>
  );
}
