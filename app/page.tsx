import { getProducts } from "@/lib/data";
import type { PDPProduct } from "@/lib/products";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/components/ProductCard";

export const revalidate = 3600;

const TRENDING_LABELS = ["TOPS", "SHIRTS", "ACCESSORIES", "BEST SELLER"] as const;

function toCard(p: PDPProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    href: `/product/${p.id}`,
    badge: p.badge,
    image: p.colors?.[0]?.image ?? p.images[0],
    colors: p.colors,
    isComingSoon: p.isComingSoon,
  };
}

export default async function Home() {
  const allProducts = await getProducts();
  const available = allProducts.filter((p) => !p.isComingSoon);

  // Slot 1 — Women with 'New' badge, fallback to first Women
  const womenPick =
    available.find((p) => p.category === "Women" && p.badge === "New") ??
    available.find((p) => p.category === "Women");

  // Slot 2 — Men with 'New' badge, fallback to first Men
  const menPick =
    available.find(
      (p) => p.category === "Men" && p.badge === "New" && p.id !== womenPick?.id
    ) ?? available.find((p) => p.category === "Men" && p.id !== womenPick?.id);

  // Slot 3 — Accessories with 'New' badge, fallback to first Accessories
  const accPick =
    available.find((p) => p.category === "Accessories" && p.badge === "New") ??
    available.find((p) => p.category === "Accessories");

  // Slot 4 — Best Seller from Men or Women, not already chosen
  const usedIds = new Set(
    [womenPick?.id, menPick?.id, accPick?.id].filter(Boolean)
  );
  const bestSellerPick = available.find(
    (p) =>
      (p.category === "Men" || p.category === "Women") &&
      p.badge === "Best Seller" &&
      !usedIds.has(p.id)
  );

  const trending = [womenPick, menPick, accPick, bestSellerPick].filter(
    (p): p is PDPProduct => Boolean(p)
  );

  return (
    <main>
      <Header />
      <Hero
        desktopSrc="/new-banner02.jpg"
        mobileSrc="/Main Hero Banner-Mobile.png"
        isFullScreen={true}
        darkBackground
      />

      {trending.length > 0 && (
        <section className="bg-white pt-16 md:pt-20 pb-24 px-5 md:px-16 lg:px-24">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-center text-primary mb-12">
            Trending Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-10">
            {trending.map((p, i) => (
              <ProductCard
                key={p.id}
                product={{ ...toCard(p), href: p.categoryHref }}
                cardLabel={TRENDING_LABELS[i]}
                hideQuickAdd
              />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
