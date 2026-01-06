/**
 * FormulaBuilder Component
 * Visual formula builder with field insertion
 */

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
import type { TemplateField } from '../types';
import { FORMULA_OPERATORS } from '../constants';

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
  const formulaFields = fields.filter(field => field.useInFormula !== false);

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
    insertAtCursor(` ${operator} `);
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
                </Button>
              ))}
            </InlineStack>
            {fields.length > formulaFields.length && (
              <Text as="p" variant="bodySm" tone="subdued">
                {fields.length - formulaFields.length} mező ki van zárva a képletből (nem
                jelölted be a "Használható a képletben" opciót)
              </Text>
            )}
          </BlockStack>
        </Card>
      ) : (
        <Banner tone="warning">
          <p>
            {fields.length === 0
              ? 'Először adj hozzá mezőket a "Mezők konfigurációja" szekcióban.'
              : 'Nincs olyan mező, ami használható lenne a képletben. Jelöld be legalább egy mezőnél a "Használható a képletben" opciót.'}
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
            <Button size="slim" onClick={() => handleFunctionClick('floor')}>
              floor()
            </Button>
            <Button size="slim" onClick={() => handleFunctionClick('ceil')}>
              ceil()
            </Button>
            <Button size="slim" onClick={() => handleFunctionClick('round')}>
              round()
            </Button>
            <Button size="slim" onClick={() => handleFunctionClick('min')}>
              min()
            </Button>
            <Button size="slim" onClick={() => handleFunctionClick('max')}>
              max()
            </Button>
            <Button size="slim" onClick={() => handleFunctionClick('if')}>
              if()
            </Button>
          </InlineStack>
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
