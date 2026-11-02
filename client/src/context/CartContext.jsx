import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import cartService from '../services/cartService';
import useAuth from '../hooks/useAuth';

export const CartContext = createContext(null);

const emptyCart = { items: [], summary: {} };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartService.getCart();
      setCart({ items: data.items || [], summary: data.summary || {} });
    } catch (error) {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      const error = new Error('Please log in to add items to your cart.');
      error.code = 'AUTH_REQUIRED';
      throw error;
    }
    setMutating(true);
    try {
      const { data } = await cartService.addToCart(productId, quantity);
      setCart({ items: data.items || [], summary: data.summary || {} });
      return data;
    } finally {
      setMutating(false);
    }
  };

  const updateItem = async (itemId, quantity) => {
    setMutating(true);
    try {
      const { data } = await cartService.updateItem(itemId, quantity);
      setCart({ items: data.items || [], summary: data.summary || {} });
      return data;
    } finally {
      setMutating(false);
    }
  };

  const removeItem = async (itemId) => {
    setMutating(true);
    try {
      const { data } = await cartService.removeItem(itemId);
      setCart({ items: data.items || [], summary: data.summary || {} });
      return data;
    } finally {
      setMutating(false);
    }
  };

  const clearCart = async () => {
    await cartService.clearCart();
    setCart(emptyCart);
  };

  const itemCount = cart.summary?.itemCount || 0;
  const distinctCount = cart.items?.length || 0;
  const itemsTotal = cart.summary?.itemsTotal || 0;

  const value = useMemo(
    () => ({
      items: cart.items,
      summary: cart.summary,
      loading,
      mutating,
      itemCount,
      distinctCount,
      itemsTotal,
      refreshCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, loading, mutating, itemCount, distinctCount, itemsTotal, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
