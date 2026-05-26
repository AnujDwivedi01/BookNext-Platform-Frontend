import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const [cart,    setCart]    = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ user.id is now reliably set from login response (userId from DB)
  const getUserId = () => user?.id ?? null;

  // Fetch cart whenever user changes (login/logout)
  const fetchCart = useCallback(async () => {
    const userId = getUserId();
    if (!isLoggedIn() || !userId) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await cartAPI.getCart(userId);
      setCart(res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);   // re-run when user object changes

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ─── ADD ITEM ─────────────────────────────────────────────────────────────
  // book object must have: id, title, author, price
  const addItem = async (book, quantity = 1) => {
    const userId = getUserId();
    if (!isLoggedIn() || !userId) throw new Error('Please login to add items');

    // ✅ payload matches AddItemRequest exactly (bookId, bookTitle, bookAuthor, price, quantity)
    const payload = {
      bookId:     book.id,
      bookTitle:  book.title,
      bookAuthor: book.author ?? '',   // ✅ was missing before
      price:      book.price,
      quantity,
    };
    const res = await cartAPI.addItem(userId, payload);
    setCart(res.data);
    return res.data;
  };

  // ─── REMOVE ITEM ──────────────────────────────────────────────────────────
  const removeItem = async (itemId) => {
    const userId = getUserId();
    if (!userId) return;
    const res = await cartAPI.removeItem(userId, itemId);
    setCart(res.data);
    return res.data;
  };

  // ─── UPDATE QUANTITY ──────────────────────────────────────────────────────
  const updateQuantity = async (itemId, quantity) => {
    const userId = getUserId();
    if (!userId) return;
    const res = await cartAPI.updateQuantity(userId, itemId, { quantity });
    setCart(res.data);
    return res.data;
  };

  // ─── CLEAR CART ───────────────────────────────────────────────────────────
  const clearCart = async () => {
    const userId = getUserId();
    if (!userId) return;
    const res = await cartAPI.clearCart(userId);
    setCart(res.data);
    return res.data;
  };

  // ─── DERIVED STATE ────────────────────────────────────────────────────────
  const totalItems = cart?.totalItems ?? 0;
  const totalPrice = cart?.totalPrice ?? 0;
  const cartItems  = cart?.items      ?? [];
  const isInCart   = (bookId) => cartItems.some(item => item.bookId === bookId);

  return (
    <CartContext.Provider value={{
      cart, loading, cartItems, totalItems, totalPrice,
      addItem, removeItem, updateQuantity, clearCart, fetchCart, isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);