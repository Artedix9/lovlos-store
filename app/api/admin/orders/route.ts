import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import type { SavedOrder } from "@/lib/orders";

const VALID_STATUSES = ["pending", "confirmed", "dispatched", "delivered", "cancelled"] as const;

/* Stock is held once payment is confirmed — pending orders never touch
   inventory, so an unpaid order can't block other customers. */
const HOLDS_STOCK = new Set<string>(["confirmed", "dispatched", "delivered"]);

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await getSupabase()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/**
 * DELETE /api/admin/orders — wipe ALL orders (testing-phase reset).
 *
 * Leaves the shop genuinely fresh:
 * - stock held by confirmed/dispatched/delivered orders is released back,
 * - promo redemption counters return to zero,
 * - revenue/profit stats read zero because they derive from orders.
 * Products, promo codes, reviews, and subscribers are untouched.
 */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const supabase = getSupabase();

  const { data: orders, error: fetchError } = await supabase.from("orders").select("*");
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  /* Release held stock before the orders disappear */
  const restore = new Map<string, number>();
  for (const o of (orders ?? []) as SavedOrder[]) {
    if (!HOLDS_STOCK.has(o.status)) continue;
    for (const item of o.items ?? []) {
      if (item.preorder) continue;
      restore.set(item.id, (restore.get(item.id) ?? 0) + (item.quantity || 1));
    }
  }
  for (const [productId, qty] of restore) {
    const { error: stockError } = await supabase.rpc("adjust_stock", {
      p_id: productId,
      p_delta: qty,
    });
    if (stockError) console.error(`[LOVLOS RESET STOCK ERROR] ${productId}:`, stockError);
  }

  const { error: deleteError } = await supabase.from("orders").delete().neq("id", "");
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { error: promoError } = await supabase
    .from("promo_codes")
    .update({ use_count: 0 })
    .neq("code", "");
  if (promoError) console.error("[LOVLOS RESET PROMO ERROR]", promoError);

  if (restore.size > 0) {
    revalidatePath("/");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/accessories");
    revalidatePath("/sale");
    for (const productId of restore.keys()) revalidatePath(`/product/${productId}`);
  }

  return NextResponse.json({
    deleted: orders?.length ?? 0,
    stockRestored: [...restore.values()].reduce((a, b) => a + b, 0),
  });
}

export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const { id, status } = body as { id?: string; status?: string };

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabase();

  /* Transitions are computed from the DB's current status, not the client's
     belief, so a stale dashboard can't double-adjust stock. */
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = existing as SavedOrder;
  if (order.status === status) return NextResponse.json(existing);

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /* ── Automatic stock adjustment ──
     Confirming takes the units out of inventory; cancelling (or reverting to
     pending) puts them back. Adjustments are atomic in SQL and floored at 0,
     and failures never undo the status change — they're logged for manual
     correction, matching the shop's manual-fulfilment tolerance. */
  const wasHeld = HOLDS_STOCK.has(order.status);
  const nowHeld = HOLDS_STOCK.has(status);
  if (wasHeld !== nowHeld) {
    const sign = nowHeld ? -1 : 1;
    const perProduct = new Map<string, number>();
    for (const item of order.items ?? []) {
      if (item.preorder) continue; /* pre-order units aren't stocked yet */
      perProduct.set(item.id, (perProduct.get(item.id) ?? 0) + (item.quantity || 1));
    }
    for (const [productId, qty] of perProduct) {
      const { error: stockError } = await supabase.rpc("adjust_stock", {
        p_id: productId,
        p_delta: sign * qty,
      });
      if (stockError) {
        console.error(`[LOVLOS STOCK ADJUST ERROR] ${order.id} → ${productId}:`, stockError);
      }
    }
    if (perProduct.size > 0) {
      /* Sold-out/back-in-stock states must show before the hourly ISR window */
      revalidatePath("/");
      revalidatePath("/men");
      revalidatePath("/women");
      revalidatePath("/accessories");
      revalidatePath("/sale");
      for (const productId of perProduct.keys()) {
        revalidatePath(`/product/${productId}`);
      }
    }
  }

  /* ── Promo redemption release ──
     A cancelled order frees its redemption so limited-use codes aren't
     exhausted by orders that never happened. */
  if (order.promo_code && (order.discount ?? 0) > 0) {
    const wasCounted = order.status !== "cancelled";
    const nowCounted = status !== "cancelled";
    if (wasCounted !== nowCounted) {
      const { error: promoError } = await supabase.rpc("adjust_promo_use", {
        p_code: order.promo_code,
        p_delta: nowCounted ? 1 : -1,
      });
      if (promoError) {
        console.error(`[LOVLOS PROMO ADJUST ERROR] ${order.id}:`, promoError);
      }
    }
  }

  return NextResponse.json(data);
}
