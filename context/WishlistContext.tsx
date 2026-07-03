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

const STORAGE_KEY = "lovlos-wishlist";

export interface WishlistItem {
  id: string;      // product id (slug)
  name: string;
  price: number;   // TZS
  image: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  /** Whether a product is currently saved */
  has: (id: string) => boolean;
  /** Add if missing, remove if present; returns true when the item was added */
  toggle: (item: WishlistItem) => boolean;
  remove: (id: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Restore from localStorage after mount (avoids hydration mismatch) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            (parsed as WishlistItem[]).filter(
              (i) => typeof i?.id === "string" && typeof i?.name === "string" && typeof i?.price === "number"
            )
          );
        }
      }
    } catch {
      /* corrupt or unavailable storage — start empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — wishlist still works in-memory */
    }
  }, [items, hydrated]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: WishlistItem): boolean => {
    let added = false;
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      added = true;
      return [item, ...prev];
    });
    return added;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const value = useMemo(
    () => ({ items, has, toggle, remove, count: items.length }),
    [items, has, toggle, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
