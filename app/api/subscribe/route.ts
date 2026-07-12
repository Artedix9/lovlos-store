import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { checkPromo, promoLabel, type PromoCode } from "@/lib/promo";

/**
 * POST /api/subscribe — public email sign-up (footer + checkout opt-in).
 * Deduped by a unique constraint; repeat sign-ups succeed silently.
 * When the admin has set a welcome code (site_settings.welcome_promo),
 * the response includes it so the footer can show the offer.
 */

async function welcomeOffer(): Promise<{ code: string; label: string } | null> {
  try {
    const supabase = getSupabase();
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "welcome_promo")
      .maybeSingle();
    const code = (setting?.value ?? "").trim().toUpperCase();
    if (!code) return null;

    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    /* Only advertise a code that would actually work on a typical order —
       min-order limits are checked with the code's own threshold met */
    const row = promo as PromoCode | null;
    if (!row) return null;
    const usable = checkPromo(row, Math.max(row.min_subtotal, 1), 1);
    if (!usable.ok) return null;

    return { code: row.code, label: promoLabel(row) };
  } catch {
    return null; /* never block a sign-up over the offer */
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { email, source } = (body ?? {}) as { email?: unknown; source?: unknown };

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 254) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("email_subscribers")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          source: source === "checkout" ? "checkout" : "footer",
        },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) throw error;
    return NextResponse.json({ success: true, welcome: await welcomeOffer() }, { status: 201 });
  } catch (err) {
    console.error("[LOVLOS SUBSCRIBE ERROR]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
