import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { type Product } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Women — LOVLOS",
  description: "Discover the LOVLOS women's collection. Effortless, premium pieces for movement and life.",
};

const PRODUCTS: Product[] = [
  {
    id: "w1", name: "Crop Top", price: 85000,
    href: "/product/crop-top", badge: "New",
    image: "/Crop-top 1a.png",
  },
  {
    id: "w2", name: "Relaxed Crop Top", price: 85000,
    href: "/product/relaxed-crop-top",
    image: "/Crop-top 2a.png",
  },
  {
    id: "w3", name: "Long Sleeve Crop Top", price: 98000,
    href: "/product/long-sleeve-crop-top", badge: "Best Seller",
    image: "/Crop-top Long-sleeves(W)a.png",
  },
  {
    id: "w4", name: "Long Sleeve Crop Top — Black", price: 98000,
    href: "/product/long-sleeve-crop-top-black",
    image: "/Crop-top Long-sleeves(B)a.png",
  },
  {
    id: "w5", name: "Ribbed Crop Vest", price: 75000,
    href: "/product/ribbed-crop-vest", badge: "New",
    image: "/Crop vest -a.png",
  },
  {
    id: "w6", name: "Essential Crop Vest", price: 75000,
    href: "/product/essential-crop-vest",
    image: "/Crop vest 2-a.png",
  },
  {
    id: "w7", name: "Loose Crop Top", price: 90000,
    href: "/product/loose-crop-top",
    image: "/Loose Crop Top (B)a.png",
  },
  {
    id: "w8", name: "Sports Crop Top", price: 80000,
    href: "/product/sports-crop-top",
    image: "/Crop top sports.png",
  },
];

const CATEGORIES = [
  {
    label: "Tops", href: "/women/tops",
    image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Bottoms", href: "/women/bottoms",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Outerwear", href: "/women/outerwear",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Studio", href: "/women/studio",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
  },
];

export default function WomenPage() {
  return (
    <>
      <Header />

      {/* ── Hero Banner ── */}
      <section className="relative w-full h-[70vh] min-h-[480px] overflow-hidden">
        {/* Hero background image */}
        <Image
          src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1800&q=85"
          alt="Women's collection hero"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay so text stays legible */}
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

      {/* ── Product Grid ── */}
      <section id="products" className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight">New Arrivals</h2>
          <span className="text-xs tracking-widest uppercase text-chicago">
            {PRODUCTS.length} items
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex justify-center mt-14">
          <button className="btn-outline">View All Women</button>
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
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/35 transition-colors duration-300" />
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
