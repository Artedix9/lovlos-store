import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryShell from "@/components/CategoryShell";
import type { CategoryTile } from "@/components/CategoryShell";
import { getProducts } from "@/lib/data";
import type { Product } from "@/components/ProductCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Accessories — LOVLOS",
  description: "Complete your LOVLOS look. Bags, caps, mats, and more — each piece crafted with intention.",
};

const TILES: CategoryTile[] = [
  { label: "Bags",          slug: "bags",      keywords: ["bag", "tote", "crossbody"],        gradient: "from-[#e0d7d1] to-[#c8bfb9]", overlayClass: "bg-primary/0 group-hover:bg-primary/10" },
  { label: "Hats & Caps",   slug: "hats",      keywords: ["hat", "cap", "beanie"],            gradient: "from-[#ddd9d4] to-[#c5c1bc]", overlayClass: "bg-primary/0 group-hover:bg-primary/10" },
  { label: "Yoga & Studio", slug: "yoga",      keywords: ["yoga", "mat", "bottle", "band"],   gradient: "from-[#d6d2cc] to-[#b8b4af]", overlayClass: "bg-primary/0 group-hover:bg-primary/10" },
  { label: "Lifestyle",     slug: "lifestyle", keywords: ["sock", "belt", "watch"],           gradient: "from-[#ceb18f] to-[#b89878]", overlayClass: "bg-primary/0 group-hover:bg-primary/10" },
];

export default async function AccessoriesPage() {
  const allProducts = await getProducts();

  const products: Product[] = allProducts
    .filter((p) => p.category === "Accessories")
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#e0d7d1] via-[#ece8e4] to-[#f4f0ec]" />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(circle at 60% 70%, #ceb18f 0%, transparent 40%), radial-gradient(circle at 10% 20%, #e0d7d1 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />

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
      <Suspense>
        <CategoryShell products={products} tiles={TILES} />
      </Suspense>

      <Footer />
    </>
  );
}
