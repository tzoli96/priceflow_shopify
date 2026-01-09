/**
 * Templates List Page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Layout, Banner, Toast, Frame } from '@shopify/polaris';
import { PlusIcon } from '@shopify/polaris-icons';
import { TemplateList } from '@/components/templates/TemplateList';
import { LoadingState, ErrorState, EmptyStateCard } from '@/components/ui/UIComponents';
import { api } from '@/lib/api';
import type { Template } from '@/types/template';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Load templates directly (shop domain from localStorage/env)
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.templates.list({ page: 1, limit: 100 });
      setTemplates(response.data);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError(err.message || 'Nem sikerült betölteni a sablonokat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    router.push(`/templates/${template.id}`);
  };

  const handleDelete = async (templateId: string) => {
    try {
      setIsDeleting(true);
      await api.templates.delete(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setToastMessage('Sablon sikeresen törölve');
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      setToastMessage('Hiba történt a törlés során');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewTemplate = () => {
    router.push('/templates/new');
  };

  // Loading state
  if (isLoading) {
    return (
      <Page title="Sablonok">
        <LoadingState message="Sablonok betöltése..." />
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page title="Sablonok">
        <ErrorState message={error} onRetry={loadTemplates} />
      </Page>
    );
  }

  // Empty state
  if (templates.length === 0) {
    return (
      <Frame>
        <Page title="Sablonok">
          <Layout>
            <Layout.Section>
              <EmptyStateCard
                title="Még nincs sablon létrehozva"
                message="Hozd létre az első sablont az árkalkulációs funkció használatához."
                action={{
                  content: 'Új sablon létrehozása',
                  onAction: handleNewTemplate,
                }}
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

  // List view
  return (
    <Frame>
      <Page
        title="Sablonok"
        primaryAction={{
          content: 'Új sablon',
          icon: PlusIcon,
          onAction: handleNewTemplate,
        }}
      >
        <Layout>
          <Layout.Section>
            <Banner tone="info">
              <p>
                A sablonok határozzák meg az árkalkuláció mezőit és képletét. Minden sablon
                tartalmazza a szükséges mezőket és a végső ár kiszámításához használt
                matematikai képletet.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <TemplateList
              templates={templates}
              isLoading={isDeleting}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
