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
  title: "Accessories — LOVLOS",
  description: "Complete your LOVLOS look. Bags, caps, mats, and more — each piece crafted with intention.",
};

const TILES: CategoryTile[] = [
  { label: "Bags", slug: "bags", keywords: ["bag", "tote", "crossbody"] },
  { label: "Hats & Caps", slug: "hats", keywords: ["hat", "cap", "beanie"] },
  { label: "Lifestyle", slug: "lifestyle", keywords: ["sock", "belt", "watch"] },
];

export default async function AccessoriesPage() {
  const [allProducts, hero] = await Promise.all([getProducts(), getHeroImages("accessories")]);

  const products: Product[] = allProducts
    .filter((p) => p.category === "Accessories")
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      salePrice: p.salePrice,
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
              alt="Accessories collection hero"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </picture>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 px-5 md:px-16 lg:px-24">
          <p className="text-xs tracking-ultra uppercase text-charcoal mb-3 font-sans">
            Spring / Summer 2025
          </p>
          <h1 className="font-display text-4xl md:text-8xl font-black uppercase tracking-tight text-primary leading-none mb-4 md:mb-6">
            Accessories
          </h1>
          <p className="text-sm tracking-wide text-mine mb-8 max-w-xs font-sans font-light leading-relaxed">
            Every detail considered. Pieces that complete the look and the lifestyle.
          </p>
          <Link href="/accessories#products" className="btn-primary self-start">
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
