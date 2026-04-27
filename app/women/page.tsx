import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryShell from "@/components/CategoryShell";
import type { CategoryTile } from "@/components/CategoryShell";
import { getProducts } from "@/lib/data";
import type { Product } from "@/components/ProductCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Women — LOVLOS",
  description: "Discover the LOVLOS women's collection. Effortless, premium pieces for movement and life.",
};

const TILES: CategoryTile[] = [
  {
    label: "Tops",
    slug: "tops",
    keywords: ["top", "vest", "bra"],
    image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Bottoms",
    slug: "bottoms",
    keywords: ["trouser", "skirt", "legging", "short"],
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
    overlayClass: "bg-primary/15 group-hover:bg-primary/30",
  },
  {
    label: "Outerwear",
    slug: "outerwear",
    keywords: ["jacket", "coat", "outerwear"],
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80",
    overlayClass: "bg-primary/15 group-hover:bg-primary/30",
  },
  {
    label: "Studio",
    slug: "studio",
    keywords: ["sports", "yoga", "studio"],
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
    overlayClass: "bg-primary/15 group-hover:bg-primary/30",
  },
];

export default async function WomenPage() {
  const allProducts = await getProducts();

  const products: Product[] = allProducts
    .filter((p) => p.category === "Women")
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      href: `/product/${p.id}`,
      badge: p.badge,
      image: p.colors?.[0]?.image ?? p.images[0],
      colors: p.colors,
      isComingSoon: p.isComingSoon,
    }));

  return (
    <>
      <Header />

      {/* ── Hero Banner ── */}
      <section className="relative w-full h-[70vh] min-h-[480px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1800&q=85"
          alt="Women's collection hero"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent" />

        <div className="relative flex flex-col justify-end h-full pb-10 md:pb-16 px-5 md:px-16 lg:px-24">
          <p className="text-xs tracking-ultra uppercase text-charcoal mb-3 font-sans">
            Spring / Summer 2025
          </p>
          <h1 className="font-display text-4xl md:text-8xl font-black uppercase tracking-tight text-primary leading-none mb-4 md:mb-6">
            Women
          </h1>
          <p className="text-sm tracking-wide text-mine mb-8 max-w-xs font-sans font-light leading-relaxed">
            Thoughtfully crafted pieces that move with you — from studio to street.
          </p>
          <Link href="/women#products" className="btn-primary self-start">
            Shop New Arrivals
          </Link>
        </div>
      </section>

      {/* ── Interactive grid + category tiles ── */}
      <Suspense>
        <CategoryShell products={products} tiles={TILES} />
      </Suspense>

      <Footer />
    </>
  );
}
