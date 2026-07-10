"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatTZS, effectivePrice } from "@/lib/products";
import WishlistButton from "@/components/WishlistButton";

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  href: string;
  badge?: string;
  image?: string;
  gradient?: string;
  colors?: ProductColor[];
  sizes?: string[];
  isComingSoon?: boolean;
  stock?: number;
  preorder?: boolean;
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
  const [added, setAdded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const comingSoon = product.isComingSoon ?? false;
  const preorderable = comingSoon && (product.preorder ?? false);
  /* a "teaser" is coming-soon without pre-orders — visible but not buyable */
  const teaser = comingSoon && !preorderable;
  /* undefined stock (e.g. bundled fallback data) means "don't gate" */
  const soldOut = !comingSoon && product.stock !== undefined && product.stock <= 0;
  const price = effectivePrice(product);
  const onSale = price < product.price;

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    product.colors?.[0] ?? null
  );

  const imageSrc = selectedColor?.image ?? product.image;

  /* Single-size products add instantly; sized products open a size picker
     so the customer always chooses — never a silent default. */
  const isOneSize = !product.sizes || product.sizes.length <= 1;

  function quickAdd(size: string) {
    addItem({
      id: product.id,
      name: product.name,
      size,
      color: selectedColor?.name,
      price,
      image: imageSrc ?? "",
      maxStock: preorderable ? undefined : product.stock,
      preorder: preorderable || undefined,
    });
    showToast(
      `${product.name}${selectedColor ? ` — ${selectedColor.name}` : ""} added to bag.`
    );
    setPickerOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (added || teaser || soldOut) return;
    if (isOneSize) {
      quickAdd(product.sizes?.[0] ?? "One Size");
    } else {
      setPickerOpen((v) => !v);
    }
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
            teaser ? "" : "group-hover:scale-105",
          ].join(" ")}
        />
      ) : (
        <div
          className={[
            `absolute inset-0 bg-gradient-to-br ${product.gradient ?? "from-smoke to-mercury"}`,
            teaser ? "" : "group-hover:scale-105",
            "transition-transform duration-700 ease-out",
          ].join(" ")}
        />
      )}

      {/* Coming Soon overlay — teasers only; pre-order cards stay shoppable */}
      {teaser && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/70">
          <p className="text-white font-bold uppercase tracking-[0.25em] text-xs">
            Coming Soon
          </p>
        </div>
      )}

      {/* Wishlist heart */}
      {!teaser && !cardLabel && (
        <WishlistButton
          item={{
            id: product.id,
            name: product.name,
            price,
            image: imageSrc ?? "",
          }}
        />
      )}

      {/* Sold Out label — card stays clickable so shoppers can join the waitlist */}
      {soldOut && !cardLabel && (
        <span className="absolute top-3 left-3 bg-white/90 text-primary text-[9px] tracking-widest uppercase px-2 py-1 z-10 font-bold">
          Sold Out
        </span>
      )}

      {/* Badge — an explicit badge wins; otherwise sale products get a Sale tag */}
      {product.badge && !teaser && !soldOut && !cardLabel && (
        <span className="absolute top-3 left-3 bg-primary text-white text-[9px] tracking-widest uppercase px-2 py-1 z-10 font-bold">
          {product.badge}
        </span>
      )}
      {!product.badge && !preorderable && onSale && !teaser && !soldOut && !cardLabel && (
        <span className="absolute top-3 left-3 bg-error text-white text-[9px] tracking-widest uppercase px-2 py-1 z-10 font-bold">
          Sale
        </span>
      )}
      {!product.badge && preorderable && !cardLabel && (
        <span className="absolute top-3 left-3 bg-primary text-white text-[9px] tracking-widest uppercase px-2 py-1 z-10 font-bold">
          Pre-Order
        </span>
      )}

      {/* Quick Add — slides up on hover (desktop), always visible on touch */}
      {!teaser && !soldOut && !hideQuickAdd && (
        <div
          className={[
            "absolute bottom-0 left-0 right-0 z-10",
            "transition-transform duration-300 ease-out",
            /* hover devices: hidden until hover (unless the picker is open);
               touch devices: always visible */
            pickerOpen ? "" : "[@media(hover:hover)]:translate-y-full",
            "[@media(hover:hover)]:group-hover:translate-y-0",
          ].join(" ")}
        >
          {pickerOpen && !isOneSize ? (
            /* Size picker — tap a size to add it */
            <div
              className="bg-primary px-2 pt-2.5 pb-2"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onKeyDown={(e) => { if (e.key === "Escape") setPickerOpen(false); }}
            >
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[9px] tracking-widest uppercase text-white/60">
                  Select Size
                </p>
                <button
                  onClick={() => setPickerOpen(false)}
                  aria-label="Close size picker"
                  className="text-white/60 hover:text-white transition-colors duration-150 p-1 -m-1 leading-none"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-1" role="group" aria-label={`Select size for ${product.name}`}>
                {product.sizes!.map((size) => (
                  <button
                    key={size}
                    onClick={() => quickAdd(size)}
                    aria-label={`Add ${product.name} to bag, size ${size}`}
                    className="flex-1 min-w-0 h-9 text-[10px] tracking-wider uppercase text-white border border-white/25 hover:bg-white hover:text-primary focus-visible:bg-white focus-visible:text-primary focus-visible:outline-none transition-colors duration-150"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={added}
              aria-expanded={isOneSize ? undefined : pickerOpen}
              aria-label={
                isOneSize
                  ? `Quick add ${product.name} to bag`
                  : `Quick add ${product.name} to bag — choose a size`
              }
              className={[
                "w-full bg-primary text-white text-[10px] tracking-widest uppercase py-3.5 transition-all duration-200",
                added ? "cursor-default" : "hover:bg-charcoal",
              ].join(" ")}
            >
              {added ? "Added to Bag ✓" : preorderable ? "Pre-Order" : "Quick Add"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <article
      className="group flex flex-col"
      onMouseLeave={() => setPickerOpen(false)}
    >
      {teaser ? (
        <div className="cursor-default">{imageArea}</div>
      ) : (
        <Link href={product.href}>{imageArea}</Link>
      )}

      {cardLabel ? (
        <p className="mt-8 text-xl font-bold uppercase tracking-wide text-center text-primary">
          {cardLabel}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {teaser ? (
            <p className="text-sm text-chicago leading-snug tracking-wide">{product.name}</p>
          ) : (
            <Link
              href={product.href}
              className="text-sm text-primary hover:text-chicago transition-colors duration-200 leading-snug tracking-wide focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-2"
            >
              {product.name}
            </Link>
          )}
          {teaser ? (
            <p className="text-sm text-chicago tracking-wide">—</p>
          ) : onSale ? (
            <p className="text-sm tracking-wide">
              <span className="text-error">{formatTZS(price)}</span>
              <span className="text-chicago line-through ml-2">{formatTZS(product.price)}</span>
            </p>
          ) : (
            <p className="text-sm text-chicago tracking-wide">{formatTZS(product.price)}</p>
          )}

          {/* Color swatches */}
          {!teaser && product.colors && product.colors.length > 1 && (
            <div className="flex gap-1 mt-1" role="group" aria-label="Colour options">
              {product.colors.map((color) => (
                /* Outer button provides a ≥24px hit area (WCAG 2.5.8);
                   the inner dot keeps the compact visual. */
                <button
                  key={color.name}
                  title={color.name}
                  onClick={(e) => { e.preventDefault(); setSelectedColor(color); }}
                  aria-label={`${color.name}${selectedColor?.name === color.name ? " (selected)" : ""}`}
                  aria-pressed={selectedColor?.name === color.name}
                  className="w-6 h-6 flex items-center justify-center group/swatch focus-visible:outline-none"
                >
                  <span
                    className={[
                      "w-4 h-4 rounded-full transition-all duration-150",
                      selectedColor?.name === color.name
                        ? "ring-1 ring-offset-1 ring-primary"
                        : "group-hover/swatch:ring-1 group-hover/swatch:ring-offset-1 group-hover/swatch:ring-chicago group-focus-visible/swatch:ring-2 group-focus-visible/swatch:ring-offset-1 group-focus-visible/swatch:ring-primary",
                    ].join(" ")}
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
