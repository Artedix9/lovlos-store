import { getSupabase, fromRow } from "./supabase";
import type { PDPProduct } from "./products";

export async function getProducts(): Promise<PDPProduct[]> {
  try {
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
  } catch (err) {
    console.error("[data] Supabase unavailable, using bundled data:", err);
    const { PRODUCTS } = await import("./products");
    return PRODUCTS;
  }
}
