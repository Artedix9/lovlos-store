import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

/** POST { ids } — full product id list in the desired display order. */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "ids must be a non-empty array of product ids" }, { status: 400 });
  }

  const db = getSupabase();
  const results = await Promise.all(
    ids.map((id, index) => db.from("products").update({ sort_order: index }).eq("id", id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  revalidatePath("/");
  revalidatePath("/men");
  revalidatePath("/women");
  revalidatePath("/accessories");
  return NextResponse.json({ success: true });
}
