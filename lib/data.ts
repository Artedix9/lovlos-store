import { getSupabase, fromRow } from "./supabase";
import { isUnpublished, type PDPProduct } from "./products";

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

    /* Early-access gate: unpublished products present as plain Coming Soon
       everywhere public (cards, PDP, sitemap, search index). The PDP client
       unlocks via /api/early-access when the visitor holds the code. */
    return (data ?? []).map(fromRow).map((p) =>
      isUnpublished(p) ? { ...p, isComingSoon: true, preorder: false } : p
    );
  } catch (err) {
    console.error("[data] Supabase unavailable, using bundled data:", err);
    const { PRODUCTS } = await import("./products");
    return PRODUCTS;
  }
}
