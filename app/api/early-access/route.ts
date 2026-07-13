import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizePromoCode } from "@/lib/promo";

/**
 * POST /api/early-access  { id, code }
 *
 * Public unlock check for gated (publish_at in the future) products. Returns
 * only a boolean so the access code itself never leaves the server. The
 * order API enforces the same rule — this endpoint is display-only.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id ?? "");
    const code = normalizePromoCode(String(body.code ?? ""));
    if (!id) return NextResponse.json({ unlocked: false });

    const { data, error } = await getSupabase()
      .from("products")
      .select("publish_at, access_code")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ unlocked: false });

    const gated = !!data.publish_at && new Date(data.publish_at).getTime() > Date.now();
    const unlocked =
      !gated ||
      (!!data.access_code && !!code && code === String(data.access_code).toUpperCase());
    return NextResponse.json({ unlocked });
  } catch (err) {
    console.error("[LOVLOS EARLY ACCESS ERROR]", err);
    return NextResponse.json({ unlocked: false });
  }
}
