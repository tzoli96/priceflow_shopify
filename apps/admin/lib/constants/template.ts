import { FieldType } from '@/types/template';

export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Szám', value: FieldType.NUMBER },
  { label: 'Szöveg', value: FieldType.TEXT },
  { label: 'Legördülő menü', value: FieldType.SELECT },
  { label: 'Radio gombok', value: FieldType.RADIO },
  { label: 'Jelölőnégyzet', value: FieldType.CHECKBOX },
  { label: 'Szövegterület', value: FieldType.TEXTAREA },
  { label: 'Fájl feltöltés', value: FieldType.FILE },
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
  {
    name: 'quantity',
    description: 'Rendelt mennyiség',
    example: 'base_price * quantity',
  },
] as const;
