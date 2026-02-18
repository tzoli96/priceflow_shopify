import { FieldType } from '@/types/template';
import React from 'react';

// Legacy simple options (for backward compatibility)
export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Szám', value: FieldType.NUMBER },
  { label: 'Szöveg', value: FieldType.TEXT },
  { label: 'Legördülő menü', value: FieldType.SELECT },
  { label: 'Radio gombok', value: FieldType.RADIO },
  { label: 'Jelölőnégyzet', value: FieldType.CHECKBOX },
  { label: 'Szövegterület', value: FieldType.TEXTAREA },
  { label: 'Fájl feltöltés', value: FieldType.FILE },
  { label: 'Termék kártya', value: FieldType.PRODUCT_CARD },
  { label: 'Átfutási idő', value: FieldType.DELIVERY_TIME },
  { label: 'Extrák', value: FieldType.EXTRAS },
  { label: 'Grafika választó', value: FieldType.GRAPHIC_SELECT },
  { label: 'Mennyiség választó', value: FieldType.QUANTITY_SELECTOR },
];

/**
 * Visual field type definitions with icons
 */
export interface FieldTypeDefinition {
  value: FieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export interface FieldTypeCategory {
  title: string;
  description: string;
  types: FieldTypeDefinition[];
}

/**
 * Field types organized by category with visual icons
 */
export const FIELD_TYPE_CATEGORIES: FieldTypeCategory[] = [
  {
    title: 'Alapvető beviteli mezők',
    description: 'Egyszerű adatbevitelhez',
    types: [
      {
        value: FieldType.NUMBER,
        label: 'Szám',
        description: 'Számérték bevitel (méret, mennyiség)',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 10, width: 32, height: 20, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('text', { x: 20, y: 24, textAnchor: 'middle', fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }, '123')
        ),
      },
      {
        value: FieldType.TEXT,
        label: 'Szöveg',
        description: 'Rövid szöveges bevitel',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 10, width: 32, height: 20, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('text', { x: 20, y: 24, textAnchor: 'middle', fill: 'currentColor', fontSize: 11, fontWeight: 'bold' }, 'Abc')
        ),
      },
      {
        value: FieldType.TEXTAREA,
        label: 'Szövegmező',
        description: 'Többsoros szöveg (megjegyzés)',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 6, width: 32, height: 28, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('line', { x1: 8, y1: 12, x2: 24, y2: 12, stroke: 'currentColor', strokeWidth: 2, opacity: 0.6 }),
          React.createElement('line', { x1: 8, y1: 18, x2: 28, y2: 18, stroke: 'currentColor', strokeWidth: 2, opacity: 0.6 }),
          React.createElement('line', { x1: 8, y1: 24, x2: 20, y2: 24, stroke: 'currentColor', strokeWidth: 2, opacity: 0.6 })
        ),
      },
      {
        value: FieldType.CHECKBOX,
        label: 'Jelölőnégyzet',
        description: 'Igen/nem választás',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 10, y: 10, width: 20, height: 20, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('path', { d: 'M15 20L18 23L25 16', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
        ),
      },
      {
        value: FieldType.FILE,
        label: 'Fájl feltöltés',
        description: 'Dokumentum vagy kép feltöltése',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('path', { d: 'M12 6H24L32 14V34H12C10.9 34 10 33.1 10 32V8C10 6.9 10.9 6 12 6Z', stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('path', { d: 'M24 6V14H32', stroke: 'currentColor', strokeWidth: 2 }),
          React.createElement('path', { d: 'M21 20V28M21 20L17 24M21 20L25 24', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' })
        ),
      },
    ],
  },
  {
    title: 'Választó mezők',
    description: 'Előre megadott opciók közül választás',
    types: [
      {
        value: FieldType.SELECT,
        label: 'Legördülő',
        description: 'Dropdown menü egy választással',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 12, width: 32, height: 16, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('path', { d: 'M28 17L32 22L28 27', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', transform: 'rotate(90 30 20)' }),
          React.createElement('line', { x1: 8, y1: 20, x2: 22, y2: 20, stroke: 'currentColor', strokeWidth: 2, opacity: 0.6 })
        ),
      },
      {
        value: FieldType.RADIO,
        label: 'Radio gombok',
        description: 'Látható opciók, egy választható',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('circle', { cx: 12, cy: 12, r: 5, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('circle', { cx: 12, cy: 12, r: 2.5, fill: 'currentColor' }),
          React.createElement('circle', { cx: 12, cy: 24, r: 5, stroke: 'currentColor', strokeWidth: 2, fill: 'none', opacity: 0.5 }),
          React.createElement('line', { x1: 20, y1: 12, x2: 34, y2: 12, stroke: 'currentColor', strokeWidth: 2 }),
          React.createElement('line', { x1: 20, y1: 24, x2: 30, y2: 24, stroke: 'currentColor', strokeWidth: 2, opacity: 0.5 })
        ),
      },
      {
        value: FieldType.QUANTITY_SELECTOR,
        label: 'Mennyiség választó',
        description: '- / + gombok és preset értékek',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          // Main quantity selector (- [5] +)
          React.createElement('rect', { x: 6, y: 12, width: 28, height: 10, rx: 5, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('line', { x1: 9, y1: 17, x2: 13, y2: 17, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
          React.createElement('line', { x1: 29, y1: 15, x2: 29, y2: 19, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
          React.createElement('line', { x1: 27, y1: 17, x2: 31, y2: 17, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
          React.createElement('text', { x: 20, y: 19, textAnchor: 'middle', fill: 'currentColor', fontSize: 8, fontWeight: 'bold' }, '5'),
          // Preset buttons
          React.createElement('rect', { x: 6, y: 26, width: 7, height: 6, rx: 2, fill: 'currentColor', opacity: 0.3 }),
          React.createElement('rect', { x: 15, y: 26, width: 10, height: 6, rx: 2, fill: 'currentColor', opacity: 0.5 }),
          React.createElement('rect', { x: 27, y: 26, width: 7, height: 6, rx: 2, fill: 'currentColor', opacity: 0.3 })
        ),
      },
    ],
  },
  {
    title: 'Speciális választók',
    description: 'Gazdag tartalmú kártyás megjelenítés',
    types: [
      {
        value: FieldType.PRODUCT_CARD,
        label: 'Termék kártya',
        description: 'Kép, leírás, jellemzők, ár',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 4, width: 32, height: 32, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('rect', { x: 8, y: 8, width: 24, height: 14, rx: 2, fill: 'currentColor', opacity: 0.3 }),
          React.createElement('line', { x1: 8, y1: 26, x2: 20, y2: 26, stroke: 'currentColor', strokeWidth: 2 }),
          React.createElement('line', { x1: 8, y1: 31, x2: 16, y2: 31, stroke: 'currentColor', strokeWidth: 1.5, opacity: 0.5 }),
          React.createElement('text', { x: 28, y: 31, textAnchor: 'middle', fill: 'currentColor', fontSize: 8, fontWeight: 'bold' }, 'Ft')
        ),
      },
      {
        value: FieldType.DELIVERY_TIME,
        label: 'Átfutási idő',
        description: 'Szállítási/gyártási idő opciók',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('circle', { cx: 20, cy: 20, r: 14, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('path', { d: 'M20 10V20L26 26', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
          React.createElement('circle', { cx: 20, cy: 20, r: 2, fill: 'currentColor' })
        ),
      },
      {
        value: FieldType.EXTRAS,
        label: 'Extrák',
        description: 'Több is választható (kiegészítők)',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 8, width: 14, height: 10, rx: 2, stroke: 'currentColor', strokeWidth: 2, fill: 'currentColor', fillOpacity: 0.2 }),
          React.createElement('rect', { x: 22, y: 8, width: 14, height: 10, rx: 2, stroke: 'currentColor', strokeWidth: 2, fill: 'none', opacity: 0.5 }),
          React.createElement('rect', { x: 4, y: 22, width: 14, height: 10, rx: 2, stroke: 'currentColor', strokeWidth: 2, fill: 'currentColor', fillOpacity: 0.2 }),
          React.createElement('rect', { x: 22, y: 22, width: 14, height: 10, rx: 2, stroke: 'currentColor', strokeWidth: 2, fill: 'none', opacity: 0.5 }),
          React.createElement('path', { d: 'M8 13L10 15L14 11', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
          React.createElement('path', { d: 'M8 27L10 29L14 25', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })
        ),
      },
      {
        value: FieldType.GRAPHIC_SELECT,
        label: 'Grafika választó',
        description: 'Feltöltöm / Tervezést kérek',
        icon: React.createElement('svg', { width: 40, height: 40, viewBox: '0 0 40 40', fill: 'none' },
          React.createElement('rect', { x: 4, y: 6, width: 32, height: 28, rx: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }),
          React.createElement('circle', { cx: 14, cy: 16, r: 4, fill: 'currentColor', opacity: 0.4 }),
          React.createElement('path', { d: 'M4 28L14 20L22 26L32 18', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
          React.createElement('path', { d: 'M28 10L32 10M30 8L30 12', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' })
        ),
      },
    ],
  },
];

export const FORMULA_FUNCTIONS = [
  { name: 'floor', description: 'Lefelé kerekít', example: 'floor(3.7) = 3' },
  { name: 'ceil', description: 'Felfelé kerekít', example: 'ceil(3.2) = 4' },
  { name: 'round', description: 'Kerekít', example: 'round(3.5) = 4' },
  { name: 'min', description: 'Minimum érték', example: 'min(5, 10) = 5' },
  { name: 'max', description: 'Maximum érték', example: 'max(5, 10) = 10' },
  { name: 'if', description: 'Feltételes', example: 'if(x > 10, 100, 50)' },
  { name: 'abs', description: 'Abszolút érték', example: 'abs(-5) = 5' },
  { name: 'sqrt', description: 'Négyzetgyök', example: 'sqrt(16) = 4' },
  { name: 'pow', description: 'Hatványozás', example: 'pow(2, 3) = 8' },
] as const;

export const FORMULA_OPERATORS = [
  { symbol: '+', description: 'Összeadás' },
  { symbol: '-', description: 'Kivonás' },
  { symbol: '*', description: 'Szorzás' },
  { symbol: '/', description: 'Osztás' },
  { symbol: '^', description: 'Hatványozás' },
  { symbol: '(', description: 'Bal zárójel' },
  { symbol: ')', description: 'Jobb zárójel' },
] as const;

/**
 * System variables available in formulas
 * These are automatically provided by the pricing engine
 */
export const FORMULA_SYSTEM_VARIABLES = [
  {
    name: 'base_price',
    description: 'Termék alap ára (Shopify-ból)',
    example: 'base_price + 500',
  },
] as const;
