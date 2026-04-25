"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export interface Product {
  id: string;
  name: string;
  price: number;       // in TZS
  href: string;
  badge?: string;      // e.g. "New", "Best Seller"
  image?: string;      // URL or /public path — shown when provided
  gradient?: string;   // Tailwind gradient classes — fallback when no image
  isComingSoon?: boolean;
}

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const comingSoon = product.isComingSoon ?? false;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding || comingSoon) return;

    setAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      size: "M",
      price: product.price,
      image: product.image ?? "",
    });
    showToast(`${product.name} added to bag.`);

    setTimeout(() => setAdding(false), 1200);
  }

  const imageArea = (
    <div className="relative block overflow-hidden bg-smoke aspect-[3/4]">

      {/* Photo or gradient */}
      {product.image ? (
        <Image
          src={product.image}
          alt={`LOVLOS ${product.name}`}
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

      {/* Badge — only shown when not coming soon */}
      {product.badge && !comingSoon && (
        <span className="absolute top-3 left-3 bg-primary text-white text-[10px] tracking-widest uppercase px-2 py-1 z-10">
          {product.badge}
        </span>
      )}

      {/* Quick Add — only when not coming soon */}
      {!comingSoon && (
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

      {/* Details */}
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
      </div>
    </article>
  );
}
