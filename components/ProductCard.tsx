"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatTZS } from "@/lib/products";

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  href: string;
  badge?: string;
  image?: string;
  gradient?: string;
  colors?: ProductColor[];
  isComingSoon?: boolean;
}

/* Tiny 1×1 smoke-colored blur placeholder so images fade in instead of popping */
const BLUR_DATA =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg==";

export default function ProductCard({
  product,
  cardLabel,
  hideQuickAdd = false,
}: {
  product: Product;
  cardLabel?: string;
  hideQuickAdd?: boolean;
}) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const comingSoon = product.isComingSoon ?? false;

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    product.colors?.[0] ?? null
  );

  const imageSrc = selectedColor?.image ?? product.image;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding || comingSoon) return;

    setAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      size: "M",
      color: selectedColor?.name,
      price: product.price,
      image: imageSrc ?? "",
    });
    showToast(
      `${product.name}${selectedColor ? ` — ${selectedColor.name}` : ""} added to bag.`
    );
    setTimeout(() => setAdding(false), 1200);
  }

  const imageArea = (
    <div className="relative block overflow-hidden bg-smoke aspect-[3/4]">

      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`LOVLOS ${product.name}${selectedColor ? ` in ${selectedColor.name}` : ""}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA}
          className={[
            "object-cover object-top transition-transform duration-700 ease-out",
            comingSoon ? "" : "group-hover:scale-105",
          ].join(" ")}
        />
      ) : (
        <div
          className={[
            `absolute inset-0 bg-gradient-to-br ${product.gradient ?? "from-smoke to-mercury"}`,
            comingSoon ? "" : "group-hover:scale-105",
            "transition-transform duration-700 ease-out",
          ].join(" ")}
        />
      )}

      {/* Coming Soon overlay */}
      {comingSoon && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/70">
          <p className="text-white font-bold uppercase tracking-[0.25em] text-xs">
            Coming Soon
          </p>
        </div>
      )}

      {/* Badge */}
      {product.badge && !comingSoon && !cardLabel && (
        <span className="absolute top-3 left-3 bg-primary text-white text-[9px] tracking-widest uppercase px-2 py-1 z-10 font-bold">
          {product.badge}
        </span>
      )}

      {/* Quick Add — slides up on hover (desktop), always visible on touch */}
      {!comingSoon && !hideQuickAdd && (
        <div
          className={[
            "absolute bottom-0 left-0 right-0 z-10",
            "transition-transform duration-300 ease-out",
            /* hover devices: hidden until hover; touch devices: always visible */
            "[@media(hover:hover)]:translate-y-full",
            "[@media(hover:hover)]:group-hover:translate-y-0",
          ].join(" ")}
        >
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            aria-label={`Quick add ${product.name} to bag`}
            className={[
              "w-full bg-primary text-white text-[10px] tracking-widest uppercase py-3.5 transition-all duration-200",
              adding ? "opacity-50 cursor-default" : "hover:bg-charcoal",
            ].join(" ")}
          >
            {adding ? "Adding…" : "Quick Add"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <article className="group flex flex-col">
      {comingSoon ? (
        <div className="cursor-default">{imageArea}</div>
      ) : (
        <Link href={product.href} tabIndex={0}>{imageArea}</Link>
      )}

      {cardLabel ? (
        <p className="mt-8 text-xl font-bold uppercase tracking-wide text-center text-primary">
          {cardLabel}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {comingSoon ? (
            <p className="text-sm text-chicago leading-snug tracking-wide">{product.name}</p>
          ) : (
            <Link
              href={product.href}
              className="text-sm text-primary hover:text-chicago transition-colors duration-200 leading-snug tracking-wide focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-2"
            >
              {product.name}
            </Link>
          )}
          <p className="text-sm text-chicago tracking-wide">
            {comingSoon ? "—" : formatTZS(product.price)}
          </p>

          {/* Color swatches */}
          {!comingSoon && product.colors && product.colors.length > 1 && (
            <div className="flex gap-1.5 mt-1" role="group" aria-label="Colour options">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  title={color.name}
                  onClick={(e) => { e.preventDefault(); setSelectedColor(color); }}
                  aria-label={`${color.name}${selectedColor?.name === color.name ? " (selected)" : ""}`}
                  aria-pressed={selectedColor?.name === color.name}
                  className={[
                    "w-4 h-4 rounded-full border transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary",
                    selectedColor?.name === color.name
                      ? "ring-1 ring-offset-1 ring-primary border-transparent"
                      : "border-transparent hover:ring-1 hover:ring-offset-1 hover:ring-chicago",
                  ].join(" ")}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
