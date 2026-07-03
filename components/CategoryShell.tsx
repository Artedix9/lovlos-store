"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/components/ProductCard";

export interface CategoryTile {
  label: string;
  slug: string;
  keywords: string[];
}

interface Props {
  products: Product[];
  tiles: CategoryTile[];
}

/* TZS price bands sized for the catalog; upper bound is exclusive */
const PRICE_RANGES = [
  { label: "Under 50K", slug: "under-50", min: 0, max: 50_000 },
  { label: "50K – 100K", slug: "50-100", min: 50_000, max: 100_000 },
  { label: "100K – 150K", slug: "100-150", min: 100_000, max: 150_000 },
  { label: "Over 150K", slug: "over-150", min: 150_000, max: Number.POSITIVE_INFINITY },
];

const SORT_OPTIONS = [
  { label: "Featured", slug: "featured" },
  { label: "Price: Low to High", slug: "price-asc" },
  { label: "Price: High to Low", slug: "price-desc" },
];

export default function CategoryShell({ products, tiles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [active, setActive] = useState(searchParams.get("type") ?? "all");
  const [price, setPrice] = useState(searchParams.get("price") ?? "all");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "featured");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(searchParams.get("type") ?? "all");
    setPrice(searchParams.get("price") ?? "all");
    setSort(searchParams.get("sort") ?? "featured");
  }, [searchParams]);

  /* Single source of truth: push the full filter state into the URL,
     omitting defaults so clean pages keep clean URLs. */
  function navigate(type: string, priceSlug: string, sortSlug: string) {
    setActive(type);
    setPrice(priceSlug);
    setSort(sortSlug);
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (priceSlug !== "all") params.set("price", priceSlug);
    if (sortSlug !== "featured") params.set("sort", sortSlug);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const selectType = (slug: string) =>
    navigate(slug === active ? "all" : slug, price, sort);
  const selectPrice = (slug: string) =>
    navigate(active, slug === price ? "all" : slug, sort);
  const changeSort = (slug: string) => navigate(active, price, slug);
  const clearFilters = () => navigate("all", "all", sort);

  const allItems = useMemo(
    () => [{ label: "All", slug: "all" }, ...tiles],
    [tiles]
  );

  const activeTile = useMemo(
    () => tiles.find((t) => t.slug === active),
    [tiles, active]
  );

  const visible = useMemo(() => {
    let list = products;
    if (active !== "all" && activeTile?.keywords.length) {
      list = list.filter((p) => {
        const name = p.name.toLowerCase();
        return activeTile.keywords.some((k) => name.includes(k));
      });
    }
    if (price !== "all") {
      const range = PRICE_RANGES.find((r) => r.slug === price);
      if (range) {
        list = list.filter((p) => p.price >= range.min && p.price < range.max);
      }
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, active, activeTile, price, sort]);

  const hasFilters = active !== "all" || price !== "all";
  const heading = active === "all" ? "New Arrivals" : (activeTile?.label ?? "New Arrivals");

  return (
    <section id="products" className="anchor-target max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-20">

      {/* ── Mobile: horizontal scroll filter bars with fade hint ── */}
      <div className="md:hidden relative mb-8">
        {/* Right-edge fade indicates horizontal scroll */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
          style={{ background: "linear-gradient(to left, white, transparent)" }}
          aria-hidden="true"
        />
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-3 pr-10 scrollbar-none"
          role="group"
          aria-label="Filter by category"
        >
          {allItems.map((item) => {
            const isActive = active === item.slug;
            return (
              <button
                key={item.slug}
                aria-pressed={isActive}
                onClick={() => selectType(item.slug)}
                className={[
                  "shrink-0 text-xs tracking-widest uppercase whitespace-nowrap transition-colors duration-150 font-sans py-2 border-b",
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

        {/* Price chips */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 pr-10 scrollbar-none"
          role="group"
          aria-label="Filter by price"
        >
          <span className="shrink-0 text-[10px] tracking-widest uppercase text-chicago mr-1">
            Price
          </span>
          {PRICE_RANGES.map((range) => {
            const isActive = price === range.slug;
            return (
              <button
                key={range.slug}
                aria-pressed={isActive}
                onClick={() => selectPrice(range.slug)}
                className={[
                  "shrink-0 border px-3 py-1.5 text-[10px] tracking-widest uppercase whitespace-nowrap transition-colors duration-150",
                  isActive
                    ? "bg-primary text-white border-primary"
                    : "text-chicago border-mercury hover:border-primary hover:text-primary",
                ].join(" ")}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── md+: sidebar + grid layout ── */}
      <div className="md:grid md:grid-cols-[180px_1fr] md:gap-x-8 lg:gap-x-10">

        {/* ── Sidebar ── */}
        <aside className="hidden md:block" aria-label="Filter navigation">
          {/* Use CSS var so sticky top stays in sync with the combined header height */}
          <div className="sticky" style={{ top: "var(--shell-top)" }}>
            <p className="text-[10px] tracking-[0.2em] uppercase font-sans font-bold text-chicago mb-6">
              Shop by
            </p>

            <nav aria-label="Filter by category" className="flex flex-col gap-0">
              {allItems.map((item) => {
                const isActive = active === item.slug;
                return (
                  <button
                    key={item.slug}
                    aria-pressed={isActive}
                    onClick={() => selectType(item.slug)}
                    className={[
                      "group flex items-center gap-3 text-left py-2.5 font-sans transition-colors duration-150",
                      isActive ? "text-primary" : "text-chicago hover:text-primary",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-1 h-1 rounded-full shrink-0 transition-all duration-200",
                        isActive
                          ? "bg-primary scale-100 opacity-100"
                          : "bg-transparent scale-0 opacity-0",
                      ].join(" ")}
                      aria-hidden="true"
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

            <p className="text-[10px] tracking-[0.2em] uppercase font-sans font-bold text-chicago mt-10 mb-6">
              Price (TZS)
            </p>

            <nav aria-label="Filter by price" className="flex flex-col gap-0">
              {PRICE_RANGES.map((range) => {
                const isActive = price === range.slug;
                return (
                  <button
                    key={range.slug}
                    aria-pressed={isActive}
                    onClick={() => selectPrice(range.slug)}
                    className={[
                      "group flex items-center gap-3 text-left py-2.5 font-sans transition-colors duration-150",
                      isActive ? "text-primary" : "text-chicago hover:text-primary",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-1 h-1 rounded-full shrink-0 transition-all duration-200",
                        isActive
                          ? "bg-primary scale-100 opacity-100"
                          : "bg-transparent scale-0 opacity-0",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    <span
                      className={[
                        "text-sm tracking-widest uppercase leading-none",
                        isActive ? "font-bold" : "font-normal",
                      ].join(" ")}
                    >
                      {range.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-8 text-[11px] tracking-widest uppercase text-chicago underline underline-offset-2 hover:text-primary transition-colors duration-150"
              >
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* ── Product Grid ── */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 mb-8">
            <h2 className="heading-section">
              {heading}
            </h2>
            <div className="flex items-baseline gap-5">
              <span className="text-xs tracking-widest uppercase text-chicago" aria-live="polite">
                {visible.length} {visible.length === 1 ? "item" : "items"}
              </span>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => changeSort(e.target.value)}
                  aria-label="Sort products"
                  className="appearance-none bg-transparent text-xs tracking-widest uppercase text-primary pr-6 py-1 outline-none cursor-pointer border-b border-primary focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.slug} value={opt.slug}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-primary"
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            hasFilters && products.length > 0 ? (
              /* Filters matched nothing — offer a way back */
              <div className="flex flex-col items-center py-32 text-center">
                <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
                  No Matches.
                </p>
                <p className="mt-4 text-xs tracking-widest uppercase text-chicago">
                  Try adjusting your filters.
                </p>
                <button onClick={clearFilters} className="btn-outline mt-8">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-32 text-center">
                <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
                  Collection Arriving Soon.
                </p>
                <p className="mt-4 text-xs tracking-widest uppercase text-chicago">
                  Something great is on its way.
                </p>
              </div>
            )
          ) : (
            /* 2 cols on mobile → 3 on md → 4 on lg */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Clear filter — only shown when a filter is active */}
          {hasFilters && visible.length > 0 && (
            <div className="flex justify-center mt-14">
              <button onClick={clearFilters} className="btn-outline">
                View All Items
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
