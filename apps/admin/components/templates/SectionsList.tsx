/**
 * SectionsList - Manage template sections
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Button,
  InlineStack,
  Badge,
  EmptyState,
  BlockStack,
} from '@shopify/polaris';
import { SectionEditor } from './SectionEditor';
import type { TemplateSection, LayoutType, BuiltInSectionType } from '@/types/template';

interface SectionsListProps {
  sections: TemplateSection[];
  onChange: (sections: TemplateSection[]) => void;
  pricingFormula?: string;
}

export const SectionsList: React.FC<SectionsListProps> = ({ sections, onChange, pricingFormula = '' }) => {
  const [editingSection, setEditingSection] = useState<TemplateSection | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const getLayoutTypeLabel = (type: LayoutType): string => {
    switch (type) {
      case 'VERTICAL':
        return 'Függőleges';
      case 'HORIZONTAL':
        return 'Vízszintes';
      case 'GRID':
        return 'Rács';
      case 'SPLIT':
        return 'Osztott';
      case 'CHECKBOX_LIST':
        return 'Checkbox lista';
      default:
        return type;
    }
  };

  const getBuiltInTypeLabel = (type?: BuiltInSectionType): string | null => {
    switch (type) {
      case 'SIZE':
        return 'Méret';
      case 'QUANTITY':
        return 'Mennyiség';
      case 'EXPRESS':
        return 'Expressz';
      case 'NOTES':
        return 'Megjegyzés';
      case 'FILE_UPLOAD':
        return 'Fájl feltöltés';
      default:
        return null;
    }
  };

  const handleEdit = (section: TemplateSection, index: number) => {
    setEditingSection(section);
    setEditingIndex(index);
    setShowEditor(true);
  };

  const handleDelete = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const handleAddNew = () => {
    setEditingSection(null);
    setEditingIndex(null);
    setShowEditor(true);
  };

  const handleSave = (section: TemplateSection) => {
    if (editingIndex !== null) {
      // Update existing section
      const updatedSections = [...sections];
      updatedSections[editingIndex] = section;
      onChange(updatedSections);
    } else {
      // Add new section
      onChange([...sections, section]);
    }
    setShowEditor(false);
    setEditingSection(null);
    setEditingIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index - 1];
    newSections[index - 1] = { ...newSections[index], order: index - 1 };
    newSections[index] = { ...temp, order: index };
    onChange(newSections);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = { ...newSections[index], order: index + 1 };
    newSections[index] = { ...temp, order: index };
    onChange(newSections);
  };

  if (sections.length === 0) {
    return (
      <>
        <EmptyState
          heading="Még nincsenek szekciók"
          action={{
            content: '+ Új szekció hozzáadása',
            onAction: handleAddNew,
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            Szekciókba rendezve jelennek meg a mezők a vásárlóknak.
            Minden szekció egy összecsukható kártya lesz a konfigurátor felületen.
          </p>
        </EmptyState>

        {showEditor && (
          <SectionEditor
            section={editingSection}
            existingKeys={sections.map((s) => s.key)}
            allFieldKeys={sections.flatMap((s) => (s.fields || []).map((f) => f.key))}
            pricingFormula={pricingFormula}
            sectionCount={sections.length}
            onSave={handleSave}
            onClose={() => {
              setShowEditor(false);
              setEditingSection(null);
              setEditingIndex(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Szekciók ({sections.length})
          </Text>
          <Button onClick={handleAddNew}>+ Új szekció</Button>
        </InlineStack>
      </div>

      <BlockStack gap="300">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => {
            const builtInLabel = getBuiltInTypeLabel(section.builtInType);
            const fieldsCount = section.fields?.length || 0;

            return (
              <Card key={section.key || index} padding="400">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" wrap={false}>
                      {section.showNumber && (
                        <Badge tone="info">{String(index + 1)}</Badge>
                      )}
                      <Text variant="bodyMd" fontWeight="bold" as="span">
                        {section.title}
                      </Text>
                      <Badge>{getLayoutTypeLabel(section.layoutType)}</Badge>
                      <Badge tone="success">{section.key}</Badge>
                      {builtInLabel && (
                        <Badge tone="warning">{`Built-in: ${builtInLabel}`}</Badge>
                      )}
                      {!builtInLabel && fieldsCount > 0 && (
                        <Badge>{`${fieldsCount} mező`}</Badge>
                      )}
                      {!section.collapsible && (
                        <Badge tone="attention">Nem csukható</Badge>
                      )}
                      {!section.defaultOpen && (
                        <Badge>Alapból zárva</Badge>
                      )}
                    </InlineStack>

                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                      >
                        ↑
                      </Button>
                      <Button
                        size="slim"
                        disabled={index === sections.length - 1}
                        onClick={() => handleMoveDown(index)}
                      >
                        ↓
                      </Button>
                      <Button size="slim" onClick={() => handleEdit(section, index)}>
                        Szerkeszt
                      </Button>
                      <Button
                        size="slim"
                        tone="critical"
                        onClick={() => handleDelete(index)}
                      >
                        Törlés
                      </Button>
                    </InlineStack>
                  </InlineStack>

                  {section.description && (
                    <Text variant="bodySm" tone="subdued" as="p">
                      {section.description}
                    </Text>
                  )}
                </BlockStack>
              </Card>
            );
          })}
      </BlockStack>

      {showEditor && (
        <SectionEditor
          section={editingSection}
          existingKeys={sections
            .map((s) => s.key)
            .filter((_, i) => i !== editingIndex)}
          allFieldKeys={sections.flatMap((s) => (s.fields || []).map((f) => f.key))}
          pricingFormula={pricingFormula}
          sectionCount={sections.length}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingSection(null);
            setEditingIndex(null);
          }}
        />
      )}
    </>
  );
};
