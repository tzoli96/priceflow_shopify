/**
 * FormulaBuilder Component
 * Visual formula builder with field insertion
 */

'use client';

import React, { useState } from 'react';
import {
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Text,
  Banner,
  Card,
  Divider,
} from '@shopify/polaris';
import type { TemplateField } from '@/types/template';
import { FORMULA_OPERATORS, FORMULA_FUNCTIONS, FORMULA_SYSTEM_VARIABLES } from '@/lib/constants/template';

interface FormulaBuilderProps {
  formula: string;
  fields: TemplateField[];
  onChange: (formula: string) => void;
  error?: string;
}

export const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  formula,
  fields,
  onChange,
  error,
}) => {
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textFieldRef = React.useRef<HTMLInputElement>(null);

  // Filter fields that can be used in formula
  // NUMBER: direct numeric value
  // PRODUCT_CARD, DELIVERY_TIME, EXTRAS: option price (with _price suffix)
  // SELECT, RADIO: option price if any option has a price
  const formulaFields = fields.filter(field => field.type === 'NUMBER');

  // Fields with price options (these will have _price suffix in formula)
  const priceOptionFields = fields.filter(field => {
    // Always include these types - they always generate _price variable
    if (
      field.type === 'PRODUCT_CARD' ||
      field.type === 'DELIVERY_TIME' ||
      field.type === 'EXTRAS' ||
      field.type === 'GRAPHIC_SELECT'
    ) {
      return true;
    }

    // Include SELECT/RADIO only if any option has a price
    if (field.type === 'SELECT' || field.type === 'RADIO') {
      return field.options?.some(opt => opt.price !== undefined && opt.price > 0);
    }

    return false;
  });

  const insertAtCursor = (text: string) => {
    const textarea = textFieldRef.current?.querySelector('textarea');
    if (!textarea) {
      onChange(formula + text);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newFormula = formula.substring(0, start) + text + formula.substring(end);
    onChange(newFormula);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const handleFieldClick = (fieldKey: string) => {
    insertAtCursor(fieldKey);
  };

  const handleOperatorClick = (operator: string) => {
    if (operator === '(' || operator === ')') {
      insertAtCursor(operator);
    } else {
      insertAtCursor(` ${operator} `);
    }
  };

  const handleFunctionClick = (func: string) => {
    insertAtCursor(`${func}()`);
  };

  return (
    <BlockStack gap="400">
      {/* All Available Variables */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingSm" as="h4">
            Elérhető mezők a képletben (kattints a beszúráshoz)
          </Text>

          {/* System Variables */}
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" fontWeight="semibold">
              Rendszer változók:
            </Text>
            <InlineStack gap="200" wrap>
              {FORMULA_SYSTEM_VARIABLES.map((variable) => (
                <Button
                  key={variable.name}
                  size="slim"
                  onClick={() => handleFieldClick(variable.name)}
                  tone="critical"
                >
                  {variable.name}
                </Button>
              ))}
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              <strong>base_price</strong>: Termék alap ára (Shopify-ból) • <strong>quantity</strong>: Rendelt mennyiség
            </Text>
          </BlockStack>

          <Divider />

          {/* User-defined NUMBER Fields */}
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" fontWeight="semibold">
              Szám mezők:
            </Text>
            {formulaFields.length > 0 ? (
              <InlineStack gap="200" wrap>
                {formulaFields.map((field) => (
                  <Button
                    key={field.key}
                    size="slim"
                    onClick={() => handleFieldClick(field.key)}
                    tone="success"
                  >
                    {field.key}
                    {field.label && field.label !== field.key && (
                      <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                        ({field.label})
                      </span>
                    )}
                  </Button>
                ))}
              </InlineStack>
            ) : (
              <Text as="p" variant="bodySm" tone="subdued">
                Nincs NUMBER típusú mező.
              </Text>
            )}
          </BlockStack>

          {/* Price Option Fields (PRODUCT_CARD, DELIVERY_TIME, EXTRAS) */}
          {priceOptionFields.length > 0 && (
            <>
              <Divider />
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" fontWeight="semibold">
                  Áras opciók (kiválasztott opció ára):
                </Text>
                <InlineStack gap="200" wrap>
                  {priceOptionFields.map((field) => (
                    <Button
                      key={field.key}
                      size="slim"
                      onClick={() => handleFieldClick(`${field.key}_price`)}
                      tone="warning"
                    >
                      {field.key}_price
                      {field.label && (
                        <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                          ({field.label})
                        </span>
                      )}
                    </Button>
                  ))}
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Ezek a mezők a kiválasztott opció árát adják vissza (EXTRAS esetén az összes kiválasztott ára összegét).
                </Text>
              </BlockStack>
            </>
          )}
        </BlockStack>
      </Card>

      {/* Operators */}
      <Card>
        <BlockStack gap="300">
          <Text variant="headingSm" as="h4">
            Operátorok
          </Text>
          <InlineStack gap="200" wrap>
            {FORMULA_OPERATORS.map((op) => (
              <Button
                key={op.symbol}
                size="slim"
                onClick={() => handleOperatorClick(op.symbol)}
              >
                {op.symbol}
              </Button>
            ))}
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Functions */}
      <Card>
        <BlockStack gap="300">
          <Text variant="headingSm" as="h4">
            Függvények
          </Text>
          <InlineStack gap="200" wrap>
            {FORMULA_FUNCTIONS.map((func) => (
              <Button
                key={func.name}
                size="slim"
                onClick={() => handleFunctionClick(func.name)}
              >
                {func.name}()
              </Button>
            ))}
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            Használható függvények: floor (lefelé kerekít), ceil (felfelé kerekít), round (kerekít),
            min/max (minimum/maximum), if (feltétel), abs (abszolút érték), sqrt (négyzetgyök), pow (hatványozás)
          </Text>
        </BlockStack>
      </Card>

      <Divider />

      {/* Formula Input */}
      <div ref={textFieldRef}>
        <TextField
          label="Képlet"
          value={formula}
          onChange={onChange}
          error={error}
          multiline={4}
          autoComplete="off"
          placeholder="Kattints a mezőkre és operátorokra a képlet összeállításához..."
          helpText="Használd a fenti gombokat a mezők és operátorok beszúrásához"
        />
      </div>

      {/* Example */}
      <Banner tone="info">
        <BlockStack gap="200">
          <Text as="p" fontWeight="semibold">
            Példa képletek:
          </Text>
          <Text as="p" fontWeight="regular">
            <code>base_price + szelesseg * 100</code>
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Alap ár + szélesség alapú felár
          </Text>
          <Text as="p" fontWeight="regular">
            <code>base_price * 1.5</code>
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Alap ár 50%-kal növelve
          </Text>
          <Text as="p" fontWeight="regular">
            <code>base_price * quantity</code>
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Alap ár szorozva a mennyiséggel
          </Text>
        </BlockStack>
      </Banner>
    </BlockStack>
  );
};
