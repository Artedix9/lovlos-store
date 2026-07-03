"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatTZS } from "@/lib/products";
import { getRecentlyViewed, type RecentItem } from "@/lib/recentlyViewed";

/** Horizontal strip of recently viewed products. Renders nothing until
    localStorage is read on the client, and nothing at all when empty. */
export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((i) => i.id !== excludeId));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Recently viewed products"
      className="max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-16 py-14 md:py-16 border-t border-mercury"
    >
      <h2 className="heading-section mb-8">Recently Viewed</h2>
      <div className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-none pb-2 snap-x">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="group shrink-0 w-[40vw] max-w-[200px] snap-start"
          >
            <div className="relative aspect-[3/4] bg-smoke overflow-hidden">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 40vw, 200px"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}
            </div>
            <p className="mt-2.5 text-sm text-primary group-hover:text-chicago transition-colors duration-200 leading-snug tracking-wide truncate">
              {item.name}
            </p>
            <p className="text-sm text-chicago tracking-wide">{formatTZS(item.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
