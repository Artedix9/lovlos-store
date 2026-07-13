import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PDPProduct } from "./products";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}

/** Storage path inside the product-images bucket, or null for external/local URLs. */
export function storagePathFromUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/product-images/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRow(row: any): PDPProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryHref: row.category_href,
    price: row.price,
    salePrice: row.sale_price ?? undefined,
    badge: row.badge ?? undefined,
    images: row.images ?? [],
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    description: row.description ?? "",
    materials: row.materials ?? "",
    care: row.care ?? "",
    isComingSoon: row.is_coming_soon ?? false,
    stock: row.stock_quantity ?? 0,
    fit: row.fit ?? undefined,
    fitNotes: row.fit_notes ?? "",
    styledWith: row.styled_with ?? [],
    preorder: row.preorder ?? false,
    publishAt: row.publish_at ?? null, /* access_code stays admin-only — never map it here */
    releaseNote: row.release_note ?? "",
  };
}
