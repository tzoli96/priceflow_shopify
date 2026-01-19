/**
 * DekormunkaConfigurator Component
 *
 * Dekormunka-style product configurator with:
 * - Numbered collapsible sections
 * - Card-based material/option selection
 * - Size presets
 * - Sticky summary sidebar
 * - Express/normal delivery
 * - File upload
 * - Notes field
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  ProductTemplateInfo,
  PriceCalculationResult,
  TemplateField,
} from '@/types/pricing';
import { CollapsibleSection } from './CollapsibleSection';
import { CardSelector } from './CardSelector';
import { PresetChips } from './PresetChips';
import { FileUpload } from './FileUpload';

interface DekormunkaConfiguratorProps {
  productId: string;
  variantId: string;
  productTitle: string;
  productImage: string;
  basePrice: number;
  vendor?: string;
  tags?: string[];
  collections?: string[];
  onAddToCart?: (data: AddToCartData) => void;
  className?: string;
}

export interface AddToCartData {
  variantId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  finalPrice: number;
  finalLinePrice: number;
  properties: Record<string, any>;
  isExpress: boolean;
  templateId: string;
}

export function DekormunkaConfigurator({
  productId,
  variantId,
  productTitle,
  productImage,
  basePrice,
  vendor,
  tags,
  collections,
  onAddToCart,
  className = '',
}: DekormunkaConfiguratorProps) {
  // Template state
  const [templateInfo, setTemplateInfo] = useState<ProductTemplateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [isExpress, setIsExpress] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Price calculation state
  const [priceResult, setPriceResult] = useState<PriceCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Quantity validation
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // Load template on mount
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        const info = await api.pricing.getTemplateForProduct(productId, {
          productId,
          vendor,
          tags,
          collections,
        });

        setTemplateInfo(info);

        // Initialize field values with defaults
        if (info.hasTemplate && info.template) {
          const initialValues: Record<string, any> = {};
          info.template.fields.forEach((field) => {
            if (field.type === 'NUMBER') {
              initialValues[field.key] = field.validation?.min || 0;
            } else if (field.type === 'CHECKBOX') {
              initialValues[field.key] = false;
            } else if (field.type === 'SELECT' || field.type === 'RADIO') {
              initialValues[field.key] = field.options?.[0]?.value || '';
            } else {
              initialValues[field.key] = '';
            }
          });
          setFieldValues(initialValues);
        }
      } catch (err: any) {
        console.error('Failed to load template:', err);
        setError('Hiba történt a konfigurátor betöltése során.');
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [productId, vendor, tags, collections]);

  // Calculate price when values change
  const calculatePrice = useCallback(async () => {
    if (!templateInfo?.hasTemplate || !templateInfo.template) return;

    const numericValues: Record<string, number> = {};
    templateInfo.template.fields.forEach((field) => {
      if (field.useInFormula) {
        const value = fieldValues[field.key];
        if (field.type === 'NUMBER') {
          numericValues[field.key] = Number(value) || 0;
        } else if (field.type === 'CHECKBOX') {
          numericValues[field.key] = value ? 1 : 0;
        } else if (field.type === 'SELECT' || field.type === 'RADIO') {
          const option = field.options?.find((o) => o.value === value);
          numericValues[field.key] = option?.price || 0;
        }
      }
    });

    try {
      setCalculating(true);
      const result = await api.pricing.calculatePrice({
        templateId: templateInfo.template.id,
        productId,
        fieldValues: numericValues,
        quantity,
        basePrice,
        isExpress,
      });
      setPriceResult(result);
    } catch (err: any) {
      console.error('Price calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  }, [templateInfo, fieldValues, quantity, basePrice, isExpress, productId]);

  // Debounced price calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (templateInfo?.hasTemplate) {
        calculatePrice();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [calculatePrice, templateInfo?.hasTemplate]);

  // Validate quantity
  useEffect(() => {
    const limits = templateInfo?.template?.quantityLimits;
    if (!limits) {
      setQuantityError(null);
      return;
    }

    if (limits.minQuantity && quantity < limits.minQuantity) {
      setQuantityError(limits.minQuantityMessage || `Minimum: ${limits.minQuantity} db`);
    } else if (limits.maxQuantity && quantity > limits.maxQuantity) {
      setQuantityError(limits.maxQuantityMessage || `Maximum: ${limits.maxQuantity} db`);
    } else {
      setQuantityError(null);
    }
  }, [quantity, templateInfo?.template?.quantityLimits]);

  // Handle field change
  const handleFieldChange = (key: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get display value for a field
  const getFieldDisplayValue = (field: TemplateField): string | null => {
    const value = fieldValues[field.key];
    if (value === undefined || value === '' || value === null) return null;

    switch (field.type) {
      case 'NUMBER':
        return `${value} ${field.key.includes('width') || field.key.includes('height') ? 'cm' : ''}`;
      case 'SELECT':
      case 'RADIO':
        const option = field.options?.find((o) => o.value === value);
        return option?.label || value;
      case 'CHECKBOX':
        return value ? 'Igen' : 'Nem';
      default:
        return value.toString();
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!priceResult || !templateInfo?.template || quantityError) return;

    const properties: Record<string, any> = {};
    templateInfo.template.fields.forEach((field) => {
      const displayValue = getFieldDisplayValue(field);
      if (displayValue) {
        properties[field.label] = displayValue;
      }
    });

    if (isExpress && templateInfo.template.hasExpressOption) {
      properties['Gyártás'] = templateInfo.template.expressLabel || 'Expressz';
    } else if (templateInfo.template.hasExpressOption) {
      properties['Gyártás'] = templateInfo.template.normalLabel || 'Normál';
    }

    if (priceResult.discountPercent) {
      properties['Kedvezmény'] = `-${priceResult.discountPercent}%`;
    }

    if (notes && templateInfo.template.hasNotesField) {
      properties[templateInfo.template.notesFieldLabel || 'Megjegyzés'] = notes;
    }

    onAddToCart?.({
      variantId,
      productTitle,
      productImage,
      quantity,
      finalPrice: priceResult.calculatedPrice / quantity,
      finalLinePrice: priceResult.calculatedPrice,
      properties,
      isExpress,
      templateId: templateInfo.template.id,
    });
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!templateInfo?.template) return false;
    for (const field of templateInfo.template.fields) {
      if (field.required) {
        const value = fieldValues[field.key];
        if (value === undefined || value === '' || value === null) return false;
      }
    }
    return !quantityError;
  };

  // Group fields by type for sectioning
  const groupFields = () => {
    if (!templateInfo?.template?.fields) return { number: [], select: [], checkbox: [], other: [] };

    const sorted = [...templateInfo.template.fields].sort((a, b) => a.order - b.order);
    return {
      number: sorted.filter(f => f.type === 'NUMBER'),
      select: sorted.filter(f => f.type === 'SELECT' || f.type === 'RADIO'),
      checkbox: sorted.filter(f => f.type === 'CHECKBOX'),
      other: sorted.filter(f => !['NUMBER', 'SELECT', 'RADIO', 'CHECKBOX'].includes(f.type)),
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className={`dekormunka-configurator ${className}`}>
        <div className="dekormunka-loading">
          <div className="dekormunka-spinner" />
          <span>Konfigurátor betöltése...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`dekormunka-configurator ${className}`}>
        <div className="dekormunka-error">{error}</div>
      </div>
    );
  }

  // No template found
  if (!templateInfo?.hasTemplate || !templateInfo.template) {
    return null;
  }

  const template = templateInfo.template;
  const fieldGroups = groupFields();
  let sectionNumber = 0;

  return (
    <div className={`dekormunka-configurator ${className}`}>
      <div className="dekormunka-layout">
        {/* Left side - Form sections */}
        <div className="dekormunka-form">
          {/* Number fields (size inputs) */}
          {fieldGroups.number.length > 0 && (
            <CollapsibleSection
              number={++sectionNumber}
              title="Válassz méretet!"
              defaultOpen={true}
            >
              <div className="dekormunka-size-section">
                <div className="dekormunka-size-inputs">
                  {fieldGroups.number.map((field) => (
                    <div key={field.key} className="dekormunka-size-input-group">
                      <label className="dekormunka-label">{field.label}</label>
                      <div className="dekormunka-input-with-unit">
                        <input
                          type="number"
                          className="dekormunka-input"
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                          min={field.validation?.min}
                          max={field.validation?.max}
                          step={field.validation?.step || 1}
                          placeholder={field.placeholder}
                        />
                        <span className="dekormunka-unit">cm</span>
                      </div>
                      {/* Preset values as chips */}
                      {field.presetValues && field.presetValues.length > 0 && (
                        <div className="dekormunka-presets">
                          {field.presetValues.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleFieldChange(field.key, preset.value)}
                              className={`dekormunka-preset-chip ${fieldValues[field.key] === preset.value ? 'selected' : ''}`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* SELECT/RADIO fields - each gets its own section */}
          {fieldGroups.select.map((field) => (
            <CollapsibleSection
              key={field.key}
              number={++sectionNumber}
              title={`Válassz ${field.label.toLowerCase()}!`}
              defaultOpen={true}
            >
              {field.displayStyle === 'card' && field.options ? (
                <CardSelector
                  options={field.options}
                  value={fieldValues[field.key] || ''}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  label=""
                  columns={field.options.length <= 2 ? 2 : field.options.length <= 4 ? 4 : 4}
                />
              ) : field.displayStyle === 'chip' && field.options ? (
                <div className="dekormunka-chip-group">
                  {field.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFieldChange(field.key, option.value)}
                      className={`dekormunka-chip ${fieldValues[field.key] === option.value ? 'selected' : ''}`}
                    >
                      {option.label}
                      {option.price !== undefined && option.price > 0 && (
                        <span className="dekormunka-chip-price">+{formatPrice(option.price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                // Default: Radio style cards
                <div className="dekormunka-radio-cards">
                  {field.options?.map((option) => (
                    <label
                      key={option.value}
                      className={`dekormunka-radio-card ${fieldValues[field.key] === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={field.key}
                        value={option.value}
                        checked={fieldValues[field.key] === option.value}
                        onChange={() => handleFieldChange(field.key, option.value)}
                      />
                      <div className="dekormunka-radio-card-content">
                        <span className="dekormunka-radio-card-label">{option.label}</span>
                        {option.price !== undefined && option.price > 0 && (
                          <span className="dekormunka-radio-card-price">+{formatPrice(option.price)}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          ))}

          {/* Checkbox fields (extras) */}
          {fieldGroups.checkbox.length > 0 && (
            <CollapsibleSection
              number={++sectionNumber}
              title="Válassz extrát!"
              defaultOpen={true}
            >
              <div className="dekormunka-extras">
                {fieldGroups.checkbox.map((field) => (
                  <label key={field.key} className="dekormunka-checkbox-card">
                    <input
                      type="checkbox"
                      checked={!!fieldValues[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                    />
                    <div className="dekormunka-checkbox-content">
                      <span className="dekormunka-checkbox-label">{field.label}</span>
                      {field.helpText && (
                        <span className="dekormunka-checkbox-help">{field.helpText}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Quantity section */}
          <CollapsibleSection
            number={++sectionNumber}
            title="Válassz mennyiséget!"
            defaultOpen={true}
          >
            <div className="dekormunka-quantity-section">
              <div className="dekormunka-quantity-controls">
                <button
                  type="button"
                  className="dekormunka-qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  className="dekormunka-qty-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
                <button
                  type="button"
                  className="dekormunka-qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>

              {/* Quantity presets */}
              <div className="dekormunka-qty-presets">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={`dekormunka-qty-preset ${quantity === num ? 'selected' : ''}`}
                  >
                    {num} db
                  </button>
                ))}
              </div>

              {quantityError && (
                <div className="dekormunka-qty-error">{quantityError}</div>
              )}

              {/* Discount tiers info */}
              {template.discountTiers && template.discountTiers.length > 0 && (
                <div className="dekormunka-discount-info">
                  <span className="dekormunka-discount-title">Mennyiségi kedvezmények:</span>
                  <div className="dekormunka-discount-tiers">
                    {template.discountTiers.map((tier, idx) => (
                      <span
                        key={idx}
                        className={`dekormunka-discount-tier ${quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty) ? 'active' : ''}`}
                      >
                        {tier.minQty}+ db: -{tier.discount}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Express delivery section */}
          {template.hasExpressOption && (
            <CollapsibleSection
              number={++sectionNumber}
              title="Válassz átfutási időt!"
              defaultOpen={true}
            >
              <div className="dekormunka-express-section">
                <label className={`dekormunka-express-option ${!isExpress ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="express"
                    checked={!isExpress}
                    onChange={() => setIsExpress(false)}
                  />
                  <div className="dekormunka-express-content">
                    <span className="dekormunka-express-label">
                      {template.normalLabel || 'Normál'}
                    </span>
                    {priceResult?.normalPrice && (
                      <span className="dekormunka-express-price">
                        {formatPrice(priceResult.normalPrice)}
                      </span>
                    )}
                  </div>
                </label>

                <label className={`dekormunka-express-option express ${isExpress ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="express"
                    checked={isExpress}
                    onChange={() => setIsExpress(true)}
                  />
                  <div className="dekormunka-express-content">
                    <span className="dekormunka-express-label">
                      {template.expressLabel || 'Expressz'}
                      <span className="dekormunka-express-badge">GYORS</span>
                    </span>
                    {priceResult?.expressPrice && (
                      <span className="dekormunka-express-price">
                        {formatPrice(priceResult.expressPrice)}
                      </span>
                    )}
                  </div>
                </label>
              </div>
            </CollapsibleSection>
          )}

          {/* File upload section */}
          {fieldGroups.other.some(f => f.type === 'FILE') && (
            <CollapsibleSection
              number={++sectionNumber}
              title="Válassz grafikát!"
              defaultOpen={true}
            >
              <div className="dekormunka-graphics-section">
                <div className="dekormunka-graphics-options">
                  <label className="dekormunka-graphics-option">
                    <input type="radio" name="graphics" defaultChecked />
                    <span>Feltöltöm most</span>
                  </label>
                  <label className="dekormunka-graphics-option">
                    <input type="radio" name="graphics" />
                    <span>grafikai tervezést kérek</span>
                  </label>
                  <label className="dekormunka-graphics-option">
                    <input type="radio" name="graphics" />
                    <span>Később töltöm fel</span>
                  </label>
                </div>

                <FileUpload
                  onChange={setUploadedFile}
                  value={uploadedFile}
                  helpText="Támogatott formátumok: JPG, PNG, PDF, AI, EPS, CDR (max 100 MB)"
                />
              </div>
            </CollapsibleSection>
          )}

          {/* Notes section */}
          {template.hasNotesField && (
            <CollapsibleSection
              number={++sectionNumber}
              title={template.notesFieldLabel || "Adj meg megjegyzést!"}
              defaultOpen={true}
            >
              <div className="dekormunka-notes-section">
                <textarea
                  className="dekormunka-notes-textarea"
                  placeholder={template.notesFieldPlaceholder || 'Írja ide megjegyzését...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Right side - Summary sidebar */}
        <div className="dekormunka-sidebar">
          <div className="dekormunka-summary">
            <h3 className="dekormunka-summary-title">Összegzés</h3>

            <div className="dekormunka-summary-list">
              {template.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => {
                  const displayValue = getFieldDisplayValue(field);
                  if (!displayValue) return null;
                  return (
                    <div key={field.key} className="dekormunka-summary-item">
                      <span className="dekormunka-summary-label">{field.label}:</span>
                      <span className="dekormunka-summary-value">{displayValue}</span>
                    </div>
                  );
                })}

              <div className="dekormunka-summary-item">
                <span className="dekormunka-summary-label">Mennyiség:</span>
                <span className="dekormunka-summary-value">{quantity} db</span>
              </div>

              {template.hasExpressOption && (
                <div className="dekormunka-summary-item">
                  <span className="dekormunka-summary-label">Átfutási idő:</span>
                  <span className="dekormunka-summary-value">
                    {isExpress ? (template.expressLabel || 'Expressz') : (template.normalLabel || 'Normál')}
                  </span>
                </div>
              )}

              {notes && (
                <div className="dekormunka-summary-item">
                  <span className="dekormunka-summary-label">Megjegyzés:</span>
                  <span className="dekormunka-summary-value dekormunka-summary-notes">{notes}</span>
                </div>
              )}
            </div>

            {/* Discount badge */}
            {priceResult?.discountPercent && priceResult.discountPercent > 0 && (
              <div className="dekormunka-summary-discount">
                <span className="dekormunka-discount-badge">
                  -{priceResult.discountPercent}% kedvezmény
                </span>
              </div>
            )}

            {/* Total price */}
            <div className="dekormunka-summary-total">
              {calculating ? (
                <div className="dekormunka-calculating">
                  <div className="dekormunka-spinner-small" />
                  <span>Számítás...</span>
                </div>
              ) : (
                <>
                  {priceResult?.priceBeforeDiscount && priceResult.priceBeforeDiscount !== priceResult.calculatedPrice && (
                    <span className="dekormunka-original-price">
                      {formatPrice(priceResult.priceBeforeDiscount)}
                    </span>
                  )}
                  <span className="dekormunka-final-price">
                    {priceResult ? formatPrice(priceResult.calculatedPrice) : '-'}
                  </span>
                </>
              )}
            </div>

            {/* Add to cart button */}
            <button
              type="button"
              className="dekormunka-add-to-cart"
              onClick={handleAddToCart}
              disabled={!isFormValid() || calculating || !priceResult}
            >
              <svg className="dekormunka-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Kosárba teszem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DekormunkaConfigurator;
