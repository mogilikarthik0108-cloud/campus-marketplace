import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService, wishlistService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState('0.00');
  const [total, setTotal] = useState('0.00');
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Refresh cart from server
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setItemCount(0);
      setSubtotal('0.00');
      setTotal('0.00');
      return;
    }

    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res.data.success) {
        setCartItems(res.data.items || []);
        setItemCount(res.data.itemCount || 0);
        setSubtotal(res.data.subtotal || '0.00');
        setTotal(res.data.total || '0.00');
      }
    } catch (err) {
      console.error('Refresh cart error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh wishlist product IDs
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistIds(new Set());
      return;
    }

    try {
      const res = await wishlistService.getWishlist();
      if (res.data.success) {
        const ids = new Set(res.data.items.map(item => item.product_id));
        setWishlistIds(ids);
      }
    } catch (err) {
      console.error('Refresh wishlist error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      refreshWishlist();
    } else {
      setCartItems([]);
      setItemCount(0);
      setWishlistIds(new Set());
    }
  }, [isAuthenticated, refreshCart, refreshWishlist]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your cart.');
    }
    const res = await cartService.addToCart(productId, quantity);
    await refreshCart();
    return res.data;
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const res = await cartService.updateQuantity(cartItemId, quantity);
    await refreshCart();
    return res.data;
  };

  const removeFromCart = async (cartItemId) => {
    const res = await cartService.removeFromCart(cartItemId);
    await refreshCart();
    return res.data;
  };

  const clearCart = async () => {
    const res = await cartService.clearCart();
    await refreshCart();
    return res.data;
  };

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to save items to your wishlist.');
    }
    const res = await wishlistService.toggleWishlist(productId);
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
    return res.data;
  };

  const isWishlisted = (productId) => {
    return wishlistIds.has(Number(productId));
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      itemCount,
      subtotal,
      total,
      loading,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted,
      refreshWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
