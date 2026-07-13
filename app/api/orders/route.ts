import { NextRequest, NextResponse } from "next/server";
import type { OrderPayload, SavedOrder } from "@/lib/orders";
import { checkPromo, normalizePromoCode, type PromoCode } from "@/lib/promo";
import { deliveryFeeFor } from "@/lib/delivery";
import { getDeliveryConfig } from "@/lib/settings";

/**
 * POST /api/orders
 *
 * Saves the order and returns the saved record including the generated ID.
 *
 * Supabase integration: install `@supabase/supabase-js`, add
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local,
 * then swap the mock block below for the real insert.
 *
 * Schema (SQL):
 * ─────────────────────────────────────────────────────────────
 * create table orders (
 *   id              text primary key,
 *   customer_name   text not null,
 *   phone           text not null,
 *   email           text not null,
 *   city            text not null,
 *   delivery_note   text,
 *   payment_method  text not null,
 *   items           jsonb not null,
 *   subtotal        integer not null,
 *   delivery_fee    integer not null,
 *   total           integer not null,
 *   status          text not null default 'pending',
 *   created_at      timestamptz not null default now()
 * );
 * ─────────────────────────────────────────────────────────────
 */
export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();

    const order: SavedOrder = {
      ...body,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    /* Stock check — quantities are summed per product because sizes/colors
       share one stock pool. Two pending orders can still race for the last
       unit; the manual WhatsApp confirmation step is where that resolves. */
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    }
    const wanted = new Map<string, number>();
    for (const item of order.items) {
      wanted.set(item.id, (wanted.get(item.id) ?? 0) + (item.quantity || 1));
    }
    /* select("*") stays resilient while schema changes roll out — naming a
       column that isn't live yet would fail every checkout */
    const { data: stockRows, error: stockError } = await supabase
      .from("products")
      .select("*")
      .in("id", [...wanted.keys()]);
    if (stockError) throw stockError;
    for (const [productId, qty] of wanted) {
      const row = (stockRows ?? []).find((r) => r.id === productId);
      if (!row) {
        return NextResponse.json(
          { error: "An item in your bag is no longer available. Please remove it and try again." },
          { status: 409 }
        );
      }
      /* Pre-order items (per the DB, not the client) have no stock to check */
      if (row.is_coming_soon && row.preorder) continue;
      if ((row.stock_quantity ?? 0) < qty) {
        const left = row.stock_quantity ?? 0;
        return NextResponse.json(
          {
            error:
              left === 0
                ? `"${row.name}" has just sold out. Please remove it from your bag.`
                : `Only ${left} of "${row.name}" ${left === 1 ? "is" : "are"} left — please reduce the quantity.`,
          },
          { status: 409 }
        );
      }
    }

    /* Delivery fee is recomputed from the live admin-configured pricing —
       the client's figure is display-only. */
    const deliveryConfig = await getDeliveryConfig();
    order.delivery_fee = deliveryFeeFor(order.subtotal, deliveryConfig);

    /* Promo — re-validated here so the client-side discount is never trusted. */
    let promoCode: string | null = null;
    let discount = 0;
    if (order.promo_code) {
      const code = normalizePromoCode(order.promo_code);
      const { data: promoRow, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (promoError) throw promoError;
      const result = checkPromo(
        (promoRow as PromoCode | null) ?? null,
        order.subtotal,
        order.delivery_fee
      );
      if (!result.ok) {
        return NextResponse.json(
          { error: `${result.reason} Remove the code and try again.` },
          { status: 409 }
        );
      }
      promoCode = code;
      discount = result.discount;
      order.promo_code = code;
      order.discount = discount;
    }

    /* Total always derives from server-side figures */
    order.total = order.subtotal - discount + order.delivery_fee;

    /* Snapshot each item's buying cost for profit reporting. Stored only —
       the response below returns the client's items, so cost never reaches
       the customer's browser. */
    const itemsWithCost = order.items.map((item) => ({
      ...item,
      cost: (stockRows ?? []).find((r) => r.id === item.id)?.cost_price ?? null,
    }));

    const { error } = await supabase.from("orders").insert({
      id:             order.id,
      customer_name:  order.customer_name,
      phone:          order.phone,
      email:          order.email,
      city:           order.city,
      delivery_note:  order.delivery_note,
      payment_method: order.payment_method,
      items:          itemsWithCost,
      subtotal:       order.subtotal,
      delivery_fee:   order.delivery_fee,
      total:          order.total,
      status:         order.status,
      /* Promo columns only when a promo applies — keeps regular checkouts
         working until supabase/promo-codes.sql has been run */
      ...(promoCode ? { promo_code: promoCode, discount } : {}),
    });
    if (error) {
      console.error("SUPABASE_ERROR_DETAIL:", error);
      throw error;
    }

    /* Count the redemption. Never blocks the order — worst case a code is
       used slightly past its limit, which manual confirmation absorbs.
       (Cancelling the order later releases the redemption again.) */
    if (promoCode) {
      const { error: useError } = await supabase.rpc("adjust_promo_use", { p_code: promoCode, p_delta: 1 });
      if (useError) console.error("[LOVLOS PROMO USE ERROR]", useError);
    }

    /* Alert the admin's subscribed devices. Never blocks the order. */
    try {
      const [{ data: keys }, { data: subs }] = await Promise.all([
        supabase.from("site_settings").select("key, value").in("key", ["vapid_public", "vapid_private"]),
        supabase.from("push_subscriptions").select("id, subscription"),
      ]);
      const publicKey = keys?.find((k) => k.key === "vapid_public")?.value;
      const privateKey = keys?.find((k) => k.key === "vapid_private")?.value;

      if (publicKey && privateKey && subs?.length) {
        const webpush = (await import("web-push")).default;
        webpush.setVapidDetails("mailto:edrickkata09@gmail.com", publicKey, privateKey);

        const hasPreorder = order.items.some((i) => i.preorder);
        const payload = JSON.stringify({
          title: `New order ${order.id}${hasPreorder ? " (pre-order)" : ""}`,
          body: `${order.customer_name} — TZS ${order.total.toLocaleString("en-TZ")} · ${order.city} · ${
            order.payment_method === "mobile-money" ? "Mobile Money" : "Cash on Delivery"
          }`,
          url: "/admin",
        });

        await Promise.allSettled(
          subs.map(async (row) => {
            try {
              await webpush.sendNotification(row.subscription, payload);
            } catch (e: unknown) {
              const statusCode = (e as { statusCode?: number }).statusCode;
              /* Subscription expired or revoked — clean it up */
              if (statusCode === 404 || statusCode === 410) {
                await supabase.from("push_subscriptions").delete().eq("id", row.id);
              }
            }
          })
        );
      }
    } catch (pushErr) {
      console.error("[LOVLOS PUSH ERROR]", pushErr);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[LOVLOS ORDER ERROR]", err);
    return NextResponse.json(
      { error: "Failed to save order. Please try again." },
      { status: 500 }
    );
  }
}
