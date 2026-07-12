import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { normalizePromoCode } from "@/lib/promo";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await getSupabase()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** POST — create a promo code. */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const code = normalizePromoCode(String(body.code ?? ""));
  const discountType = ["fixed", "free_delivery"].includes(body.discount_type)
    ? (body.discount_type as "fixed" | "free_delivery")
    : "percent";
  /* free_delivery has no amount of its own — the discount is the delivery fee */
  const discountValue =
    discountType === "free_delivery" ? 0 : Math.floor(Number(body.discount_value));
  const minSubtotal = Math.max(0, Math.floor(Number(body.min_subtotal)) || 0);
  const maxUses =
    body.max_uses == null || body.max_uses === "" ? null : Math.floor(Number(body.max_uses));
  const expiresAt = body.expires_at ? String(body.expires_at) : null;

  if (!/^[A-Z0-9-]{2,32}$/.test(code)) {
    return NextResponse.json(
      { error: "Code must be 2–32 letters, numbers, or dashes." },
      { status: 400 }
    );
  }
  if (discountType !== "free_delivery" && (!Number.isFinite(discountValue) || discountValue <= 0)) {
    return NextResponse.json({ error: "Discount must be a positive number." }, { status: 400 });
  }
  if (discountType === "percent" && discountValue > 100) {
    return NextResponse.json({ error: "Percentage discount can't exceed 100." }, { status: 400 });
  }
  if (maxUses != null && (!Number.isFinite(maxUses) || maxUses <= 0)) {
    return NextResponse.json({ error: "Max uses must be a positive number." }, { status: 400 });
  }

  const { error } = await getSupabase().from("promo_codes").insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    min_subtotal: minSubtotal,
    max_uses: maxUses,
    expires_at: expiresAt,
    active: true,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `Code ${code} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}

/** PUT { code, active } — enable/disable a code. */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const code = normalizePromoCode(String(body.code ?? ""));
  if (!code || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Missing code or active flag" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("promo_codes")
    .update({ active: body.active })
    .eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** DELETE ?code=XXX */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const code = normalizePromoCode(req.nextUrl.searchParams.get("code") ?? "");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const { error } = await getSupabase().from("promo_codes").delete().eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
