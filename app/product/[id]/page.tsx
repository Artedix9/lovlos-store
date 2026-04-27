import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/data";
import ProductPageClient from "./ProductPageClient";

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
  const products = await getProducts();
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

  return <ProductPageClient product={product} />;
}
