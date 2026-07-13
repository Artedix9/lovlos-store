import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { deliveryFeeFor } from "@/lib/delivery";
import { getDeliveryConfig } from "@/lib/settings";
import { checkPromo, normalizePromoCode, type PromoCode } from "@/lib/promo";

/**
 * POST /api/promo/validate  { code, subtotal }
 *
 * Public — called from checkout when the customer applies a code.
 * Returns the promo's discount terms so the client can re-derive the
 * discount as the bag changes; the order API re-validates on submit,
 * so nothing here is trusted for money.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = normalizePromoCode(String(body.code ?? ""));
    const subtotal = Number(body.subtotal) || 0;
    if (!code) {
      return NextResponse.json({ error: "Enter a promo code." }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw error;

    const promo = (data as PromoCode | null) ?? null;
    const result = checkPromo(promo, subtotal, deliveryFeeFor(subtotal, await getDeliveryConfig()));
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({
      promo: {
        code: promo!.code,
        discount_type: promo!.discount_type,
        discount_value: promo!.discount_value,
        min_subtotal: promo!.min_subtotal,
      },
      discount: result.discount,
    });
  } catch (err) {
    console.error("[LOVLOS PROMO ERROR]", err);
    return NextResponse.json(
      { error: "Couldn't check that code right now. Please try again." },
      { status: 500 }
    );
  }
}
