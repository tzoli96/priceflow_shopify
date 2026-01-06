import type { FieldType, ConditionalOperator } from './types';

export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Szám', value: 'number' },
  { label: 'Szöveg', value: 'text' },
  { label: 'Legördülő menü', value: 'select' },
  { label: 'Radio gombok', value: 'radio' },
  { label: 'Jelölőnégyzet', value: 'checkbox' },
  { label: 'Szövegterület', value: 'textarea' },
  { label: 'Fájl feltöltés', value: 'file' },
];

export const CONDITIONAL_OPERATORS: { label: string; value: ConditionalOperator }[] = [
  { label: 'Egyenlő (==)', value: '==' },
  { label: 'Nem egyenlő (!=)', value: '!=' },
  { label: 'Nagyobb (>)', value: '>' },
  { label: 'Kisebb (<)', value: '<' },
  { label: 'Nagyobb vagy egyenlő (>=)', value: '>=' },
  { label: 'Kisebb vagy egyenlő (<=)', value: '<=' },
  { label: 'Tartalmazza', value: 'includes' },
  { label: 'Nem tartalmazza', value: 'excludes' },
];

export const CONDITIONAL_ACTIONS = [
  { label: 'Megjelenít', value: 'show' },
  { label: 'Elrejt', value: 'hide' },
  { label: 'Kötelezővé tesz', value: 'require' },
] as const;

export const SCOPE_TYPE_OPTIONS = [
  { label: 'Termék', value: 'product' },
  { label: 'Kollekció', value: 'collection' },
  { label: 'Gyártó (Vendor)', value: 'vendor' },
  { label: 'Tag', value: 'tag' },
  { label: 'Globális (minden termék)', value: 'global' },
] as const;

export const FORMULA_FUNCTIONS = [
  { name: 'floor', description: 'Lefelé kerekít', example: 'floor(3.7) = 3' },
  { name: 'ceil', description: 'Felfelé kerekít', example: 'ceil(3.2) = 4' },
  { name: 'round', description: 'Kerekít', example: 'round(3.5) = 4' },
  { name: 'min', description: 'Minimum érték', example: 'min(5, 10) = 5' },
  { name: 'max', description: 'Maximum érték', example: 'max(5, 10) = 10' },
  { name: 'if', description: 'Feltételes', example: 'if(x > 10, 100, 50)' },
] as const;

export const FORMULA_OPERATORS = [
  { symbol: '+', description: 'Összeadás' },
  { symbol: '-', description: 'Kivonás' },
  { symbol: '*', description: 'Szorzás' },
  { symbol: '/', description: 'Osztás' },
  { symbol: '^', description: 'Hatványozás' },
  { symbol: '()', description: 'Zárójelek' },
] as const;

export const API_ENDPOINTS = {
  templates: {
    list: '/api/v1/templates',
    get: (id: string) => `/api/v1/templates/${id}`,
    create: '/api/v1/templates',
    update: (id: string) => `/api/v1/templates/${id}`,
    delete: (id: string) => `/api/v1/templates/${id}`,
    export: (id: string) => `/api/v1/templates/${id}/export`,
    import: '/api/v1/templates/import',
    preview: (id: string) => `/api/v1/templates/${id}/preview`,
  },
};
