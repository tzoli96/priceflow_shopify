/**
 * useSession Hook
 *
 * React hook for SessionStorage-based Draft Order session management
 * Based on Segment 3: Checkout Flow & Multi-Product Cart PRD
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DraftOrderSession,
  CartStatus,
  DraftOrderLineItem,
} from '@/types/draft-order';

const SESSION_STORAGE_KEY = 'priceflow_draft_order_session';
const SESSION_EXPIRATION_HOURS = 24;

interface UseSessionReturn {
  // State
  session: DraftOrderSession | null;
  cartStatus: CartStatus;
  isExpired: boolean;

  // Actions
  saveSession: (session: DraftOrderSession) => void;
  clearSession: () => void;
  addLineItem: (lineItem: DraftOrderLineItem) => void;
  removeLineItem: (variantId: string) => void;
  updateInvoiceUrl: (invoiceUrl: string) => void;

  // Utils
  hasActiveSession: boolean;
  itemCount: number;
}

/**
 * Hook for managing Draft Order session in SessionStorage
 *
 * @returns Session state and actions
 *
 * @example
 * ```tsx
 * const {
 *   session,
 *   cartStatus,
 *   saveSession,
 *   addLineItem,
 *   clearSession,
 *   hasActiveSession,
 * } = useSession();
 *
 * // Save new session
 * saveSession({
 *   draftOrderId: '123',
 *   invoiceUrl: 'https://...',
 *   lineItems: [...],
 *   subtotalPrice: '100.00',
 *   totalPrice: '100.00',
 *   createdAt: new Date().toISOString(),
 *   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
 * });
 *
 * // Add item to existing session
 * addLineItem({
 *   variantId: '456',
 *   quantity: 1,
 *   originalPrice: '50.00',
 *   customPrice: '100.00',
 * });
 *
 * // Clear session
 * clearSession();
 * ```
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<DraftOrderSession | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  /**
   * Load session from SessionStorage on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadSession = () => {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) {
          setSession(null);
          return;
        }

        const parsed = JSON.parse(stored) as DraftOrderSession;

        // Check expiration
        const expiresAt = new Date(parsed.expiresAt);
        const now = new Date();

        if (now > expiresAt) {
          // Session expired, clear it
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          setSession(null);
          setIsExpired(true);
        } else {
          setSession(parsed);
          setIsExpired(false);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
      }
    };

    loadSession();
  }, []);

  /**
   * Save session to SessionStorage
   */
  const saveSession = useCallback((newSession: DraftOrderSession) => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setIsExpired(false);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  /**
   * Clear session from SessionStorage
   */
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
      setIsExpired(false);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  /**
   * Add line item to existing session
   */
  const addLineItem = useCallback(
    (lineItem: DraftOrderLineItem) => {
      if (!session) {
        console.warn('No active session to add item to');
        return;
      }

      const updatedSession: DraftOrderSession = {
        ...session,
        lineItems: [...session.lineItems, lineItem],
        // Note: subtotalPrice and totalPrice should be recalculated by backend
        // This is just for UI display
      };

      saveSession(updatedSession);
    },
    [session, saveSession]
  );

  /**
   * Remove line item from session
   */
  const removeLineItem = useCallback(
    (variantId: string) => {
      if (!session) return;

      const updatedSession: DraftOrderSession = {
        ...session,
        lineItems: session.lineItems.filter((item) => item.variantId !== variantId),
      };

      saveSession(updatedSession);
    },
    [session, saveSession]
  );

  /**
   * Update invoice URL (after backend update)
   */
  const updateInvoiceUrl = useCallback(
    (invoiceUrl: string) => {
      if (!session) return;

      const updatedSession: DraftOrderSession = {
        ...session,
        invoiceUrl,
      };

      saveSession(updatedSession);
    },
    [session, saveSession]
  );

  /**
   * Compute cart status
   */
  const cartStatus: CartStatus = {
    hasActiveSession: !!session && !isExpired,
    itemCount: session?.lineItems.length ?? 0,
    totalPrice: session?.totalPrice ?? '0.00',
    expiresAt: session?.expiresAt,
    draftOrderId: session?.draftOrderId,
  };

  /**
   * Derived values
   */
  const hasActiveSession = !!session && !isExpired;
  const itemCount = session?.lineItems.length ?? 0;

  return {
    // State
    session,
    cartStatus,
    isExpired,

    // Actions
    saveSession,
    clearSession,
    addLineItem,
    removeLineItem,
    updateInvoiceUrl,

    // Utils
    hasActiveSession,
    itemCount,
  };
}

/**
 * Utility function to create a new session
 *
 * @param draftOrderId - Draft Order ID
 * @param invoiceUrl - Checkout URL
 * @param lineItems - Line items
 * @param subtotalPrice - Subtotal
 * @param totalPrice - Total
 * @returns New session object
 */
export function createSession(
  draftOrderId: string,
  invoiceUrl: string,
  lineItems: DraftOrderLineItem[],
  subtotalPrice: string,
  totalPrice: string
): DraftOrderSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRATION_HOURS * 60 * 60 * 1000);

  return {
    draftOrderId,
    invoiceUrl,
    lineItems,
    subtotalPrice,
    totalPrice,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
