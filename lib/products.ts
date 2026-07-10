import productsData from "@/data/products.json";

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface PDPProduct {
  id: string;
  name: string;
  category: string;
  categoryHref: string;
  price: number;         // TZS
  salePrice?: number;    // TZS — when set, shown against a struck-through price
  badge?: string;
  images: string[];      // ordered: hero first
  colors?: ProductColor[];
  sizes: string[];
  description: string;
  materials: string;
  care: string;
  isComingSoon?: boolean;
  stock?: number;        // units on hand — 0 = out of stock
  fit?: "runs-small" | "true-to-size" | "runs-large";
  fitNotes?: string;     // e.g. "Model is 175cm and wears size M"
  styledWith?: string[]; // curated product ids for "Style It With"
  preorder?: boolean;    // Coming Soon + preorder = buyable ahead of release
  releaseNote?: string;  // e.g. "Expected late July"
}

/** Coming Soon products with pre-orders enabled are buyable ahead of release. */
export function isPreorderable(p: { isComingSoon?: boolean; preorder?: boolean }): boolean {
  return !!p.isComingSoon && !!p.preorder;
}

export const PRODUCTS: PDPProduct[] = productsData as PDPProduct[];

export function getProduct(id: string): PDPProduct | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

const _tzsFormatter = new Intl.NumberFormat("en-TZ");

export function formatTZS(amount: number): string {
  return `TZS ${_tzsFormatter.format(amount)}`;
}

/** The price a customer actually pays — sale price when one is set. */
export function effectivePrice(p: { price: number; salePrice?: number }): number {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}
