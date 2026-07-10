import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data";
import { effectivePrice } from "@/lib/products";

export const revalidate = 3600;

/** Lightweight public product index — powers the header search. */
export async function GET() {
  const products = await getProducts();
  const index = products
    .filter((p) => !p.isComingSoon || p.preorder)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: effectivePrice(p),
      image: p.colors?.[0]?.image ?? p.images[0] ?? null,
    }));

  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
