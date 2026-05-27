import { getSupabase, fromRow } from "./supabase";
import type { PDPProduct } from "./products";

export async function getProducts(): Promise<PDPProduct[]> {
  const { data, error } = await getSupabase()
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
