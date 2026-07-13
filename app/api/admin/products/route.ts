import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { getSupabase, fromRow, storagePathFromUrl } from "@/lib/supabase";

function revalidateAll(productId?: string) {
  revalidatePath("/");
  revalidatePath("/men");
  revalidatePath("/women");
  revalidatePath("/accessories");
  revalidatePath("/sale");
  // Stock/price edits must show on the product page immediately, not after
  // the hourly ISR window — e.g. restock alerts link customers straight here.
  if (productId) revalidatePath(`/product/${productId}`);
}

/** null = no sale; otherwise must be a positive amount below the regular price. */
function parseSalePrice(raw: unknown, regularPrice: number): number | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= regularPrice) return undefined; // invalid
  return Math.round(n);
}

/** Buying price + early-access code — admin-only, so fromRow never carries them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminRow(row: any) {
  return {
    ...fromRow(row),
    costPrice: row.cost_price ?? undefined,
    accessCode: row.access_code ?? null,
  };
}

/** Early-access inputs: publishAt ISO string (or empty = public),
 *  accessCode promo code (or empty = plain coming-soon gate). */
function parseEarlyAccess(body: Record<string, unknown>): { publish_at: string | null; access_code: string | null } | { error: string } {
  const rawAt = body.publishAt;
  const rawCode = body.accessCode;
  let publish_at: string | null = null;
  if (rawAt != null && rawAt !== "") {
    const t = new Date(String(rawAt));
    if (isNaN(t.getTime())) return { error: "Invalid publish date" };
    publish_at = t.toISOString();
  }
  const access_code = rawCode != null && String(rawCode).trim() !== ""
    ? String(rawCode).trim().toUpperCase()
    : null;
  return { publish_at, access_code };
}

/** null = not recorded; otherwise a non-negative amount. */
function parseCostPrice(raw: unknown): number | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined; // invalid
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
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await getSupabase().from("products").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(adminRow));
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  if (!body.name || !body.category || !body.price) {
    return NextResponse.json({ error: "name, category, and price are required" }, { status: 400 });
  }

  const salePrice = parseSalePrice(body.salePrice, Number(body.price));
  if (salePrice === undefined) {
    return NextResponse.json({ error: "Sale price must be lower than the regular price" }, { status: 400 });
  }

  const costPrice = parseCostPrice(body.costPrice);
  if (costPrice === undefined) {
    return NextResponse.json({ error: "Buying price must be zero or a positive number" }, { status: 400 });
  }

  const earlyAccess = parseEarlyAccess(body);
  if ("error" in earlyAccess) {
    return NextResponse.json({ error: earlyAccess.error }, { status: 400 });
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
    cost_price: costPrice,
    publish_at: earlyAccess.publish_at,
    access_code: earlyAccess.access_code,
    badge: body.badge || null,
    images: body.images ?? [],
    colors: body.colors ?? [],
    sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ["XS", "S", "M", "L", "XL"],
    description: body.description ?? "",
    materials: body.materials ?? "",
    care: body.care ?? "",
    is_coming_soon: body.isComingSoon ?? false,
    preorder: body.preorder ?? false,
    release_note: body.releaseNote ?? "",
    stock_quantity: Math.max(0, Number(body.stock) || 0),
    fit: body.fit || null,
    fit_notes: body.fitNotes ?? "",
    styled_with: Array.isArray(body.styledWith) ? body.styledWith : [],
    sort_order: maxSort,
  };

  const { data, error } = await db.from("products").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateAll(row.id);
  return NextResponse.json(adminRow(data), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

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
  if ("costPrice" in body) {
    const costPrice = parseCostPrice(body.costPrice);
    if (costPrice === undefined) {
      return NextResponse.json({ error: "Buying price must be zero or a positive number" }, { status: 400 });
    }
    updates.cost_price = costPrice;
  }
  if ("publishAt" in body || "accessCode" in body) {
    const ea = parseEarlyAccess(body);
    if ("error" in ea) return NextResponse.json({ error: ea.error }, { status: 400 });
    if ("publishAt" in body) updates.publish_at = ea.publish_at;
    if ("accessCode" in body) updates.access_code = ea.access_code;
  }
  if ("badge" in body) updates.badge = body.badge || null;
  if (body.images !== undefined) updates.images = body.images;
  if (body.colors !== undefined) updates.colors = body.colors;
  if (body.sizes !== undefined) updates.sizes = body.sizes;
  if (body.description !== undefined) updates.description = body.description;
  if (body.materials !== undefined) updates.materials = body.materials;
  if (body.care !== undefined) updates.care = body.care;
  if (body.isComingSoon !== undefined) updates.is_coming_soon = body.isComingSoon;
  if (body.preorder !== undefined) updates.preorder = body.preorder;
  if (body.releaseNote !== undefined) updates.release_note = body.releaseNote;
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
  return NextResponse.json(adminRow(data));
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getSupabase();

  /* Collect everything the product owns before deleting the row */
  const [{ data: product }, { data: productReviews }] = await Promise.all([
    db.from("products").select("images, colors").eq("id", id).maybeSingle(),
    db.from("product_reviews").select("photo_url").eq("product_id", id),
  ]);

  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /* Best-effort cleanup — the product is already gone, so never fail the request */
  try {
    await Promise.all([
      db.from("product_reviews").delete().eq("product_id", id),
      db.from("restock_requests").delete().eq("product_id", id),
    ]);

    const colors = (product?.colors ?? []) as { image?: string; images?: string[] }[];
    const urls: string[] = [
      ...(product?.images ?? []),
      ...colors.map((c) => c.image ?? ""),
      ...colors.flatMap((c) => c.images ?? []),
      ...(productReviews ?? []).map((r) => r.photo_url ?? ""),
    ];
    const paths = urls.map(storagePathFromUrl).filter((p): p is string => !!p);
    if (paths.length) await db.storage.from("product-images").remove(paths);
  } catch (cleanupErr) {
    console.error("[LOVLOS DELETE CLEANUP]", cleanupErr);
  }

  revalidateAll(id);
  return NextResponse.json({ success: true });
}
