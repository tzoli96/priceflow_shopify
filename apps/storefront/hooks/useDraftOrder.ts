/**
 * useDraftOrder Hook
 *
 * React hook for Draft Order API operations
 * Based on Segment 1: Widget/Extension Modification PRD
 */

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  CreateDraftOrderRequest,
  DraftOrderResponse,
  AddItemToDraftOrderRequest,
  DraftOrderError,
} from '@/types/draft-order';

interface UseDraftOrderOptions {
  onSuccess?: (draftOrder: DraftOrderResponse) => void;
  onError?: (error: DraftOrderError | Error) => void;
}

interface UseDraftOrderReturn {
  // State
  loading: boolean;
  error: DraftOrderError | Error | null;
  draftOrder: DraftOrderResponse | null;

  // Actions
  createDraftOrder: (data: CreateDraftOrderRequest) => Promise<DraftOrderResponse | null>;
  addItem: (draftOrderId: string, data: AddItemToDraftOrderRequest) => Promise<DraftOrderResponse | null>;
  getDraftOrder: (draftOrderId: string) => Promise<DraftOrderResponse | null>;
  deleteDraftOrder: (draftOrderId: string) => Promise<boolean>;
  completeDraftOrder: (draftOrderId: string) => Promise<DraftOrderResponse | null>;

  // Utils
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for Draft Order operations
 *
 * @param options - Success/error callbacks
 * @returns Draft Order state and actions
 *
 * @example
 * ```tsx
 * const { createDraftOrder, loading, error } = useDraftOrder({
 *   onSuccess: (draftOrder) => {
 *     console.log('Created:', draftOrder.invoiceUrl);
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error.message);
 *   },
 * });
 *
 * const handleAddToCart = async () => {
 *   await createDraftOrder({
 *     shopDomain: 'test.myshopify.com',
 *     lineItems: [{ variantId: '123', quantity: 1, ... }],
 *   });
 * };
 * ```
 */
export function useDraftOrder(options?: UseDraftOrderOptions): UseDraftOrderReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DraftOrderError | Error | null>(null);
  const [draftOrder, setDraftOrder] = useState<DraftOrderResponse | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setDraftOrder(null);
  }, []);

  /**
   * Create a new Draft Order
   */
  const createDraftOrder = useCallback(
    async (data: CreateDraftOrderRequest): Promise<DraftOrderResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.draftOrders.create(data);
        setDraftOrder(result);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err as DraftOrderError | Error;
        setError(error);

        if (options?.onError) {
          options.onError(error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Add item to existing Draft Order
   */
  const addItem = useCallback(
    async (
      draftOrderId: string,
      data: AddItemToDraftOrderRequest
    ): Promise<DraftOrderResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.draftOrders.addItem(draftOrderId, data);
        setDraftOrder(result);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err as DraftOrderError | Error;
        setError(error);

        if (options?.onError) {
          options.onError(error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Get Draft Order by ID
   */
  const getDraftOrder = useCallback(
    async (draftOrderId: string): Promise<DraftOrderResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.draftOrders.get(draftOrderId);
        setDraftOrder(result);
        return result;
      } catch (err) {
        const error = err as DraftOrderError | Error;
        setError(error);

        if (options?.onError) {
          options.onError(error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Delete Draft Order
   */
  const deleteDraftOrder = useCallback(
    async (draftOrderId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await api.draftOrders.delete(draftOrderId);
        setDraftOrder(null);
        return true;
      } catch (err) {
        const error = err as DraftOrderError | Error;
        setError(error);

        if (options?.onError) {
          options.onError(error);
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Complete Draft Order
   */
  const completeDraftOrder = useCallback(
    async (draftOrderId: string): Promise<DraftOrderResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.draftOrders.complete(draftOrderId);
        setDraftOrder(result);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err as DraftOrderError | Error;
        setError(error);

        if (options?.onError) {
          options.onError(error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    // State
    loading,
    error,
    draftOrder,

    // Actions
    createDraftOrder,
    addItem,
    getDraftOrder,
    deleteDraftOrder,
    completeDraftOrder,

    // Utils
    clearError,
    reset,
  };
}
