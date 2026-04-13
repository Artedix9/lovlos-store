"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;       // product id (slug)
  name: string;
  size: string;
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
  updateQuantity: (id: string, size: string, delta: number) => void;
  /** Empty the cart entirely (called on order placement) */
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((incoming: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.id === incoming.id && i.size === incoming.size
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
    (id: string, size: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((item) =>
            item.id === id && item.size === size
              ? { ...item, quantity: item.quantity + delta }
              : item
          )
          .filter((item) => item.quantity > 0)
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
      totalItems,
      subtotal,
    }),
    [items, isOpen, openCart, closeCart, addItem, clearCart, updateQuantity, totalItems, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
