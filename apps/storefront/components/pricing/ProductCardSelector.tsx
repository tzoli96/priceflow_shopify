/**
 * ProductCardSelector Component
 * Dekormunka design - 1:1 match
 *
 * Features:
 * - Radio button style selection indicator
 * - Main image with pattern overlay
 * - Badge support
 * - Bullet point features
 * - Price display
 */

'use client';

import React from 'react';
import type { FieldOption } from '@/types/pricing';
import styles from './ProductCardSelector.module.css';

interface ProductCardSelectorProps {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  columns?: 2 | 3 | 4;
}

export const ProductCardSelector: React.FC<ProductCardSelectorProps> = ({
  options,
  value,
  onChange,
  label,
  required = false,
  error,
  columns = 4,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' Ft';
  };

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.grid} style={{ '--columns': columns } as React.CSSProperties}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const hasMainImage = !!option.imageUrl;
          const hasPatternImage = !!option.patternUrl;
          const hasBadge = !!option.badge;
          const hasHtmlContent = !!option.htmlContent;
          const hasDescription = !!option.description;
          const hasFeatures = option.features && option.features.length > 0;
          const hasPrice = option.price !== undefined;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            >
              {/* Badge */}
              {hasBadge && (
                <div className={styles.badge}>
                  {option.badge}
                </div>
              )}

              {/* Radio Button Selection Indicator */}
              <div className={`${styles.radioIndicator} ${isSelected ? styles.selected : ''}`}>
                <div className={styles.radioIndicatorDot} />
              </div>

              {/* Image Container with Pattern Overlay */}
              {hasMainImage && (
                <div className={styles.imageContainer}>
                  <div className={styles.mainImage}>
                    <img src={option.imageUrl} alt={option.label} loading="lazy" />
                  </div>
                  {hasPatternImage && (
                    <div className={styles.patternImage}>
                      <img src={option.patternUrl} alt={`${option.label} minta`} loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={styles.content}>
                <h4 className={styles.title}>{option.label}</h4>

                {/* HTML content */}
                {hasHtmlContent && (
                  <div
                    className={styles.htmlContent}
                    dangerouslySetInnerHTML={{ __html: option.htmlContent! }}
                  />
                )}

                {/* Plain description (fallback) */}
                {!hasHtmlContent && hasDescription && (
                  <p className={styles.description}>{option.description}</p>
                )}

                {/* Features list */}
                {hasFeatures && (
                  <ul className={styles.features}>
                    {option.features!.slice(0, 6).map((feature, idx) => (
                      <li key={idx}>
                        <span className={styles.bullet}>•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price footer */}
              {hasPrice && (
                <div className={styles.priceFooter}>
                  {option.price! > 0 ? (
                    <span className={styles.price}>{formatPrice(option.price!)}-tól</span>
                  ) : (
                    <span className={styles.included}>Alap árban</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default ProductCardSelector;
