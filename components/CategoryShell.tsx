"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/components/ProductCard";

export interface CategoryTile {
  label: string;
  slug: string;
  keywords: string[];
  image?: string;
  gradient?: string;
  overlayClass?: string;
}

interface Props {
  products: Product[];
  tiles: CategoryTile[];
}

export default function CategoryShell({ products, tiles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [active, setActive] = useState(searchParams.get("type") ?? "all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(searchParams.get("type") ?? "all");
  }, [searchParams]);

  function select(slug: string) {
    const next = slug === active ? "all" : slug;
    setActive(next);
    const url = next === "all" ? pathname : `${pathname}?type=${next}`;
    router.replace(url, { scroll: false });
  }

  const activeTile = tiles.find((t) => t.slug === active);

  const visible =
    active === "all"
      ? products
      : products.filter((p) => {
          if (!activeTile?.keywords.length) return true;
          const name = p.name.toLowerCase();
          return activeTile.keywords.some((k) => name.includes(k));
        });

  const heading = active === "all" ? "New Arrivals" : (activeTile?.label ?? "New Arrivals");

  const allItems = [{ label: "All", slug: "all" }, ...tiles];

  return (
    <section id="products" className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-20">
      {/* ── Mobile: horizontal scroll filter bar ── */}
      <div
        ref={scrollRef}
        className="md:hidden flex gap-6 overflow-x-auto pb-4 mb-8 scrollbar-none"
      >
        {allItems.map((item) => {
          const isActive = active === item.slug;
          return (
            <button
              key={item.slug}
              onClick={() => select(item.slug)}
              className={[
                "shrink-0 text-xs tracking-widest uppercase whitespace-nowrap transition-colors duration-150 font-sans pb-1 border-b",
                isActive
                  ? "text-primary border-primary font-semibold"
                  : "text-chicago border-transparent hover:text-primary",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ── md+: sidebar + grid layout ── */}
      <div className="md:grid md:grid-cols-[180px_1fr] md:gap-x-8 lg:gap-x-10">

        {/* ── Sidebar ── */}
        <aside className="hidden md:block">
          <div className="sticky top-32">
            <p className="text-[10px] tracking-[0.2em] uppercase font-sans font-bold text-chicago mb-6">
              Shop by
            </p>

            <nav className="flex flex-col gap-0">
              {allItems.map((item) => {
                const isActive = active === item.slug;
                return (
                  <button
                    key={item.slug}
                    onClick={() => select(item.slug)}
                    className={[
                      "group flex items-center gap-3 text-left py-2.5 font-sans transition-colors duration-150 focus:outline-none",
                      isActive ? "text-primary" : "text-chicago hover:text-primary",
                    ].join(" ")}
                  >
                    {/* Active dot indicator */}
                    <span
                      className={[
                        "w-1 h-1 rounded-full shrink-0 transition-all duration-200",
                        isActive
                          ? "bg-primary scale-100 opacity-100"
                          : "bg-transparent scale-0 opacity-0",
                      ].join(" ")}
                    />

                    <span
                      className={[
                        "text-sm tracking-widest uppercase leading-none",
                        isActive ? "font-bold" : "font-normal",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Product Grid ── */}
        <div>
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
              {heading}
            </h2>
            <span className="text-xs tracking-widest uppercase text-chicago">
              {visible.length} items
            </span>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center py-32 text-center">
              <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
                Collection Arriving Soon.
              </p>
              <p className="mt-4 text-xs tracking-widest uppercase text-chicago">
                Something great is on its way.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {visible.length > 0 && (
            <div className="flex justify-center mt-14">
              <button className="btn-outline">
                {heading === "New Arrivals" ? "View All" : `View All ${heading}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
