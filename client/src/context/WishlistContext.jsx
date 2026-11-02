import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import wishlistService from '../services/wishlistService';
import useAuth from '../hooks/useAuth';

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await wishlistService.getWishlist();
      setProducts(data.products || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId) => {
    const { data } = await wishlistService.toggle(productId);
    await refreshWishlist();
    return data;
  };

  const removeFromWishlist = async (productId) => {
    await wishlistService.remove(productId);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const isWishlisted = (productId) => products.some((p) => p._id === productId);

  const value = useMemo(
    () => ({
      products,
      loading,
      count: products.length,
      refreshWishlist,
      toggleWishlist,
      removeFromWishlist,
      isWishlisted,
    }),
    [products, loading]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
