import { TemplateField } from '../types';

export const mockFields: TemplateField[] = [
  {
    id: '1',
    key: 'width_cm',
    type: 'number',
    label: 'Szélesség (cm)',
    required: true,
    validation: { min: 1, max: 1000 }
  },
  {
    id: '2',
    key: 'height_cm',
    type: 'number',
    label: 'Magasság (cm)',
    required: true,
    validation: { min: 1, max: 1000 }
  },
  {
    id: '3',
    key: 'material',
    type: 'select',
    label: 'Anyag',
    required: false,
    options: ['Műanyag', 'Fém', 'Fa', 'Üveg']
  }
];
