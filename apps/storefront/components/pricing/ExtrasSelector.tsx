/**
 * ExtrasSelector Component
 * Dekormunka design - 1:1 match
 *
 * Features:
 * - Horizontal card layout
 * - Checkbox on left
 * - Title + badge + description in middle
 * - Price on right
 * - Multiple selection support
 */

'use client';

import React from 'react';
import type { FieldOption } from '@/types/pricing';
import styles from './ExtrasSelector.module.css';

interface ExtrasSelectorProps {
  options: FieldOption[];
  value: string[]; // Array of selected values
  onChange: (value: string[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  columns?: 2 | 3 | 4; // Not used in new design, kept for compatibility
}

export const ExtrasSelector: React.FC<ExtrasSelectorProps> = ({
  options,
  value = [],
  onChange,
  label,
  required = false,
  error,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' Ft';
  };

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.list}>
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          const hasImage = !!option.imageUrl;
          const hasDescription = !!option.description;
          const hasPrice = option.price !== undefined;
          const hasBadge = !!option.badge;

          return (
            <label
              key={option.value}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                className={styles.checkbox}
              />

              {/* Checkbox indicator */}
              <span className={`${styles.checkboxIndicator} ${isSelected ? styles.checked : ''}`}>
                {isSelected && (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>

              {/* Image */}
              {hasImage && (
                <div className={styles.imageWrapper}>
                  <img src={option.imageUrl} alt={option.label} loading="lazy" />
                </div>
              )}

              {/* Content - title, badge, description */}
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.title}>{option.label}</span>
                  {hasBadge && (
                    <span className={styles.badge}>{option.badge}</span>
                  )}
                </div>
                {hasDescription && (
                  <span className={styles.description}>{option.description}</span>
                )}
              </div>

              {/* Price */}
              {hasPrice && (
                <div className={styles.price}>
                  {option.price! > 0 ? (
                    <span className={styles.priceValue}>{formatPrice(option.price!)}-tól</span>
                  ) : (
                    <span className={styles.priceFree}>Ingyenes</span>
                  )}
                </div>
              )}
            </label>
          );
        })}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default ExtrasSelector;
