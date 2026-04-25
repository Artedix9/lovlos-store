import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryShell from "@/components/CategoryShell";
import type { CategoryTile } from "@/components/CategoryShell";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Men — LOVLOS",
  description: "Explore the LOVLOS men's collection. Clean, minimal essentials built for modern life.",
};

const MEN_PRODUCTS: Product[] = PRODUCTS
  .filter((p) => p.category === "Men")
  .map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    href: `/product/${p.id}`,
    badge: p.badge,
    image: p.images[0],
    isComingSoon: p.isComingSoon,
  }));

const TILES: CategoryTile[] = [
  {
    label: "Tops",
    slug: "tops",
    keywords: ["tee", "polo", "shirt", "hoodie", "crewneck", "sweatshirt"],
    image: "https://images.unsplash.com/photo-1512327536842-5aa37d1ba3e3?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Bottoms",
    slug: "bottoms",
    keywords: ["pant", "short", "trouser"],
    image: "https://images.unsplash.com/photo-1542574621-e088a4464cc6?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Outerwear",
    slug: "outerwear",
    keywords: ["jacket", "overshirt"],
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Studio",
    slug: "studio",
    keywords: ["performance", "track", "studio"],
    image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=600&q=80",
  },
];

export default function MenPage() {
  return (
    <>
      <Header />

      {/* ── Hero Banner ── */}
      <section className="relative w-full h-[70vh] min-h-[480px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1800&q=85"
          alt="Men's collection hero"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="relative flex flex-col justify-end h-full pb-10 md:pb-16 px-5 md:px-16 lg:px-24">
          <p className="text-xs tracking-ultra uppercase text-white/70 mb-3 font-sans">
            Spring / Summer 2025
          </p>
          <h1 className="font-display text-4xl md:text-8xl font-black uppercase tracking-tight text-white leading-none mb-4 md:mb-6">
            Men
          </h1>
          <p className="text-sm tracking-wide text-white/80 mb-8 max-w-xs font-sans font-light leading-relaxed">
            Refined essentials designed with intention — for the studio, the city, and everything in between.
          </p>
          <Link href="/men#products" className="self-start bg-white text-primary text-xs tracking-widest uppercase px-8 py-3 hover:bg-smoke transition-colors duration-200">
            Shop New Arrivals
          </Link>
        </div>
      </section>

      {/* ── Interactive grid + category tiles ── */}
      <Suspense>
        <CategoryShell products={MEN_PRODUCTS} tiles={TILES} />
      </Suspense>

      <Footer />
    </>
  );
}
