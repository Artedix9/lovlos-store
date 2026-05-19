import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { PDPProduct } from "@/lib/products";

const DATA_PATH = join(process.cwd(), "data", "products.json");

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false; // fail closed if not configured
  return req.headers.get("x-admin-key") === secret;
}

function readProducts(): PDPProduct[] {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}

function writeProducts(products: PDPProduct[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(products, null, 2), "utf-8");
}

function generateId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function categoryHref(category: string): string {
  return `/${category.toLowerCase()}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readProducts());
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.name || !body.category || !body.price) {
    return NextResponse.json({ error: "name, category, and price are required" }, { status: 400 });
  }

  const newProduct: PDPProduct = {
    id: generateId(body.name),
    name: body.name,
    category: body.category,
    categoryHref: categoryHref(body.category),
    price: Number(body.price),
    badge: body.badge || undefined,
    images: body.images?.length ? body.images : [],
    colors: [],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "",
    materials: "",
    care: "",
    isComingSoon: false,
  };

  const products = readProducts();
  products.push(newProduct);
  writeProducts(products);

  return NextResponse.json(newProduct, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const products = readProducts();
  const updated = products.filter((p) => p.id !== id);

  if (updated.length === products.length) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  writeProducts(updated);
  return NextResponse.json({ success: true });
}
