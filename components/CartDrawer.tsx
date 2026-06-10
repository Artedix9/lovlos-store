"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatTZS } from "@/lib/products";

const TRANSITION_MS = 300;

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, totalItems, subtotal } =
    useCart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setMounted(true);
    } else {
      timer = setTimeout(() => setMounted(false), TRANSITION_MS);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* ── Overlay ── */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        className={[
          "fixed inset-0 z-[90] bg-black/60 transition-opacity",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* ── Drawer panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        className={[
          "fixed right-0 top-0 h-full w-[92vw] sm:max-w-[420px] z-[100]",
          "bg-primary border-l border-white/[0.08]",
          "shadow-[-2px_0_20px_rgba(0,0,0,0.45)]",
          "flex flex-col transition-transform ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xs font-bold tracking-ultra uppercase text-white">
              Your Bag
            </h2>
            {totalItems > 0 && (
              <span className="text-xs text-white/40 tracking-widest">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="text-white/40 hover:text-white transition-colors duration-200 p-1 -mr-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Items list ── */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-black uppercase tracking-widest text-white">
                  Your bag is empty.
                </p>
                <p className="text-xs font-light tracking-ultra uppercase text-white/40">
                  Own your vibe.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="text-xs tracking-widest uppercase bg-white text-primary px-8 py-3 hover:bg-smoke transition-colors duration-200 font-bold"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06] px-6">
              {items.map((item) => (
                <li key={`${item.id}-${item.size}-${item.color ?? ""}`} className="flex gap-4 py-5">
                  {/* Thumbnail */}
                  <div className="relative w-[72px] h-[90px] shrink-0 bg-white/10 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="72px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-white/5" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tight text-white leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] tracking-widest uppercase text-white/40 mt-0.5">
                        Size: {item.size}
                      </p>
                      {item.color && (
                        <p className="text-[10px] tracking-widest uppercase text-white/40 mt-0.5">
                          Colour: {item.color}
                        </p>
                      )}
                      <p className="text-xs text-white/70 mt-1 tracking-wide">
                        {formatTZS(item.price)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center mt-2 border border-white/10 w-fit">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.id, item.size, item.color, -1)}
                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors duration-150 text-base leading-none focus-visible:outline-none focus-visible:bg-white/10"
                      >
                        −
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-xs text-white font-bold border-x border-white/10">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.id, item.size, item.color, +1)}
                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors duration-150 text-base leading-none focus-visible:outline-none focus-visible:bg-white/10"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <p className="text-xs text-white/70 tracking-wide shrink-0 pt-0.5">
                    {formatTZS(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-white/[0.08] px-6 py-6 space-y-5 bg-primary">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-ultra text-white/50">
                Subtotal
              </span>
              <span className="text-base font-bold text-white tracking-tight">
                {formatTZS(subtotal)}
              </span>
            </div>

            <p className="text-[10px] tracking-widest uppercase text-white/30">
              Shipping &amp; taxes calculated at checkout
            </p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-white text-primary text-xs font-bold tracking-ultra uppercase py-4 text-center hover:bg-smoke transition-colors duration-200"
            >
              Proceed to Checkout →
            </Link>

            <button
              onClick={closeCart}
              className="block w-full text-center text-[10px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors duration-200 pt-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
