"use client";

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { ReactNode } from "react";

/**
 * Root client-side wrapper.
 * Placed in layout.tsx so CartContext, WishlistContext, ToastContext,
 * CartDrawer, and WhatsAppButton are available on every page.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ToastProvider>
          {children}
          <CartDrawer />
          <WhatsAppButton />
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
