/**
 * ScopeSelector - Template scope (hatókör) kiválasztása
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  BlockStack,
  Select,
  Text,
  Autocomplete,
  Icon,
  Tag,
  InlineStack,
  Banner,
  Pagination,
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';
import type { ScopeType } from '@/types/template';
import { api } from '@/lib/api';

// ============================================================================
// ScopeSelector Component
// ============================================================================

interface ScopeSelectorProps {
  scopeType: ScopeType;
  scopeValues: string[];
  onChange: (scopeType: ScopeType, scopeValues: string[]) => void;
  disabled?: boolean;
}

export function ScopeSelector({
  scopeType,
  scopeValues,
  onChange,
  disabled = false,
}: ScopeSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(scopeValues);

  // Pagination state
  const [pageInfo, setPageInfo] = useState<{ next: string | null; previous: string | null }>({
    next: null,
    previous: null,
  });
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [currentPageCursor, setCurrentPageCursor] = useState<string | undefined>(undefined);

  // Scope type options
  const scopeTypeOptions = [
    { label: '🌍 Minden termék (GLOBAL)', value: 'GLOBAL' },
    { label: '📦 Konkrét termékek', value: 'PRODUCT' },
    { label: '📚 Kollekciók', value: 'COLLECTION' },
    { label: '🏭 Gyártók', value: 'VENDOR' },
    { label: '🏷️ Címkék', value: 'TAG' },
  ];

  useEffect(() => {
    if (scopeType !== 'GLOBAL') {
      loadScopeOptions();
    } else {
      setOptions([]);
    }
  }, [scopeType]);

  useEffect(() => {
    setSelectedOptions(scopeValues);
  }, [scopeValues]);

  const loadScopeOptions = async (cursor?: string) => {
    try {
      setLoading(true);

      let data: any[] = [];

      switch (scopeType) {
        case 'PRODUCT':
          const productsResponse = await api.shopify.getProducts({ pageInfo: cursor });
          data = productsResponse.products.map((p) => ({
            label: p.title,
            value: p.id,
          }));

          // Update pagination state
          setPageInfo(productsResponse.pageInfo);
          setHasNextPage(productsResponse.hasNextPage);
          setHasPreviousPage(productsResponse.hasPreviousPage);
          break;

        case 'COLLECTION':
          const collections = await api.shopify.getCollections();
          data = collections.map((c) => ({
            label: c.title,
            value: c.id,
          }));
          break;

        case 'VENDOR':
          const vendors = await api.shopify.getVendors();
          data = vendors.map((v) => ({
            label: v,
            value: v,
          }));
          break;

        case 'TAG':
          const tags = await api.shopify.getTags();
          data = tags.map((t) => ({
            label: t,
            value: t,
          }));
          break;
      }

      setOptions(data);
    } catch (error) {
      console.error('Failed to load scope options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScopeTypeChange = (value: string) => {
    const newScopeType = value as ScopeType;
    onChange(newScopeType, []);
    setSelectedOptions([]);
  };

  const handleSelectionChange = (selected: string[]) => {
    setSelectedOptions(selected);
    onChange(scopeType, selected);
  };

  const removeTag = (valueToRemove: string) => {
    const newSelected = selectedOptions.filter((value) => value !== valueToRemove);
    setSelectedOptions(newSelected);
    onChange(scopeType, newSelected);
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const textField = (
    <Autocomplete.TextField
      onChange={setInputValue}
      label=""
      value={inputValue}
      placeholder={`Keresés...`}
      autoComplete="off"
      prefix={<Icon source={SearchIcon} />}
      disabled={disabled || loading}
    />
  );

  return (
    <BlockStack gap="300">
      {/* Scope Type */}
      <Select
        label="Hatókör típusa"
        options={scopeTypeOptions}
        value={scopeType}
        onChange={handleScopeTypeChange}
        disabled={disabled}
        helpText="Válaszd ki, hogy a sablon mely termékekre vonatkozzon"
      />

      {/* Scope Values (ha nem GLOBAL) */}
      {scopeType !== 'GLOBAL' && (
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd" fontWeight="medium">
            Válassz ki elemeket
          </Text>

          {loading && (
            <Banner tone="info">
              Betöltés...
            </Banner>
          )}

          {!loading && options.length === 0 && (
            <Banner tone="warning">
              Nincs elérhető elem. Ellenőrizd, hogy van-e termék a Shopify-ban.
            </Banner>
          )}

          {!loading && options.length > 0 && (
            <>
              <Autocomplete
                allowMultiple
                options={filteredOptions}
                selected={selectedOptions}
                onSelect={handleSelectionChange}
                textField={textField}
                loading={loading}
              />

              {/* Pagination for PRODUCT scope */}
              {scopeType === 'PRODUCT' && (hasNextPage || hasPreviousPage) && (
                <InlineStack align="center">
                  <Pagination
                    hasPrevious={hasPreviousPage}
                    onPrevious={() => {
                      if (pageInfo.previous) {
                        setCurrentPageCursor(pageInfo.previous);
                        loadScopeOptions(pageInfo.previous);
                      }
                    }}
                    hasNext={hasNextPage}
                    onNext={() => {
                      if (pageInfo.next) {
                        setCurrentPageCursor(pageInfo.next);
                        loadScopeOptions(pageInfo.next);
                      }
                    }}
                  />
                </InlineStack>
              )}
            </>
          )}

          {/* Selected items */}
          {selectedOptions.length > 0 && (
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Kiválasztva: {selectedOptions.length}
              </Text>
              <InlineStack gap="100" wrap>
                {selectedOptions.map((value) => {
                  const option = options.find((opt) => opt.value === value);
                  return (
                    <Tag key={value} onRemove={() => removeTag(value)}>
                      {option?.label || value}
                    </Tag>
                  );
                })}
              </InlineStack>
            </BlockStack>
          )}
        </BlockStack>
      )}

      {/* GLOBAL info */}
      {scopeType === 'GLOBAL' && (
        <Banner tone="info">
          Ez a sablon minden termékre érvényes lesz.
        </Banner>
      )}
    </BlockStack>
  );
}
