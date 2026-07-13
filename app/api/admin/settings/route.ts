import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await getSupabase().from("site_settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  /* vapid_private stays server-side only */
  const rows = (data ?? []).filter((r) => !r.key.startsWith("vapid"));
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

/** PUT { key, value } — currently used for the announcement bar text. */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const { key, value } = body as { key?: string; value?: string };
  if (!key || typeof value !== "string") {
    return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
  }

  /* Delivery pricing keys must be non-negative whole TZS amounts */
  if (["delivery_fee", "free_delivery_threshold"].includes(key)) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "Enter a whole TZS amount (0 or more)." }, { status: 400 });
    }
  }

  const { error } = await getSupabase()
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The announcement bar renders from the root layout on every page.
  revalidatePath("/", "layout");
  // Cart/checkout read delivery pricing from this cached route.
  if (["delivery_fee", "free_delivery_threshold"].includes(key)) {
    revalidatePath("/api/delivery");
  }
  return NextResponse.json({ success: true });
}
