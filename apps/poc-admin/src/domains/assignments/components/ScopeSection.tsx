import React, { useState, useEffect } from 'react';
import { FormLayout, Select, Banner, Text, Button, InlineStack } from '@shopify/polaris';
import { SCOPE_TYPE_OPTIONS } from '../../template/constants';
import { ScopeSelector } from './ScopeSelector';
import type { TemplateScope } from '../../template/types';

interface ScopeSectionProps {
  scope: TemplateScope;
  onChange: (scope: TemplateScope) => void;
}

export const ScopeSection: React.FC<ScopeSectionProps> = ({ scope, onChange }) => {
  const [scopeType, setScopeType] = useState<string>(scope.type || 'global');
  const [showSelector, setShowSelector] = useState(false);

  // Update scopeType when scope prop changes (for edit mode)
  useEffect(() => {
    if (scope.type !== scopeType) {
      setScopeType(scope.type);
    }
  }, [scope.type]);

  const handleScopeTypeChange = (value: string) => {
    setScopeType(value);
    
    let newScope: TemplateScope;
    switch (value) {
      case 'product':
        newScope = { type: 'product', values: [] };
        setShowSelector(true);
        break;
      case 'collection':
        newScope = { type: 'collection', values: [] };
        setShowSelector(true);
        break;
      case 'vendor':
        newScope = { type: 'vendor', values: [] };
        setShowSelector(true);
        break;
      case 'tag':
        newScope = { type: 'tag', values: [] };
        setShowSelector(true);
        break;
      default:
        newScope = { type: 'global' };
        setShowSelector(false);
    }
    
    onChange(newScope);
  };

  const handleValuesChange = (values: string[]) => {
    onChange({ ...scope, values });
  };

  return (
    <FormLayout>
      <Select
        label="Hatókör típusa"
        options={SCOPE_TYPE_OPTIONS.map(opt => ({
          label: opt.label,
          value: opt.value,
        }))}
        value={scopeType}
        onChange={handleScopeTypeChange}
      />

      {scopeType !== 'global' && (
        <Banner tone="info">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p">
              {scope.values?.length || 0} elem kiválasztva
            </Text>
            <Button onClick={() => setShowSelector(true)} size="slim">
              {scope.values?.length ? 'Szerkesztés' : 'Választás'}
            </Button>
          </InlineStack>
        </Banner>
      )}

      {showSelector && scopeType !== 'global' && (
        <ScopeSelector
          scopeType={scopeType as 'product' | 'collection' | 'vendor' | 'tag'}
          selectedValues={scope.values || []}
          onChange={handleValuesChange}
          onClose={() => setShowSelector(false)}
        />
      )}
    </FormLayout>
  );
};
