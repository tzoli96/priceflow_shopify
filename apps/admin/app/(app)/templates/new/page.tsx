/**
 * New Template Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Layout, Toast, Frame } from '@shopify/polaris';
import { TemplateForm } from '@/components/templates/TemplateForm';
import { api } from '@/lib/api';
import type { CreateTemplateDto, UpdateTemplateDto } from '@/types/template';

export default function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTemplateDto | UpdateTemplateDto) => {
    try {
      setIsSubmitting(true);
      const template = await api.templates.create(data as CreateTemplateDto);
      setToastMessage('Sablon sikeresen létrehozva!');

      // Redirect to the template list after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create template:', err);
      setToastMessage(err.message || 'Hiba történt a sablon létrehozása során');
      throw err; // Re-throw so the form can handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <Frame>
      <Page
        title="Új sablon létrehozása"
        backAction={{ content: 'Sablonok', url: '/' }}
        narrowWidth
      >
        <Layout>
          <Layout.Section>
            <TemplateForm
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
