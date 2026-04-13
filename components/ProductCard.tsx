"use client";

import Link from "next/link";
import Image from "next/image";

export interface Product {
  id: string;
  name: string;
  price: number;       // in TZS
  href: string;
  badge?: string;      // e.g. "New", "Best Seller"
  image?: string;      // Unsplash (or any) URL — shown when provided
  gradient?: string;   // Tailwind gradient classes — fallback when no image
}

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col">
      {/* Image area */}
      <Link href={product.href} className="relative block overflow-hidden bg-smoke aspect-[3/4]">

        {/* Photo or gradient placeholder */}
        {product.image ? (
          <Image
            src={product.image}
            alt={`LOVLOS ${product.name}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient ?? "from-smoke to-mercury"} group-hover:scale-105 transition-transform duration-700 ease-out`} />
        )}

        {/* Badge */}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-primary text-white text-[10px] tracking-widest uppercase px-2 py-1 z-10">
            {product.badge}
          </span>
        )}

        {/* Quick Add — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              /* TODO: wire to cart state */
            }}
            className="w-full bg-primary text-white text-xs tracking-widest uppercase py-3.5 hover:bg-charcoal transition-colors duration-200"
          >
            Quick Add
          </button>
        </div>
      </Link>

      {/* Details */}
      <div className="mt-3 flex flex-col gap-1">
        <Link
          href={product.href}
          className="text-sm text-primary hover:text-chicago transition-colors duration-200 leading-snug tracking-wide"
        >
          {product.name}
        </Link>
        <p className="text-sm text-chicago tracking-wide">{formatTZS(product.price)}</p>
      </div>
    </article>
  );
}
