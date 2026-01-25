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
  TemplateSection,
} from '@/types/pricing';
import { FileUpload } from './FileUpload';
import { SectionRenderer } from './SectionRenderer';

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

  // Calculate m² from width and height
  const calculateSquareMeters = (): number | null => {
    const widthField = templateInfo?.template?.fields.find(f =>
      f.key.toLowerCase().includes('width') || f.key === 'szelesseg' || f.key === 'vizszintes'
    );
    const heightField = templateInfo?.template?.fields.find(f =>
      f.key.toLowerCase().includes('height') || f.key === 'magassag' || f.key === 'fuggoleges'
    );

    if (!widthField || !heightField) return null;

    const width = Number(fieldValues[widthField.key]) || 0;
    const height = Number(fieldValues[heightField.key]) || 0;

    if (width > 0 && height > 0) {
      // Convert cm to m² (cm * cm / 10000)
      return (width * height) / 10000;
    }
    return null;
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
  let sectionNumber = 0;

  return (
    <div className={`dekormunka-configurator ${className}`}>
      <div className="dekormunka-layout">
        {/* Left side - Form sections */}
        <div className="dekormunka-form">
          {/* Section-based rendering */}
          {(template.sections || []).sort((a, b) => a.order - b.order).map((section) => {
            sectionNumber++;

            // Built-in section content
            const getBuiltInContent = () => {
              switch (section.builtInType) {
                case 'QUANTITY':
                  return (
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
                      <div className="dekormunka-qty-presets">
                        {(template.quantityPresets || [1, 3, 10]).map((preset, idx) => {
                          const presetValue = typeof preset === 'number' ? preset : preset.value;
                          const presetLabel = typeof preset === 'number' ? `${preset} db` : preset.label;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setQuantity(presetValue)}
                              className={`dekormunka-qty-preset ${quantity === presetValue ? 'selected' : ''}`}
                            >
                              {presetLabel}
                            </button>
                          );
                        })}
                      </div>
                      {quantityError && <div className="dekormunka-qty-error">{quantityError}</div>}
                    </div>
                  );

                case 'EXPRESS':
                  return (
                    <div className="dekormunka-express-section">
                      <label className={`dekormunka-express-option ${!isExpress ? 'selected' : ''}`}>
                        <input type="radio" name="express" checked={!isExpress} onChange={() => setIsExpress(false)} />
                        <div className="dekormunka-express-content">
                          <span className="dekormunka-express-label">{template.normalLabel || 'Normál'}</span>
                        </div>
                      </label>
                      <label className={`dekormunka-express-option ${isExpress ? 'selected' : ''}`}>
                        <input type="radio" name="express" checked={isExpress} onChange={() => setIsExpress(true)} />
                        <div className="dekormunka-express-content">
                          <span className="dekormunka-express-label">
                            {template.expressLabel || 'Expressz'}
                            <span className="dekormunka-express-badge">GYORS</span>
                          </span>
                        </div>
                      </label>
                    </div>
                  );

                case 'NOTES':
                  return (
                    <div className="dekormunka-notes-section">
                      <textarea
                        className="dekormunka-notes-textarea"
                        placeholder={template.notesFieldPlaceholder || 'Írja ide megjegyzését...'}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  );

                case 'FILE_UPLOAD':
                  return (
                    <div className="dekormunka-graphics-section">
                      <FileUpload
                        onChange={setUploadedFile}
                        value={uploadedFile}
                        helpText="Támogatott formátumok: JPG, PNG, PDF, AI, EPS, CDR (max 100 MB)"
                      />
                    </div>
                  );

                default:
                  return null;
              }
            };

            return (
              <SectionRenderer
                key={section.key}
                section={section}
                sectionNumber={sectionNumber}
                fieldValues={fieldValues}
                onFieldChange={handleFieldChange}
                formatPrice={formatPrice}
                builtInContent={section.builtInType ? getBuiltInContent() : undefined}
              />
            );
          })}
        </div>

        {/* Right side - Summary sidebar */}
        <div className="dekormunka-sidebar">
          <div className="dekormunka-summary">
            <h3 className="dekormunka-summary-title">Összegzés</h3>

            <div className="dekormunka-summary-list">
              {/* Size display */}
              {(() => {
                const widthField = template.fields.find(f =>
                  f.key.toLowerCase().includes('width') || f.key === 'szelesseg' || f.key === 'vizszintes'
                );
                const heightField = template.fields.find(f =>
                  f.key.toLowerCase().includes('height') || f.key === 'magassag' || f.key === 'fuggoleges'
                );

                if (widthField && heightField) {
                  const width = fieldValues[widthField.key];
                  const height = fieldValues[heightField.key];
                  if (width && height) {
                    return (
                      <div className="dekormunka-summary-item">
                        <span className="dekormunka-summary-label">Méret:</span>
                        <span className="dekormunka-summary-value">{width} x {height} cm</span>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Other fields (excluding size fields already shown) */}
              {template.fields
                .filter(f => f.type !== 'NUMBER')
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

              {/* m² calculation */}
              {(() => {
                const sqm = calculateSquareMeters();
                if (sqm !== null && sqm > 0) {
                  return (
                    <div className="dekormunka-summary-item">
                      <span className="dekormunka-summary-label">m²:</span>
                      <span className="dekormunka-summary-value">{sqm.toFixed(2)} m²</span>
                    </div>
                  );
                }
                return null;
              })()}

              {template.hasExpressOption && (
                <div className="dekormunka-summary-item">
                  <span className="dekormunka-summary-label">Átfutási idő:</span>
                  <span className="dekormunka-summary-value">
                    {isExpress ? (template.expressLabel || 'Expressz') : (template.normalLabel || 'Normál')}
                  </span>
                </div>
              )}

              {uploadedFile && (
                <div className="dekormunka-summary-item">
                  <span className="dekormunka-summary-label">Grafika:</span>
                  <span className="dekormunka-summary-value">{uploadedFile.name}</span>
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
