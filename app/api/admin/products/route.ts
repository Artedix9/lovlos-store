import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PDPProduct } from "@/lib/products";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-key") === secret;
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

  const { data, error } = await supabase().from("products").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(fromRow));
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.category || !body.price) {
    return NextResponse.json({ error: "name, category, and price are required" }, { status: 400 });
  }

  const { data: maxData } = await supabase()
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
    badge: body.badge || null,
    images: body.images ?? [],
    colors: body.colors ?? [],
    sizes: body.sizes ?? ["XS", "S", "M", "L", "XL"],
    description: body.description ?? "",
    materials: body.materials ?? "",
    care: body.care ?? "",
    is_coming_soon: body.isComingSoon ?? false,
    sort_order: maxSort,
  };

  const { data, error } = await supabase().from("products").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  if ("badge" in body) updates.badge = body.badge || null;
  if (body.images !== undefined) updates.images = body.images;
  if (body.colors !== undefined) updates.colors = body.colors;
  if (body.sizes !== undefined) updates.sizes = body.sizes;
  if (body.description !== undefined) updates.description = body.description;
  if (body.materials !== undefined) updates.materials = body.materials;
  if (body.care !== undefined) updates.care = body.care;
  if (body.isComingSoon !== undefined) updates.is_coming_soon = body.isComingSoon;

  const { data, error } = await supabase()
    .from("products")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(fromRow(data));
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase().from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
