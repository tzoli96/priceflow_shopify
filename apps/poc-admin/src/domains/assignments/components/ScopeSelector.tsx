/**
 * ScopeSelector Component
 * Modal for selecting scope items (products, collections, vendors, tags)
 * Integrated with backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ResourceList,
  ResourceItem,
  Avatar,
  Text,
  Filters,
  Spinner,
  Banner,
  EmptyState,
  InlineStack,
} from '@shopify/polaris';
import { useScope } from '../hooks/useScope';
import type { ScopeType } from '../types/scope.types';

// ============================================================================
// Component Props
// ============================================================================

interface ScopeSelectorProps {
  scopeType: ScopeType;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onClose: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScopeTitle(scopeType: ScopeType): string {
  const titles: Record<ScopeType, string> = {
    product: 'Termékek kiválasztása',
    collection: 'Kollekciók kiválasztása',
    vendor: 'Gyártók kiválasztása',
    tag: 'Címkék kiválasztása',
  };
  return titles[scopeType];
}

function getItemId(item: any): string {
  return item.id || item.name;
}

function getItemName(item: any): string {
  return item.title || item.name;
}

// ============================================================================
// Component
// ============================================================================

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  scopeType,
  selectedValues,
  onChange,
  onClose,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const { data, loading, error, search, loadMore, hasMore } = useScope(scopeType, {
    limit: 20,
  });

  // Handle search with debounce
  useEffect(() => {
    search(searchValue);
  }, [searchValue]);

  // ============================================================================
  // Render States
  // ============================================================================

  const renderContent = () => {
    // Loading state
    if (loading && data.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner accessibilityLabel="Adatok betöltése..." size="large" />
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <Banner tone="critical" title="Hiba történt">
          <p>{error}</p>
        </Banner>
      );
    }

    // Empty state
    if (data.length === 0) {
      return (
        <EmptyState
          heading="Nincs találat"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            {searchValue
              ? `Nincs találat a "${searchValue}" keresésre.`
              : 'Nincsenek elérhető elemek.'}
          </p>
        </EmptyState>
      );
    }

    // Data list
    return (
      <ResourceList
        resourceName={{ singular: 'elem', plural: 'elemek' }}
        items={data}
        selectedItems={selectedValues}
        onSelectionChange={onChange}
        selectable
        loading={loading}
        renderItem={(item) => {
          const itemId = getItemId(item);
          const itemName = getItemName(item);

          return (
            <ResourceItem
              id={itemId}
              media={<Avatar customer size="medium" name={itemName} />}
            >
              <InlineStack blockAlign="center" gap="200">
                <Text variant="bodyMd" fontWeight="bold" as="h3">
                  {itemName}
                </Text>
                {(item as any).vendor && (
                  <Text variant="bodySm" tone="subdued" as="span">
                    {(item as any).vendor}
                  </Text>
                )}
              </InlineStack>
            </ResourceItem>
          );
        }}
      />
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={getScopeTitle(scopeType)}
      size="large"
      primaryAction={{
        content: 'Kész',
        onAction: onClose,
      }}
      secondaryActions={
        hasMore
          ? [
              {
                content: 'Több betöltése',
                onAction: loadMore,
                loading: loading,
              },
            ]
          : undefined
      }
    >
      <Modal.Section>
        <div style={{ marginBottom: '16px' }}>
          <Filters
            queryValue={searchValue}
            queryPlaceholder="Keresés..."
            onQueryChange={setSearchValue}
            onQueryClear={() => setSearchValue('')}
            filters={[]}
            onClearAll={() => {}}
            loading={loading}
          />
        </div>

        {renderContent()}
      </Modal.Section>
    </Modal>
  );
};
