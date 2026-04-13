import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { type Product } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Accessories — LOVLOS",
  description: "Complete your LOVLOS look. Bags, caps, mats, and more — each piece crafted with intention.",
};

const PRODUCTS: Product[] = [
  { id: "a1", name: "Canvas Tote Bag", price: 65000, href: "/product/canvas-tote", badge: "New", gradient: "from-[#e0d7d1] to-[#c8bfb9]" },
  { id: "a2", name: "Minimalist Watch", price: 450000, href: "/product/minimalist-watch", gradient: "from-[#d4d0cb] to-[#bcb8b2]" },
  { id: "a3", name: "Woven Leather Belt", price: 85000, href: "/product/leather-belt", gradient: "from-[#ceb18f] to-[#b89878]" },
  { id: "a4", name: "Structured Cap", price: 55000, href: "/product/structured-cap", badge: "Best Seller", gradient: "from-[#ddd9d4] to-[#c5c1bc]" },
  { id: "a5", name: "Sports Socks (3-pack)", price: 35000, href: "/product/sports-socks", gradient: "from-[#e4e0dc] to-[#ccc8c3]" },
  { id: "a6", name: "Natural Rubber Yoga Mat", price: 125000, href: "/product/yoga-mat", gradient: "from-[#d6d2cc] to-[#b8b4af]" },
  { id: "a7", name: "Insulated Water Bottle", price: 75000, href: "/product/water-bottle", badge: "New", gradient: "from-[#e2deda] to-[#cac6c1]" },
  { id: "a8", name: "Minimal Crossbody Bag", price: 195000, href: "/product/crossbody-bag", gradient: "from-[#d8d4cf] to-[#c0bcb7]" },
];

const CATEGORIES = [
  { label: "Bags", href: "/accessories/bags", gradient: "from-[#e0d7d1] to-[#c8bfb9]" },
  { label: "Hats & Caps", href: "/accessories/hats", gradient: "from-[#ddd9d4] to-[#c5c1bc]" },
  { label: "Yoga & Studio", href: "/accessories/yoga", gradient: "from-[#d6d2cc] to-[#b8b4af]" },
  { label: "Lifestyle", href: "/accessories/lifestyle", gradient: "from-[#ceb18f] to-[#b89878]" },
];

export default function AccessoriesPage() {
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
          <button className="btn-outline">View All Accessories</button>
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
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} group-hover:scale-105 transition-transform duration-500`} />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-end p-5">
                <span className="text-sm tracking-widest uppercase text-primary font-sans">
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
