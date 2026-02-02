/**
 * ImageUploader - Reusable image/icon upload component
 *
 * Features:
 * - Drag & drop support
 * - File type validation (PNG, JPG, SVG, WebP)
 * - Preview display
 * - Upload to S3 via API
 * - Delete functionality
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Button,
  Spinner,
  Banner,
} from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';

interface ImageUploaderProps {
  value?: string; // Current image URL
  onChange: (url: string) => void;
  onDelete?: () => void;
  label?: string;
  helpText?: string;
  endpoint?: 'image' | 'icon' | 'option-image';
  maxSizeMB?: number;
  accept?: string;
  previewSize?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onDelete,
  label = 'Kép feltöltése',
  helpText,
  endpoint = 'image',
  maxSizeMB = 5,
  accept = 'image/png,image/jpeg,image/svg+xml,image/webp,image/gif',
  previewSize = 64,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      return `Nem támogatott fájltípus: ${file.type}. Engedélyezett: PNG, JPG, SVG, WebP`;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `A fájl túl nagy (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload/${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Feltöltési hiba');
      }

      const result = await response.json();

      if (result.success && result.data?.url) {
        onChange(result.data.url);
      } else {
        throw new Error('Érvénytelen válasz a szervertől');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDelete = async () => {
    // If we have the URL, try to extract key and delete from S3
    if (value && onDelete) {
      try {
        const url = new URL(value);
        const key = url.pathname.split('/').slice(2).join('/');
        if (key) {
          await fetch(`${API_URL}/api/upload/file?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
          });
        }
      } catch {
        // Ignore delete errors
      }
    }

    onChange('');
    if (onDelete) {
      onDelete();
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <BlockStack gap="200">
      <Text variant="bodyMd" as="span" fontWeight="medium">
        {label}
      </Text>

      {error && (
        <Banner tone="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      {/* Preview section */}
      {value && (
        <InlineStack gap="300" blockAlign="center">
          <div
            style={{
              width: previewSize,
              height: previewSize,
              border: '1px solid #e1e3e5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f6f6f7',
            }}
          >
            <img
              src={value}
              alt="Feltöltött kép"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <BlockStack gap="100">
            <Text variant="bodySm" as="span" tone="subdued">
              Kép feltöltve
            </Text>
            <Button
              icon={DeleteIcon}
              tone="critical"
              size="slim"
              onClick={handleDelete}
            >
              Törlés
            </Button>
          </BlockStack>
        </InlineStack>
      )}

      {/* Upload zone */}
      {!value && (
        <div
          onClick={triggerFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragOver ? '#2c6ecb' : '#c4cdd5'}`,
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            backgroundColor: isDragOver ? '#f0f5ff' : '#fafbfc',
            transition: 'all 0.2s ease',
          }}
        >
          {isUploading ? (
            <BlockStack gap="200" inlineAlign="center">
              <Spinner size="small" />
              <Text variant="bodySm" as="span" tone="subdued">
                Feltöltés...
              </Text>
            </BlockStack>
          ) : (
            <BlockStack gap="200" inlineAlign="center">
              {/* Upload icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8c9196"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <Text variant="bodyMd" as="span">
                Húzd ide a fájlt, vagy{' '}
                <span style={{ color: '#2c6ecb', textDecoration: 'underline' }}>
                  tallózz
                </span>
              </Text>
              <Text variant="bodySm" as="span" tone="subdued">
                PNG, JPG, SVG, WebP (max {maxSizeMB}MB)
              </Text>
            </BlockStack>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {helpText && (
        <Text variant="bodySm" as="span" tone="subdued">
          {helpText}
        </Text>
      )}
    </BlockStack>
  );
};
