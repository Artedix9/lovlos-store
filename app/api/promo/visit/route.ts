import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizePromoCode } from "@/lib/promo";

/**
 * POST /api/promo/visit  { code }
 *
 * Counts a campaign-link landing (?promo=CODE). Fire-and-forget from the
 * client, once per session; unknown codes no-op inside the SQL function so
 * nothing about valid codes leaks. Always returns ok.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = normalizePromoCode(String(body.code ?? ""));
    if (code && /^[A-Z0-9-]{2,32}$/.test(code)) {
      const { error } = await getSupabase().rpc("adjust_promo_visit", { p_code: code });
      if (error) console.error("[LOVLOS PROMO VISIT ERROR]", error);
    }
  } catch {
    /* never bubble to the visitor */
  }
  return NextResponse.json({ ok: true });
}
