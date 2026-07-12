import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryShell from "@/components/CategoryShell";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { getProducts } from "@/lib/data";
import type { Product } from "@/components/ProductCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sale — LOVLOS",
  description: "LOVLOS pieces at reduced prices — premium essentials while they last.",
};

export default async function SalePage() {
  const allProducts = await getProducts();

  const products: Product[] = allProducts
    .filter((p) => p.salePrice != null && p.salePrice < p.price)
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
      preorder: p.preorder,
    }));

  return (
    <>
      <Header />
      <main id="main-content">

        {/* ── Banner — no managed hero image for sale; a bold text strip instead ── */}
        <section className="bg-primary text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-20 md:py-28">
            <p className="text-xs tracking-ultra uppercase text-white/60 mb-3 font-sans">
              While they last
            </p>
            <h1 className="font-display text-5xl md:text-8xl font-black uppercase tracking-tight leading-none mb-4 md:mb-6">
              Sale
            </h1>
            <p className="text-sm tracking-wide text-white/70 max-w-xs font-sans font-light leading-relaxed">
              Premium LOVLOS pieces at reduced prices. Once they&apos;re gone, they&apos;re gone.
            </p>
          </div>
        </section>

        {products.length === 0 ? (
          <section className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-ultra text-chicago">
              Nothing on sale right now
            </p>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-primary">
              Check back soon
            </h2>
            <p className="text-sm text-chicago tracking-wide max-w-sm">
              Join the email list at the bottom of the page and we&apos;ll tell you the moment a sale drops.
            </p>
            <Link href="/" className="btn-primary mt-4">Shop the Collection</Link>
          </section>
        ) : (
          <Suspense fallback={<ProductGridSkeleton />}>
            <CategoryShell products={products} tiles={[]} />
          </Suspense>
        )}

      </main>
      <Footer />
    </>
  );
}
