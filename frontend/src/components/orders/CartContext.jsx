import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getListing } from "../api/productsApi";
import useAuth from "../hooks/useAuth";
import { listingToCartItem } from "../utils/orderHelpers";

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

  // Re-read every listing in the cart so prices and stock are current.
  // Items whose listing is hidden or sold out are flagged `unavailable`.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refreshCart = useCallback(async () => {
    const current = itemsRef.current;
    if (current.length === 0) return;

    const results = await Promise.allSettled(current.map((i) => getListing(i.listingId)));
    const patches = new Map();
    let priceChanged = false;

    results.forEach((result, index) => {
      const item = current[index];
      if (result.status === "rejected") {
        // 404 means the dealer hid it. Any other error (e.g. offline): keep the item as is.
        if (result.reason?.response?.status === 404) {
          patches.set(item.listingId, { unavailable: true });
        }
        return;
      }
      const listing = result.value;
      const fresh = listingToCartItem(listing);
      if (fresh.price !== Number(item.price)) priceChanged = true;
      patches.set(item.listingId, {
        ...fresh,
        unavailable: !listing.is_active || listing.stock < 1,
      });
    });

    setItems((latest) =>
      latest.map((i) => {
        const patch = patches.get(i.listingId);
        if (!patch) return i;
        const stock = patch.stock ?? i.stock;
        const quantity = patch.unavailable ? i.quantity : Math.max(1, Math.min(i.quantity, stock));
        return { ...i, ...patch, quantity };
      })
    );
    if (priceChanged) toast.info("Some prices in your cart have changed.");
  }, []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
      hasUnavailable: items.some((i) => i.unavailable),
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      // Unavailable items can't be ordered, so they are left out of the total.
      totalPrice: items
        .filter((i) => !i.unavailable)
        .reduce((sum, i) => sum + i.quantity * Number(i.price), 0),
    }),
    [items, addItem, updateQuantity, removeItem, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
