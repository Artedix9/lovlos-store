"use client";

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { ReactNode } from "react";

/**
 * Root client-side wrapper.
 * Placed in layout.tsx so CartContext, CartDrawer, and WhatsAppButton
 * are available on every page.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
      <WhatsAppButton />
    </CartProvider>
  );
}
