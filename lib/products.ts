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
