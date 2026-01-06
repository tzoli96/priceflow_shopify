export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10 MB
  allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
} as const;

export const VALIDATION_MESSAGES = {
  required: 'Ez a mező kötelező',
  invalidNumber: 'Érvényes számot adj meg',
  minValue: (min: number) => `Az érték nem lehet kisebb mint ${min}`,
  maxValue: (max: number) => `Az érték nem lehet nagyobb mint ${max}`,
  invalidEmail: 'Érvényes email címet adj meg',
  invalidUrl: 'Érvényes URL-t adj meg',
  invalidFormula: 'A képlet szintaktikailag hibás',
  fileTooLarge: (maxMB: number) => `A fájl mérete maximum ${maxMB} MB lehet`,
  invalidFileType: 'Nem támogatott fájltípus',
  duplicateKey: 'Ez a kulcs már használatban van',
  templateNameExists: 'Ilyen nevű sablon már létezik',
} as const;

export const UI_CONFIG = {
  debounceDelay: 300, // ms
  toastDuration: 3000, // ms
  maxRecentTemplates: 5,
  paginationPageSize: 20,
  previewUpdateDelay: 500, // ms
} as const;

export const API_ENDPOINTS = {
  auth: {
    shops: '/auth/shops',
  },
  health: '/health',
};
