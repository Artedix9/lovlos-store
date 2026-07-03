import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryShell from "@/components/CategoryShell";
import type { CategoryTile } from "@/components/CategoryShell";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { getProducts } from "@/lib/data";
import { getHeroImages } from "@/lib/hero";
import type { Product } from "@/components/ProductCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Men — LOVLOS",
  description: "Explore the LOVLOS men's collection. Clean, minimal essentials built for modern life.",
};

const TILES: CategoryTile[] = [
  { label: "Tops", slug: "tops", keywords: ["tee", "polo", "shirt", "hoodie", "crewneck", "sweatshirt"] },
  { label: "Bottoms", slug: "bottoms", keywords: ["pant", "short", "trouser"] },
  { label: "Outerwear", slug: "outerwear", keywords: ["jacket", "overshirt"] },
];

export default async function MenPage() {
  const [allProducts, hero] = await Promise.all([getProducts(), getHeroImages("men")]);

  const products: Product[] = allProducts
    .filter((p) => p.category === "Men")
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      href: `/product/${p.id}`,
      badge: p.badge,
      image: p.colors?.[0]?.image ?? p.images[0],
      colors: p.colors,
      sizes: p.sizes,
      isComingSoon: p.isComingSoon,
      stock: p.stock,
    }));

  return (
    <>
      <Header />
      <main id="main-content">

      {/* ── Hero Banner ── */}
      <section className="relative w-full overflow-hidden bg-smoke">

        {/* picture — browser downloads only the matching source */}
        <div className="relative w-full min-h-[80vh] md:h-[80vh]">
          <picture>
            <source media="(min-width: 768px)" srcSet={hero.desktop_src} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.mobile_src}
              alt="Men's collection hero"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </picture>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 px-5 md:px-16 lg:px-24">
          <p className="text-xs tracking-ultra uppercase text-white/70 mb-3 font-sans">
            Spring / Summer 2025
          </p>
          <h1 className="font-display text-4xl md:text-8xl font-black uppercase tracking-tight text-white leading-none mb-4 md:mb-6">
            Men
          </h1>
          <p className="text-sm tracking-wide text-white/80 mb-8 max-w-xs font-sans font-light leading-relaxed">
            Refined essentials designed with intention — for the city, the streets, and everything in between.
          </p>
          <Link href="/men#products" className="self-start bg-white text-primary text-xs tracking-widest uppercase px-8 py-3 hover:bg-smoke transition-colors duration-200">
            Shop New Arrivals
          </Link>
        </div>
      </section>

      {/* ── Interactive grid + category tiles ── */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryShell products={products} tiles={TILES} />
      </Suspense>

      </main>
      <Footer />
    </>
  );
}
