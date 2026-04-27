import Papa from "papaparse";
import type { PDPProduct, ProductColor } from "./products";

interface RawRow {
  id: string;
  name: string;
  category: string;
  categoryHref: string;
  price: string;
  badge?: string;
  images: string;   // comma-separated URLs
  colors?: string;  // JSON string: [{name,hex,image?}, ...]
  sizes: string;    // comma-separated
  description: string;
  materials: string;
  care: string;
  isComingSoon: string; // "true" | "false"
}

function parseRow(row: RawRow): PDPProduct {
  return {
    id: row.id?.trim() ?? "",
    name: row.name?.trim() ?? "",
    category: row.category?.trim() ?? "",
    categoryHref: row.categoryHref?.trim() ?? "",
    price: Number(row.price) || 0,
    badge: row.badge?.trim() || undefined,
    images: (row.images ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    colors: (() => {
      const raw = row.colors?.trim();
      if (!raw) return undefined;
      try {
        return JSON.parse(raw) as ProductColor[];
      } catch {
        return undefined;
      }
    })(),
    sizes: (row.sizes ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    description: row.description?.trim() ?? "",
    materials: row.materials?.trim() ?? "",
    care: row.care?.trim() ?? "",
    isComingSoon: row.isComingSoon?.trim().toLowerCase() === "true",
  };
}

/**
 * Fetch the product catalogue from the published Google Sheets CSV.
 * Falls back to the static products.json when NEXT_PUBLIC_SHEETS_URL is not set,
 * so local development works without a live sheet.
 *
 * Called from Server Components — the `next.revalidate` option on fetch keeps
 * the cached response warm while allowing hourly refreshes.
 */
export async function getProducts(): Promise<PDPProduct[]> {
  const url = process.env.NEXT_PUBLIC_SHEETS_URL?.trim();

  if (!url) {
    console.warn(
      "[data] NEXT_PUBLIC_SHEETS_URL is not set — falling back to static products.json"
    );
    const { PRODUCTS } = await import("./products");
    return PRODUCTS;
  }

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(
      `[data] Failed to fetch product sheet: ${res.status} ${res.statusText}`
    );
  }

  const csv = await res.text();
  const { data, errors } = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.warn("[data] CSV parse warnings:", errors.slice(0, 3));
  }

  return data.map(parseRow).filter((p) => Boolean(p.id));
}
