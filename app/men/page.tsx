import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
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

const CATEGORIES = [
  {
    label: "Tops", href: "/men/tops",
    image: "https://images.unsplash.com/photo-1512327536842-5aa37d1ba3e3?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Bottoms", href: "/men/bottoms",
    image: "https://images.unsplash.com/photo-1542574621-e088a4464cc6?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Outerwear", href: "/men/outerwear",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Studio", href: "/men/studio",
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

      {/* ── Product Grid ── */}
      <section id="products" className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight">New Arrivals</h2>
          <span className="text-xs tracking-widest uppercase text-chicago">
            {MEN_PRODUCTS.length} items
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {MEN_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex justify-center mt-14">
          <button className="btn-outline">View All Men</button>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pb-20">
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight mb-10">Shop by Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative aspect-square overflow-hidden bg-smoke"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/50 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-end p-5">
                <span className="text-sm tracking-widest uppercase text-white font-sans">
                  {cat.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
