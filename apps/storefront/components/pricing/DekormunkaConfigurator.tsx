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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type {
  ProductTemplateInfo,
  PriceCalculationResult,
  TemplateField,
  TemplateSection,
} from '@/types/pricing';
import { FileUpload } from './FileUpload';
import { SectionRenderer } from './SectionRenderer';
import { CollapsibleSection } from './CollapsibleSection';

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
  const [isExpress, setIsExpress] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  // Price calculation state
  const [priceResult, setPriceResult] = useState<PriceCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Mobile sticky visibility - hide when full summary is visible
  const [hideMobileSticky, setHideMobileSticky] = useState(false);
  const fullSummaryRef = useRef<HTMLDivElement>(null);
  const thankyouRef = useRef<HTMLDivElement>(null);

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
          // Get all fields from sections
          const allFields = (info.template.sections || []).flatMap((s) => s.fields || []);
          allFields.forEach((field) => {
            if (field.type === 'NUMBER') {
              initialValues[field.key] = field.validation?.min || 0;
            } else if (field.type === 'CHECKBOX') {
              initialValues[field.key] = false;
            } else if (field.type === 'EXTRAS') {
              // EXTRAS is multi-select, initialize as empty array
              initialValues[field.key] = [];
            } else if (
              field.type === 'SELECT' ||
              field.type === 'RADIO' ||
              field.type === 'PRODUCT_CARD' ||
              field.type === 'DELIVERY_TIME' ||
              field.type === 'GRAPHIC_SELECT'
            ) {
              // All option-based fields get first option as default
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

    // Don't calculate if required fields are not filled
    if (!isFormValid()) {
      setPriceResult(null);
      return;
    }

    const numericValues: Record<string, any> = {};
    // Get all fields from sections - send ALL fields, not just useInFormula
    // Backend needs all option-based fields to calculate their prices
    const allFields = (templateInfo.template.sections || []).flatMap((s) => s.fields || []);
    allFields.forEach((field) => {
      const value = fieldValues[field.key];
      if (field.type === 'NUMBER') {
        // Only include NUMBER fields if useInFormula is true
        if (field.useInFormula) {
          numericValues[field.key] = Number(value) || 0;
        }
      } else if (field.type === 'CHECKBOX') {
        if (field.useInFormula) {
          numericValues[field.key] = value ? 1 : 0;
        }
      } else if (field.type === 'EXTRAS') {
        // EXTRAS is multi-select - always send to calculate option prices
        numericValues[field.key] = Array.isArray(value) ? value : [];
      } else if (field.type === 'QUANTITY_SELECTOR') {
        // Quantity selector - send as number
        numericValues[field.key] = typeof value === 'number' ? value : Number(value) || 1;
      } else if (
        field.type === 'SELECT' ||
        field.type === 'RADIO' ||
        field.type === 'PRODUCT_CARD' ||
        field.type === 'DELIVERY_TIME' ||
        field.type === 'GRAPHIC_SELECT'
      ) {
        // All option-based fields - always send to calculate option prices
        numericValues[field.key] = value || '';
      }
    });

    try {
      setCalculating(true);
      const result = await api.pricing.calculatePrice({
        templateId: templateInfo.template.id,
        productId,
        fieldValues: numericValues,
        basePrice,
        isExpress,
      });
      setPriceResult(result);
    } catch (err: any) {
      console.error('Price calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  }, [templateInfo, fieldValues, basePrice, isExpress, productId]);

  // Debounced price calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (templateInfo?.hasTemplate) {
        calculatePrice();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [calculatePrice, templateInfo?.hasTemplate]);

  // Intersection Observer for mobile sticky behavior
  useEffect(() => {
    if (!fullSummaryRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Hide mobile sticky when full summary is visible
          setHideMobileSticky(entry.isIntersecting);
        });
      },
      {
        // Trigger when summary starts entering viewport
        threshold: 0.1,
        // Use viewport as root (important for iframe scrolling)
        root: null,
        rootMargin: '0px',
      }
    );

    observer.observe(fullSummaryRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Send sticky bar state to parent (Shopify page) so it can render a native sticky bar
  const isInIframe = typeof window !== 'undefined' && window.parent !== window;
  useEffect(() => {
    if (!isInIframe) return;

    const valid = isFormValid();
    const price = priceResult?.calculatedPrice ?? null;

    window.parent.postMessage({
      type: 'PRICEFLOW_STICKY_UPDATE',
      payload: {
        visible: Boolean(templateInfo?.hasTemplate) && !addedToCart,
        formValid: valid,
        calculating,
        price,
        grossPrice: price ? Math.round(price * 1.27) : null,
        canAddToCart: valid && !calculating && Boolean(priceResult),
      },
    }, '*');
  }, [priceResult, calculating, fieldValues, templateInfo, addedToCart]);

  // Listen for parent sticky bar "Add to cart" click
  useEffect(() => {
    if (!isInIframe) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PRICEFLOW_STICKY_CLICK') {
        handleAddToCart();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [priceResult, templateInfo, fieldValues, isExpress, notes, uploadedFile]);

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
    if (Array.isArray(value) && value.length === 0) return null;

    switch (field.type) {
      case 'NUMBER':
        const unit = field.unit || (field.key.includes('width') || field.key.includes('height') ? 'cm' : '');
        return `${value}${unit ? ` ${unit}` : ''}`;

      case 'SELECT':
      case 'RADIO':
      case 'PRODUCT_CARD':
      case 'DELIVERY_TIME':
      case 'GRAPHIC_SELECT': {
        const option = field.options?.find((o) => o.value === value);
        if (!option) return value;
        // Show label with price in parentheses if price > 0
        if (option.price && option.price > 0) {
          return `${option.label} (+${formatPrice(option.price)})`;
        }
        return option.label;
      }

      case 'EXTRAS': {
        // Multiple selection - show all selected option labels with prices
        if (!Array.isArray(value)) return null;
        const selectedLabels = value.map((v) => {
          const opt = field.options?.find((o) => o.value === v);
          if (!opt) return v;
          if (opt.price && opt.price > 0) {
            return `${opt.label} (+${formatPrice(opt.price)})`;
          }
          return opt.label;
        });
        return selectedLabels.join(', ');
      }

      case 'CHECKBOX':
        return value ? 'Igen' : 'Nem';

      default:
        return value.toString();
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!priceResult || !templateInfo?.template) return;

    const properties: Record<string, any> = {};
    // Get all fields from sections
    const allFields = (templateInfo.template.sections || []).flatMap((s) => s.fields || []);

    // Cart quantity = QUANTITY_SELECTOR mező értéke
    const quantityField = allFields.find((f) => f.type === 'QUANTITY_SELECTOR');
    const cartQuantity = quantityField ? (Number(fieldValues[quantityField.key]) || 1) : 1;
    allFields.forEach((field) => {
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

    if (notes && templateInfo.template.hasNotesField) {
      properties[templateInfo.template.notesFieldLabel || 'Megjegyzés'] = notes;
    }

    // Include uploaded graphic URL in properties
    if (uploadedFile) {
      const graphicUrl = (uploadedFile as any)._uploadedUrl;
      if (graphicUrl) {
        properties['_graphicUrl'] = graphicUrl;
        properties['Grafika fájl'] = uploadedFile.name;
      }
    }

    onAddToCart?.({
      variantId,
      productTitle,
      productImage,
      quantity: cartQuantity,
      finalPrice: priceResult.calculatedPrice / cartQuantity,
      finalLinePrice: priceResult.calculatedPrice,
      properties,
      isExpress,
      templateId: templateInfo.template.id,
    });

    setAddedToCart(true);
    setTimeout(() => {
      thankyouRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!templateInfo?.template) return false;
    // Get all fields from sections
    const allFields = (templateInfo.template.sections || []).flatMap((s) => s.fields || []);
    for (const field of allFields) {
      if (field.required) {
        const value = fieldValues[field.key];
        if (value === undefined || value === null) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        // For option-based fields, empty string is valid if it's an actual option value
        if (value === '' && field.options?.length) {
          const isValidOption = field.options.some((o) => o.value === '');
          if (!isValidOption) return false;
        } else if (value === '') {
          return false;
        }
      }
    }
    return true;
  };

  // Calculate m² from width and height
  const calculateSquareMeters = (): number | null => {
    // Get all fields from sections
    const allFields = (templateInfo?.template?.sections || []).flatMap((s) => s.fields || []);
    const widthField = allFields.find(f =>
      f.key.toLowerCase().includes('width') || f.key === 'szelesseg' || f.key === 'vizszintes'
    );
    const heightField = allFields.find(f =>
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

  // No template found — notify parent to collapse the widget
  if (!templateInfo?.hasTemplate || !templateInfo.template) {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'PRICEFLOW_EMPTY' }, '*');
    }
    return null;
  }

  // Thank you screen after adding to cart
  if (addedToCart) {
    return (
      <div className={`dekormunka-configurator ${className}`}>
        <div className="dekormunka-thankyou" ref={thankyouRef}>
          <svg className="dekormunka-thankyou-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="dekormunka-thankyou-title">Köszönjük a vásárlásod!</h2>
          <p className="dekormunka-thankyou-text">A termék sikeresen a kosárba került.</p>
          <button
            type="button"
            className="dekormunka-thankyou-button"
            onClick={() => setAddedToCart(false)}
          >
            Új konfiguráció
          </button>
        </div>
      </div>
    );
  }

  const template = templateInfo.template;
  let sectionNumber = 0;

  return (
    <div className={`dekormunka-configurator ${className}`}>
      {/* Mobile sticky bar is rendered by the parent Shopify page (outside iframe) via PRICEFLOW_STICKY_UPDATE */}

      <div className="dekormunka-layout">
        {/* Left side - Form sections */}
        <div className="dekormunka-form">
          {/* Section-based rendering */}
          {(template.sections || []).sort((a, b) => a.order - b.order).map((section) => {
            sectionNumber++;

            // Built-in section content
            const getBuiltInContent = () => {
              switch (section.builtInType) {
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
                onFileSelect={setUploadedFile}
              />
            );
          })}

          {/* Auto-generated Notes section when hasNotesField is true */}
          {template.hasNotesField && !template.sections?.some(s => s.builtInType === 'NOTES') && (
            <CollapsibleSection
              number={sectionNumber + 1}
              title={template.notesFieldLabel || 'Adj meg megjegyzést!'}
              defaultOpen={true}
              collapsible={true}
              showNumber={true}
            >
              <div className="dekormunka-notes-section">
                <label className="dekormunka-label">Megjegyzésed/kérés</label>
                <textarea
                  className="dekormunka-notes-textarea"
                  placeholder={template.notesFieldPlaceholder || 'Írja ide megjegyzését, kérését...'}
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
          {/* Full summary (desktop + mobile scroll position) */}
          <div ref={fullSummaryRef} className="dekormunka-summary">
            <h3 className="dekormunka-summary-title">Összegzés</h3>

            <div className="dekormunka-summary-list">
              {/* Size display */}
              {(() => {
                const allFields = (template.sections || []).flatMap((s) => s.fields || []);
                const widthField = allFields.find(f =>
                  f.key.toLowerCase().includes('width') || f.key === 'szelesseg' || f.key === 'vizszintes'
                );
                const heightField = allFields.find(f =>
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
              {(template.sections || []).flatMap((s) => s.fields || [])
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

            {/* Total price */}
            <div className="dekormunka-summary-total">
              {!isFormValid() ? (
                <div className="dekormunka-calculating">
                  <span>Töltsd ki a kötelező mezőket az árkalkulációhoz</span>
                </div>
              ) : calculating ? (
                <div className="dekormunka-calculating">
                  <div className="dekormunka-spinner-small" />
                  <span>Számítás...</span>
                </div>
              ) : (
                <span className="dekormunka-final-price">
                  {priceResult ? formatPrice(priceResult.calculatedPrice) : '-'}
                </span>
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
