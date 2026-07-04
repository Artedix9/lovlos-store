import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabase, fromRow } from "@/lib/supabase";

function revalidateAll(productId?: string) {
  revalidatePath("/");
  revalidatePath("/men");
  revalidatePath("/women");
  revalidatePath("/accessories");
  // Stock/price edits must show on the product page immediately, not after
  // the hourly ISR window — e.g. restock alerts link customers straight here.
  if (productId) revalidatePath(`/product/${productId}`);
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-key") === secret;
}

/** null = no sale; otherwise must be a positive amount below the regular price. */
function parseSalePrice(raw: unknown, regularPrice: number): number | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= regularPrice) return undefined; // invalid
  return Math.round(n);
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

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase().from("products").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(fromRow));
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.category || !body.price) {
    return NextResponse.json({ error: "name, category, and price are required" }, { status: 400 });
  }

  const salePrice = parseSalePrice(body.salePrice, Number(body.price));
  if (salePrice === undefined) {
    return NextResponse.json({ error: "Sale price must be lower than the regular price" }, { status: 400 });
  }

  const db = getSupabase();

  const { data: maxData } = await db
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const maxSort = (maxData?.[0]?.sort_order ?? -1) + 1;

  const row = {
    id: generateId(body.name),
    name: body.name,
    category: body.category,
    category_href: `/${(body.category as string).toLowerCase()}`,
    price: Number(body.price),
    sale_price: salePrice,
    badge: body.badge || null,
    images: body.images ?? [],
    colors: body.colors ?? [],
    sizes: body.sizes ?? ["XS", "S", "M", "L", "XL"],
    description: body.description ?? "",
    materials: body.materials ?? "",
    care: body.care ?? "",
    is_coming_soon: body.isComingSoon ?? false,
    stock_quantity: Math.max(0, Number(body.stock) || 0),
    fit: body.fit || null,
    fit_notes: body.fitNotes ?? "",
    styled_with: Array.isArray(body.styledWith) ? body.styledWith : [],
    sort_order: maxSort,
  };

  const { data, error } = await db.from("products").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateAll(row.id);
  return NextResponse.json(fromRow(data), { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.category !== undefined) {
    updates.category = body.category;
    updates.category_href = `/${(body.category as string).toLowerCase()}`;
  }
  if (body.price !== undefined) updates.price = Number(body.price);
  if ("salePrice" in body && body.price !== undefined) {
    const salePrice = parseSalePrice(body.salePrice, Number(body.price));
    if (salePrice === undefined) {
      return NextResponse.json({ error: "Sale price must be lower than the regular price" }, { status: 400 });
    }
    updates.sale_price = salePrice;
  }
  if ("badge" in body) updates.badge = body.badge || null;
  if (body.images !== undefined) updates.images = body.images;
  if (body.colors !== undefined) updates.colors = body.colors;
  if (body.sizes !== undefined) updates.sizes = body.sizes;
  if (body.description !== undefined) updates.description = body.description;
  if (body.materials !== undefined) updates.materials = body.materials;
  if (body.care !== undefined) updates.care = body.care;
  if (body.isComingSoon !== undefined) updates.is_coming_soon = body.isComingSoon;
  if (body.stock !== undefined) updates.stock_quantity = Math.max(0, Number(body.stock) || 0);
  if ("fit" in body) updates.fit = body.fit || null;
  if (body.fitNotes !== undefined) updates.fit_notes = body.fitNotes;
  if (body.styledWith !== undefined) updates.styled_with = Array.isArray(body.styledWith) ? body.styledWith : [];

  const { data, error } = await getSupabase()
    .from("products")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateAll(body.id);
  return NextResponse.json(fromRow(data));
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateAll(id);
  return NextResponse.json({ success: true });
}
