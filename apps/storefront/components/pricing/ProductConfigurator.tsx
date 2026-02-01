/**
 * ProductConfigurator Component
 *
 * Main component for template-based product configuration and pricing.
 * Displays form fields, calculates price, shows express/discount options.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  ProductTemplateInfo,
  PriceCalculationResult,
  TemplateField,
  DiscountTier,
} from '@/types/pricing';
import { ConfiguratorField } from './ConfiguratorField';
import { PriceDisplay } from './PriceDisplay';
import { ExpressSelector } from './ExpressSelector';
import { DiscountTierDisplay } from './DiscountTierDisplay';
import { QuantityInput } from './QuantityInput';
import { ConfigSummary } from './ConfigSummary';

interface ProductConfiguratorProps {
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

export function ProductConfigurator({
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
}: ProductConfiguratorProps) {
  // Template state
  const [templateInfo, setTemplateInfo] = useState<ProductTemplateInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [isExpress, setIsExpress] = useState(false);
  const [notes, setNotes] = useState('');

  // Price calculation state
  const [priceResult, setPriceResult] = useState<PriceCalculationResult | null>(
    null
  );
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
          const allFields = (info.template.sections || []).flatMap((s) => s.fields || []);
          allFields.forEach((field) => {
            if (field.type === 'NUMBER') {
              initialValues[field.key] = field.validation?.min || 0;
            } else if (field.type === 'CHECKBOX') {
              initialValues[field.key] = false;
            } else if (
              field.type === 'SELECT' ||
              field.type === 'RADIO'
            ) {
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

    // Convert field values to numbers for calculation
    const numericValues: Record<string, number> = {};
    const allFields = (templateInfo.template.sections || []).flatMap((s) => s.fields || []);
    allFields.forEach((field) => {
      if (field.useInFormula) {
        const value = fieldValues[field.key];
        if (field.type === 'NUMBER') {
          numericValues[field.key] = Number(value) || 0;
        } else if (field.type === 'CHECKBOX') {
          numericValues[field.key] = value ? 1 : 0;
        } else if (field.type === 'SELECT' || field.type === 'RADIO') {
          // Get price from option if available
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
      setQuantityError(
        limits.minQuantityMessage ||
          `Minimum rendelési mennyiség: ${limits.minQuantity} db`
      );
    } else if (limits.maxQuantity && quantity > limits.maxQuantity) {
      setQuantityError(
        limits.maxQuantityMessage ||
          `Maximum rendelési mennyiség: ${limits.maxQuantity} db`
      );
    } else {
      setQuantityError(null);
    }
  }, [quantity, templateInfo?.template?.quantityLimits]);

  // Handle field change
  const handleFieldChange = (key: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!priceResult || !templateInfo?.template || quantityError) return;

    // Build properties object with field labels and values
    const properties: Record<string, any> = {};
    const allFields = (templateInfo.template.sections || []).flatMap((s) => s.fields || []);
    allFields.forEach((field) => {
      const value = fieldValues[field.key];
      if (value !== undefined && value !== '') {
        if (field.type === 'SELECT' || field.type === 'RADIO') {
          const option = field.options?.find((o) => o.value === value);
          properties[field.label] = option?.label || value;
        } else if (field.type === 'CHECKBOX') {
          properties[field.label] = value ? 'Igen' : 'Nem';
        } else {
          properties[field.label] = value;
        }
      }
    });

    // Add express info
    if (isExpress && templateInfo.template.hasExpressOption) {
      properties['Gyártás'] =
        templateInfo.template.expressLabel || 'Expressz gyártás';
    } else if (templateInfo.template.hasExpressOption) {
      properties['Gyártás'] =
        templateInfo.template.normalLabel || 'Normál gyártás';
    }

    // Add discount info
    if (priceResult.discountPercent) {
      properties['Kedvezmény'] = `-${priceResult.discountPercent}%`;
    }

    // Add notes if provided
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

    const allFields = (templateInfo.template.sections || []).flatMap((s) => s.fields || []);
    for (const field of allFields) {
      if (field.required) {
        const value = fieldValues[field.key];
        if (value === undefined || value === '' || value === null) {
          return false;
        }
      }
    }

    return !quantityError;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`priceflow-configurator ${className}`}>
        <div className="priceflow-loading">
          <div className="priceflow-spinner" />
          <span>Konfigurátor betöltése...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`priceflow-configurator ${className}`}>
        <div className="priceflow-error">{error}</div>
      </div>
    );
  }

  // No template found
  if (!templateInfo?.hasTemplate || !templateInfo.template) {
    return null; // Don't render anything if no template
  }

  const template = templateInfo.template;
  const allFields = (template.sections || []).flatMap((s) => s.fields || []);

  return (
    <div className={`priceflow-configurator ${className}`}>
      <div className="priceflow-layout flex flex-col lg:flex-row gap-6">
        {/* Left side - Form */}
        <div className="priceflow-form-section flex-1 lg:max-w-2xl">
          {/* Template description */}
          {template.description && (
            <div className="priceflow-description mb-6 p-4 bg-pink-50 border border-pink-100 rounded-lg text-gray-700">
              {template.description}
            </div>
          )}

          {/* Form fields */}
          <div className="priceflow-fields space-y-6">
            {allFields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <ConfiguratorField
                  key={field.key}
                  field={field}
                  value={fieldValues[field.key]}
                  onChange={(value) => handleFieldChange(field.key, value)}
                />
              ))}
          </div>

          {/* Quantity input */}
          <div className="mt-6">
            <QuantityInput
              value={quantity}
              onChange={setQuantity}
              min={template.quantityLimits?.minQuantity || 1}
              max={template.quantityLimits?.maxQuantity}
              error={quantityError}
            />
          </div>

          {/* Discount tiers display */}
          {template.discountTiers && template.discountTiers.length > 0 && (
            <div className="mt-6">
              <DiscountTierDisplay
                tiers={template.discountTiers}
                currentQuantity={quantity}
              />
            </div>
          )}

          {/* Express option selector */}
          {template.hasExpressOption && (
            <div className="mt-6">
              <ExpressSelector
                isExpress={isExpress}
                onChange={setIsExpress}
                normalLabel={template.normalLabel || 'Normál gyártás (7-10 munkanap)'}
                expressLabel={template.expressLabel || 'Expressz gyártás (3 munkanap)'}
                normalPrice={priceResult?.normalPrice}
                expressPrice={priceResult?.expressPrice}
                expressMultiplier={template.expressMultiplier}
              />
            </div>
          )}

          {/* Notes field */}
          {template.hasNotesField && (
            <div className="mt-6">
              <label className="priceflow-label block text-sm font-medium text-gray-700 mb-2">
                {template.notesFieldLabel || 'Megjegyzés'}
              </label>
              <textarea
                className="priceflow-input priceflow-textarea w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder={template.notesFieldPlaceholder || 'Írja ide megjegyzését...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Mobile price display (hidden on desktop) */}
          <div className="lg:hidden mt-6">
            <PriceDisplay
              result={priceResult}
              calculating={calculating}
              currency="HUF"
            />

            {/* Mobile Add to cart button */}
            <button
              type="button"
              className="priceflow-add-to-cart w-full mt-4 py-3 px-6 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              onClick={handleAddToCart}
              disabled={!isFormValid() || calculating || !priceResult}
            >
              Kosárba
            </button>
          </div>
        </div>

        {/* Right side - Summary sidebar (hidden on mobile) */}
        <div className="hidden lg:block lg:w-80 xl:w-96">
          <ConfigSummary
            productTitle={productTitle}
            productImage={productImage}
            fields={allFields}
            fieldValues={fieldValues}
            quantity={quantity}
            isExpress={isExpress}
            expressLabel={template.expressLabel}
            normalLabel={template.normalLabel}
            priceResult={priceResult}
            calculating={calculating}
            discountPercent={priceResult?.discountPercent}
            hasNotesField={template.hasNotesField}
            notesFieldLabel={template.notesFieldLabel}
            notes={notes}
            onAddToCart={handleAddToCart}
            isFormValid={isFormValid()}
          />
        </div>
      </div>
    </div>
  );
}
