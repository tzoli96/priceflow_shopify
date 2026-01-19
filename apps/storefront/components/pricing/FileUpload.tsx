/**
 * FileUpload Component
 * Dekormunka-style file upload with drag & drop
 */

'use client';

import React, { useState, useRef } from 'react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  onChange: (file: File | null) => void;
  value?: File | null;
  helpText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Fájl feltöltése',
  accept = 'image/*,.pdf,.ai,.eps,.cdr',
  maxSize = 100,
  onChange,
  value,
  helpText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`A fájl mérete meghaladja a ${maxSize} MB-ot`);
      return;
    }

    setError(null);
    onChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload">
      {value ? (
        // File selected state
        <div className="file-upload-selected">
          <div className="file-upload-file-info">
            <svg className="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="file-upload-file-details">
              <span className="file-upload-filename">{value.name}</span>
              <span className="file-upload-filesize">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button type="button" className="file-upload-remove" onClick={handleRemove}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        // Upload area
        <div
          className={`file-upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="file-upload-input"
          />
          <svg className="file-upload-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="file-upload-text">
            <span className="file-upload-main-text">Kattints ide a grafika feltöltéséhez</span>
            <span className="file-upload-sub-text">
              JPG, PNG, PDF, AI, EPS, CDR
              <br />
              (max {maxSize} MB)
            </span>
          </div>
        </div>
      )}

      {error && <div className="file-upload-error">{error}</div>}
      {helpText && !error && <div className="file-upload-help">{helpText}</div>}
    </div>
  );
};

export default FileUpload;
