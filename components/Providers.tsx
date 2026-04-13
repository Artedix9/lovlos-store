"use client";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { ReactNode } from "react";

/**
 * Root client-side wrapper.
 * Placed in layout.tsx so CartContext, ToastContext, CartDrawer,
 * and WhatsAppButton are available on every page.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ToastProvider>
        {children}
        <CartDrawer />
        <WhatsAppButton />
      </ToastProvider>
    </CartProvider>
  );
}
