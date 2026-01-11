/**
 * Cart Management Hook
 * Centralized cart state management with LocalStorage persistence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, CartTotals, ToastMessage } from '@/types/cart';
import {
  getCartItems,
  saveCartItems,
  clearCartStorage,
  isDuplicateItem,
} from '@/lib/cart/cartStorage';
import {
  calculateCartTotals,
  recalculateLinePrice,
  validateCartItem,
  generateCartItemId,
} from '@/lib/cart/cartUtils';

const MAX_CART_ITEMS = 50;

interface UseCartReturn {
  items: CartItem[];
  totals: CartTotals;
  isLoaded: boolean;
  addItem: (item: Omit<CartItem, 'id' | 'final_line_price'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toast: ToastMessage | null;
  clearToast: () => void;
}

/**
 * Custom hook for cart state management
 */
export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load cart items from LocalStorage on mount
  useEffect(() => {
    const loadedItems = getCartItems();
    setItems(loadedItems);
    setIsLoaded(true);
  }, []);

  // Listen for cross-tab storage changes
  useEffect(() => {
    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ items: CartItem[] }>;
      setItems(customEvent.detail.items);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Calculate totals whenever items change
  const totals = calculateCartTotals(items);

  // Show toast notification
  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    const toastId = `toast-${Date.now()}`;
    setToast({ id: toastId, message, type });

    // Auto-clear after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Clear toast manually
  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Add item to cart
  const addItem = useCallback(
    (itemData: Omit<CartItem, 'id' | 'final_line_price'>) => {
      try {
        // Validate item data
        const itemToValidate = {
          ...itemData,
          id: 'temp-id',
          final_line_price: itemData.final_price * itemData.quantity,
        };

        if (!validateCartItem(itemToValidate)) {
          showToast('Invalid item data. Please try again.', 'error');
          return;
        }

        // Check cart limit
        if (items.length >= MAX_CART_ITEMS) {
          showToast(
            `Cart limit reached (${MAX_CART_ITEMS} items maximum).`,
            'error'
          );
          return;
        }

        // Check for duplicate item (same variant + properties)
        const existingItemIndex = items.findIndex((item) =>
          isDuplicateItem(item, itemData)
        );

        let updatedItems: CartItem[];

        if (existingItemIndex !== -1) {
          // Duplicate found - increment quantity
          updatedItems = items.map((item, index) => {
            if (index === existingItemIndex) {
              const newQuantity = item.quantity + itemData.quantity;
              return recalculateLinePrice({
                ...item,
                quantity: newQuantity,
              });
            }
            return item;
          });

          showToast(`Updated quantity to ${updatedItems[existingItemIndex].quantity}`, 'success');
        } else {
          // New item - add to cart
          const newItem: CartItem = {
            id: generateCartItemId(itemData.variant_id),
            variant_id: itemData.variant_id,
            product_title: itemData.product_title,
            image: itemData.image,
            final_price: itemData.final_price,
            final_line_price: itemData.final_price * itemData.quantity,
            quantity: itemData.quantity,
            properties: itemData.properties,
          };

          updatedItems = [...items, newItem];
          showToast(`${itemData.product_title} added to cart`, 'success');
        }

        setItems(updatedItems);
        saveCartItems(updatedItems);
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        showToast('Failed to add item to cart. Please try again.', 'error');
      }
    },
    [items, showToast]
  );

  // Remove item from cart
  const removeItem = useCallback(
    (itemId: string) => {
      try {
        const itemToRemove = items.find((item) => item.id === itemId);
        const updatedItems = items.filter((item) => item.id !== itemId);

        setItems(updatedItems);
        saveCartItems(updatedItems);

        if (itemToRemove) {
          showToast(`${itemToRemove.product_title} removed from cart`, 'info');
        }
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
        showToast('Failed to remove item. Please try again.', 'error');
      }
    },
    [items, showToast]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      try {
        // Validate quantity
        if (quantity < 1) {
          showToast('Quantity must be at least 1', 'error');
          return;
        }

        if (quantity > 999) {
          showToast('Maximum quantity is 999', 'error');
          return;
        }

        const updatedItems = items.map((item) => {
          if (item.id === itemId) {
            return recalculateLinePrice({
              ...item,
              quantity,
            });
          }
          return item;
        });

        setItems(updatedItems);
        saveCartItems(updatedItems);
      } catch (error) {
        console.error('Failed to update quantity:', error);
        showToast('Failed to update quantity. Please try again.', 'error');
      }
    },
    [items, showToast]
  );

  // Clear entire cart
  const clearCart = useCallback(() => {
    try {
      setItems([]);
      clearCartStorage();
      showToast('Cart cleared', 'info');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      showToast('Failed to clear cart. Please try again.', 'error');
    }
  }, [showToast]);

  return {
    items,
    totals,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toast,
    clearToast,
  };
}
