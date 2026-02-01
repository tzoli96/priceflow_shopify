/**
 * GraphicSelector Component
 * Dekormunka design - 1:1 match
 *
 * Features:
 * - Info text at top
 * - Chip-style options in a row
 * - File upload area when "upload" option is selected
 */

'use client';

import React, { useRef, useState } from 'react';
import { getShopDomain } from '@/lib/shopify/shop';
import type { FieldOption } from '@/types/pricing';
import styles from './GraphicSelector.module.css';

interface GraphicSelectorProps {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  onFileSelect?: (file: File | null) => void;
  label?: string;
  helpText?: string;
  required?: boolean;
  error?: string;
}

export const GraphicSelector: React.FC<GraphicSelectorProps> = ({
  options,
  value,
  onChange,
  onFileSelect,
  label,
  helpText,
  required = false,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedOption = options.find((o) => o.value === value);
  const showUpload = selectedOption?.enableUpload === true;

  // Upload file to S3 via backend API
  const uploadToS3 = async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const shop = getShopDomain();

      const res = await fetch(`${apiUrl}/api/upload/graphic`, {
        method: 'POST',
        headers: { 'X-Shopify-Shop': shop || '' },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Feltöltés sikertelen');
      }

      const result = await res.json();
      console.log('[PriceFlow] Graphic uploaded:', result.data?.url);
      return result.data?.url || null;
    } catch (e: any) {
      console.error('[PriceFlow] Graphic upload failed:', e);
      setUploadError(e.message || 'Feltöltés sikertelen');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const url = await uploadToS3(file);
      // Pass file with _uploadedUrl attached for DekormunkaConfigurator
      if (url) {
        (file as any)._uploadedUrl = url;
      }
    }
    onFileSelect?.(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    onFileSelect?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.container}>
      {/* Info text */}
      {helpText && (
        <div className={styles.infoBox}>
          <svg className={styles.infoIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className={styles.infoText}>{helpText}</span>
        </div>
      )}

      {/* Options as chips */}
      <div className={styles.options}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
            >
              {/* Radio indicator for selected */}
              <span className={`${styles.radioIndicator} ${isSelected ? styles.radioSelected : ''}`}>
                {isSelected && <span className={styles.radioDot} />}
              </span>
              <span className={styles.chipLabel}>{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* File upload area - shown when upload option is selected */}
      {showUpload && (
        <div className={styles.uploadSection}>
          <p className={styles.uploadTitle}>Töltsd fel a grafikádat!</p>

          {!selectedFile ? (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.ai,.eps,.svg"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <div className={styles.dropzoneText}>
                <span className={styles.dropzoneMain}>Kattints ide a grafika feltöltéséhez</span>
                <span className={styles.dropzoneSub}>JPG, PNG, PDF, AI, EPS formátum</span>
                <span className={styles.dropzoneSub}>(max 50 MB)</span>
              </div>
            </div>
          ) : (
            <div className={styles.filePreview}>
              <div className={styles.fileInfo}>
                <svg className={styles.fileIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{selectedFile.name}</span>
                  <span className={styles.fileSize}>
                    {uploading ? 'Feltöltés...' : formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className={styles.removeButton}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {uploadError && <p className={styles.error}>{uploadError}</p>}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default GraphicSelector;
