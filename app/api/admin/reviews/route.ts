import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { getSupabase, storagePathFromUrl } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await getSupabase()
    .from("product_reviews")
    .select("*")
    .order("approved", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** PUT { id, approved } — approve (or unpublish) a review. */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const { id, approved } = body as { id?: string; approved?: boolean };
  if (!id || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Missing id or approved flag" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("product_reviews")
    .update({ approved })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/product/${data.product_id}`);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getSupabase();
  const { data, error } = await db
    .from("product_reviews")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) {
    revalidatePath(`/product/${data.product_id}`);
    /* Best-effort: drop the review photo from storage too */
    const path = data.photo_url ? storagePathFromUrl(data.photo_url) : null;
    if (path) await db.storage.from("product-images").remove([path]).catch(() => {});
  }
  return NextResponse.json({ success: true });
}
