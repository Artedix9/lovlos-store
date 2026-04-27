"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;       // in TZS
  href: string;
  badge?: string;      // e.g. "New", "Best Seller"
  image?: string;      // URL or /public path — shown when provided
  gradient?: string;   // Tailwind gradient classes — fallback when no image
  colors?: ProductColor[];
  isComingSoon?: boolean;
}

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`;
}

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
    showToast(`${product.name}${selectedColor ? ` — ${selectedColor.name}` : ""} added to bag.`);

    setTimeout(() => setAdding(false), 1200);
  }

  const imageArea = (
    <div className="relative block overflow-hidden bg-smoke aspect-[3/4]">

      {/* Photo or gradient */}
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`LOVLOS ${product.name}${selectedColor ? ` in ${selectedColor.name}` : ""}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className={[
            "object-cover object-top transition-transform duration-700 ease-out",
            comingSoon ? "" : "group-hover:scale-105",
          ].join(" ")}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient ?? "from-smoke to-mercury"} ${comingSoon ? "" : "group-hover:scale-105"} transition-transform duration-700 ease-out`} />
      )}

      {/* Coming Soon overlay — frosted glass */}
      {comingSoon && (
        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-black/40">
          <p className="text-white font-black uppercase tracking-[0.2em] text-sm">
            Coming Soon
          </p>
        </div>
      )}

      {/* Badge — suppressed in trending/label mode */}
      {product.badge && !comingSoon && !cardLabel && (
        <span className="absolute top-3 left-3 bg-primary text-white text-[10px] tracking-widest uppercase px-2 py-1 z-10">
          {product.badge}
        </span>
      )}

      {/* Quick Add — suppressed in hideQuickAdd mode or when coming soon */}
      {!comingSoon && !hideQuickAdd && (
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            className={[
              "w-full bg-primary text-white text-xs tracking-widest uppercase py-3.5 transition-all duration-200",
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
      {/* Wrap in Link only when not coming soon */}
      {comingSoon ? (
        <div className="cursor-default">{imageArea}</div>
      ) : (
        <Link href={product.href}>{imageArea}</Link>
      )}

      {/* Details — replaced by a category label in trending/label mode */}
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
              className="text-sm text-primary hover:text-chicago transition-colors duration-200 leading-snug tracking-wide"
            >
              {product.name}
            </Link>
          )}
          <p className="text-sm text-chicago tracking-wide">
            {comingSoon ? "—" : formatTZS(product.price)}
          </p>

          {/* Color swatches */}
          {!comingSoon && product.colors && product.colors.length > 1 && (
            <div className="flex gap-1.5 mt-1">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  title={color.name}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor(color);
                  }}
                  aria-label={color.name}
                  aria-pressed={selectedColor?.name === color.name}
                  className={[
                    "w-4 h-4 rounded-full border transition-all duration-150 focus:outline-none",
                    selectedColor?.name === color.name
                      ? "ring-1 ring-offset-1 ring-primary"
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
