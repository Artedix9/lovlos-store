import { createClient } from "@supabase/supabase-js";
import type { PDPProduct } from "./products";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): PDPProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryHref: row.category_href,
    price: row.price,
    badge: row.badge ?? undefined,
    images: row.images ?? [],
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    description: row.description ?? "",
    materials: row.materials ?? "",
    care: row.care ?? "",
    isComingSoon: row.is_coming_soon ?? false,
  };
}

export async function getProducts(): Promise<PDPProduct[]> {
  const { data, error } = await supabase()
    .from("products")
    .select("*")
    .order("sort_order");

  if (error) {
    console.error("[data] Supabase error:", error.message);
    const { PRODUCTS } = await import("./products");
    return PRODUCTS;
  }

  return (data ?? []).map(fromRow);
}
