/**
 * DeliveryTimeSelector Component
 * Átfutási idő választó - egyszerű radio kártyák névvel, leírással és árral
 */

'use client';

import React from 'react';
import type { FieldOption } from '@/types/pricing';
import styles from './DeliveryTimeSelector.module.css';

interface DeliveryTimeSelectorProps {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export const DeliveryTimeSelector: React.FC<DeliveryTimeSelectorProps> = ({
  options,
  value,
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

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.options}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const hasDescription = !!option.description;
          const hasPrice = option.price !== undefined;

          return (
            <label
              key={option.value}
              className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="radio"
                name="delivery-time"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className={styles.radio}
              />

              {/* Radio indicator */}
              <span className={styles.radioIndicator}>
                {isSelected && <span className={styles.radioInner} />}
              </span>

              {/* Content */}
              <div className={styles.content}>
                <span className={styles.title}>{option.label}</span>
                {hasDescription && (
                  <span className={styles.description}>{option.description}</span>
                )}
              </div>

              {/* Price */}
              {hasPrice && (
                <div className={styles.price}>
                  {option.price! > 0 ? (
                    <span className={styles.priceValue}>+{formatPrice(option.price!)}</span>
                  ) : option.price === 0 ? (
                    <span className={styles.priceIncluded}>Ingyenes</span>
                  ) : null}
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

export default DeliveryTimeSelector;
