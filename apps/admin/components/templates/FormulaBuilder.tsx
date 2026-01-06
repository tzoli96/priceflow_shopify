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
import { FORMULA_OPERATORS, FORMULA_FUNCTIONS } from '@/lib/constants/template';

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

  // Filter NUMBER fields for formula (only numeric fields can be used in calculations)
  const formulaFields = fields.filter(field => field.type === 'NUMBER');

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
      {/* Field Buttons */}
      {formulaFields.length > 0 ? (
        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm" as="h4">
              Elérhető mezők a képletben (kattints a beszúráshoz)
            </Text>
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
            {fields.length > formulaFields.length && (
              <Text as="p" variant="bodySm" tone="subdued">
                {fields.length - formulaFields.length} nem-számszerű mező nem használható a képletben
              </Text>
            )}
          </BlockStack>
        </Card>
      ) : (
        <Banner tone="warning">
          <p>
            {fields.length === 0
              ? 'Először adj hozzá NUMBER típusú mezőket a "Mezők konfigurációja" szekcióban.'
              : 'Nincs NUMBER típusú mező. Adj hozzá legalább egy NUMBER típusú mezőt a képlet használatához.'}
          </p>
        </Banner>
      )}

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
            Példa képlet:
          </Text>
          <Text as="p" fontWeight="regular">
            <code>
              (width_cm * height_cm / 10000) * unit_m2_price + floor(width_cm / 25) *
              grommet_fee
            </code>
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Ez kiszámítja a területet négyzetméterben, megszorozza az egységárral, majd
            hozzáadja a rigli díjat (25 cm-enként).
          </Text>
        </BlockStack>
      </Banner>
    </BlockStack>
  );
};
