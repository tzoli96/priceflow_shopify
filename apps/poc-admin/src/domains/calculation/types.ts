export interface CalculationLog {
  id: string;
  productId: string;
  productTitle: string;
  templateId: string;
  templateName: string;
  originalPrice: number;
  calculatedPrice: number;
  formula: string;
  variables: Record<string, any>;
  executedAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
}
