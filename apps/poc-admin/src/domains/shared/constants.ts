/**
 * Application constants - Backward compatibility
 * @deprecated Use domain-specific constants instead
 */

// Re-export from domains for backward compatibility
export * from '@/template/constants';
export * from '@/common/constants';
export * from '@/assignments/constants';
export * from '@/calculation/constants';
export * from '@/shopify/constants';

// Legacy combined API_ENDPOINTS for backward compatibility
import { API_ENDPOINTS as TEMPLATE_ENDPOINTS } from '@/template/constants';
import { API_ENDPOINTS as ASSIGNMENT_ENDPOINTS } from '@/assignments/constants';
import { API_ENDPOINTS as CALCULATION_ENDPOINTS } from '@/calculation/constants';
import { API_ENDPOINTS as SHOPIFY_ENDPOINTS } from '@/shopify/constants';
import { API_ENDPOINTS as COMMON_ENDPOINTS } from '@/common/constants';

export const API_ENDPOINTS = {
  ...TEMPLATE_ENDPOINTS,
  ...ASSIGNMENT_ENDPOINTS,
  ...CALCULATION_ENDPOINTS,
  ...SHOPIFY_ENDPOINTS,
  ...COMMON_ENDPOINTS,
};

// Example templates
export const EXAMPLE_TEMPLATES = {
  molino: {
    name: 'Molinó kalkulátor',
    description: 'Szélesség × magasság alapú árazás riglizéssel',
    fields: [
      { key: 'width_cm', type: 'number' as const, label: 'Szélesség (cm)' },
      { key: 'height_cm', type: 'number' as const, label: 'Magasság (cm)' },
      {
        key: 'material',
        type: 'select' as const,
        label: 'Anyag',
        options: [
          { label: 'PVC', value: 'pvc' },
          { label: 'Mesh', value: 'mesh' },
          { label: 'Frontlit', value: 'frontlit' },
        ],
      },
    ],
    formula: '((width_cm * height_cm) / 10000) * unit_m2_price + (floor(width_cm / 25) + 1) * grommet_fee',
    meta: {
      unit_m2_price: 1500,
      grommet_fee: 100,
    },
  },
} as const;
