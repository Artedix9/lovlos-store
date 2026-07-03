"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

const STORAGE_KEY = "lovlos-cart";

export interface CartItem {
  id: string;       // product id (slug)
  name: string;
  size: string;
  color?: string;   // e.g. "Onyx"
  price: number;    // TZS
  quantity: number;
  image: string;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Add one unit of an item; merges if same id+size already exists */
  addItem: (item: Omit<CartItem, "quantity">) => void;
  /** Apply +1 / -1 delta; removes item when quantity reaches 0 */
  updateQuantity: (id: string, size: string, color: string | undefined, delta: number) => void;
  /** Remove a line item entirely regardless of quantity */
  removeItem: (id: string, size: string, color: string | undefined) => void;
  /** Empty the cart entirely (called on order placement) */
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* Restore the bag from localStorage after mount (avoids hydration mismatch) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
      }
    } catch {
      /* corrupt or unavailable storage — start with an empty bag */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — cart still works in-memory */
    }
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((incoming: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.id === incoming.id && i.size === incoming.size && i.color === incoming.color
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { ...incoming, quantity: 1 }];
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const updateQuantity = useCallback(
    (id: string, size: string, color: string | undefined, delta: number) => {
      setItems((prev) =>
        prev
          .map((item) =>
            item.id === id && item.size === size && item.color === color
              ? { ...item, quantity: item.quantity + delta }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
    },
    []
  );

  const removeItem = useCallback(
    (id: string, size: string, color: string | undefined) => {
      setItems((prev) =>
        prev.filter(
          (item) => !(item.id === id && item.size === size && item.color === color)
        )
      );
    },
    []
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      clearCart,
      updateQuantity,
      removeItem,
      totalItems,
      subtotal,
    }),
    [items, isOpen, openCart, closeCart, addItem, clearCart, updateQuantity, removeItem, totalItems, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
