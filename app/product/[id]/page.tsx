import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/data";
import { getApprovedReviews } from "@/lib/reviews";
import { SITE_URL } from "@/lib/site";
import { effectivePrice, type PDPProduct } from "@/lib/products";
import type { Product } from "@/components/ProductCard";
import ProductPageClient from "./ProductPageClient";

function toCard(p: PDPProduct): Product {
  return {
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
  };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return { title: "Product not found — LOVLOS" };
  return {
    title: `${product.name} — LOVLOS`,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [products, reviews] = await Promise.all([getProducts(), getApprovedReviews(id)]);
  const product = products.find((p) => p.id === id) ?? null;

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6">
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
            Product not found
          </h1>
          <p className="text-sm text-chicago tracking-wide">
            The item you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/" className="btn-outline mt-4">
            Back to Home
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  /* Curated "Style It With" pairings — in the admin's chosen order */
  const styledWith = (product.styledWith ?? [])
    .map((sid) => products.find((p) => p.id === sid))
    .filter((p): p is PDPProduct => !!p && (!p.isComingSoon || !!p.preorder))
    .map(toCard);
  const styledIds = new Set(styledWith.map((p) => p.id));

  /* Related: same category first, then the rest of the catalog, max 4.
     Skips curated pairings so the two rows never repeat a product. */
  const pool = products.filter((p) => p.id !== product.id && (!p.isComingSoon || p.preorder) && !styledIds.has(p.id));
  const related = [
    ...pool.filter((p) => p.category === product.category),
    ...pool.filter((p) => p.category !== product.category),
  ]
    .slice(0, 4)
    .map(toCard);

  /* Product structured data — puts price, availability, and stars in Google results */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.filter(Boolean).map((src) =>
      src.startsWith("http") ? src : `${SITE_URL}${src}`
    ),
    brand: { "@type": "Brand", name: "LOVLOS" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "TZS",
      price: effectivePrice(product),
      availability:
        product.isComingSoon && product.preorder
          ? "https://schema.org/PreOrder"
          : (product.stock ?? 0) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
    },
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
            reviewCount: reviews.length,
          },
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            reviewRating: { "@type": "Rating", ratingValue: r.rating },
            reviewBody: r.body,
            datePublished: r.created_at.slice(0, 10),
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient product={product} related={related} reviews={reviews} styledWith={styledWith} />
    </>
  );
}
