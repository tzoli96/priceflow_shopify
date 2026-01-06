/**
 * Reusable UI Components
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  EmptyState,
  Spinner,
  Banner,
  Text,
  BlockStack,
  Modal,
  Button,
  Badge,
  Box,
  Divider,
  Icon,
} from '@shopify/polaris';
import { ClipboardIcon } from '@shopify/polaris-icons';

// ============================================================================
// LoadingState - Full page loading indicator
// ============================================================================

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Betöltés...' }: LoadingStateProps) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <BlockStack gap="400" align="center">
        <Spinner size="large" />
        <Text as="p" variant="bodyMd" tone="subdued">
          {message}
        </Text>
      </BlockStack>
    </div>
  );
}

// ============================================================================
// ErrorState - Error display component
// ============================================================================

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Hiba történt',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card>
      <Banner
        title={title}
        tone="critical"
        action={onRetry ? { content: 'Újrapróbálás', onAction: onRetry } : undefined}
      >
        <Text as="p">{message}</Text>
      </Banner>
    </Card>
  );
}

// ============================================================================
// EmptyStateCard - Empty state with illustration
// ============================================================================

interface EmptyStateCardProps {
  title: string;
  message: string;
  action?: {
    content: string;
    onAction: () => void;
  };
  image?: string;
}

export function EmptyStateCard({
  title,
  message,
  action,
  image,
}: EmptyStateCardProps) {
  return (
    <Card>
      <EmptyState
        heading={title}
        image={image || 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
        action={action}
      >
        <Text as="p" tone="subdued">
          {message}
        </Text>
      </EmptyState>
    </Card>
  );
}

// ============================================================================
// ConfirmationModal - Confirmation dialog
// ============================================================================

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Megerősítés',
  cancelLabel = 'Mégsem',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      title={title}
      primaryAction={{
        content: confirmLabel,
        onAction: onConfirm,
        loading: isLoading,
        destructive: isDangerous,
      }}
      secondaryActions={[
        {
          content: cancelLabel,
          onAction: onCancel,
          disabled: isLoading,
        },
      ]}
    >
      <Modal.Section>
        <Text as="p">{message}</Text>
      </Modal.Section>
    </Modal>
  );
}

// ============================================================================
// StatusBadge - Custom status badge
// ============================================================================

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'draft' | 'archived';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    active: { tone: 'success' as const, label: 'Aktív' },
    inactive: { tone: 'attention' as const, label: 'Inaktív' },
    draft: { tone: 'info' as const, label: 'Vázlat' },
    archived: { tone: 'subdued' as const, label: 'Archivált' },
  };

  const config = statusConfig[status];

  return <Badge tone={config.tone}>{config.label}</Badge>;
}

// ============================================================================
// CopyButton - Copy to clipboard button
// ============================================================================

interface CopyButtonProps {
  text: string;
  successMessage?: string;
}

export function CopyButton({ text, successMessage = 'Másolva!' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text]);

  return (
    <Button
      onClick={handleCopy}
      icon={<Icon source={ClipboardIcon} />}
      size="slim"
      variant="plain"
    >
      {copied ? successMessage : 'Másolás'}
    </Button>
  );
}

// ============================================================================
// FormSection - Reusable form section wrapper
// ============================================================================

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Text as="h2" variant="headingMd">
          {title}
        </Text>
        {description && (
          <Text as="p" variant="bodyMd" tone="subdued">
            {description}
          </Text>
        )}
      </BlockStack>
      <Box paddingBlockStart="200">{children}</Box>
      <Divider />
    </BlockStack>
  );
}

// ============================================================================
// InfoBanner - Informational banner
// ============================================================================

interface InfoBannerProps {
  title?: string;
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'critical';
}

export function InfoBanner({
  title,
  message,
  tone = 'info',
}: InfoBannerProps) {
  return (
    <Banner title={title} tone={tone}>
      <Text as="p">{message}</Text>
    </Banner>
  );
}
