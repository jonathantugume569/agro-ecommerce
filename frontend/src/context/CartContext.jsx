import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";

export const CartContext = createContext(null);

// Cart item shape (anyone calling addItem must pass this):
// { listingId, name, dealerName, price, stock, quantity }
const keyFor = (user) => (user ? `cart_${user.id}` : null);

function load(key) {
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = keyFor(user);
  const [items, setItems] = useState(() => load(key));

  // Switch carts when someone logs in/out.
  useEffect(() => {
    setItems(load(key));
  }, [key]);

  // Persist.
  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* storage unavailable: cart still works for this session */
    }
  }, [items, key]);

  const addItem = useCallback((item, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.listingId === item.listingId);
      const max = item.stock ?? existing?.stock ?? Infinity;
      if (existing) {
        return current.map((i) =>
          i.listingId === item.listingId
            ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, max) }
            : i
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, max) }];
    });
  }, []);

  const updateQuantity = useCallback((listingId, quantity) => {
    setItems((current) =>
      current.map((i) =>
        i.listingId === listingId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock ?? Infinity)) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((listingId) => {
    setItems((current) => current.filter((i) => i.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.quantity * Number(i.price), 0),
    }),
    [items, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
