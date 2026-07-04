import { NextRequest, NextResponse } from "next/server";
import type { OrderPayload, SavedOrder } from "@/lib/orders";

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
    const { data: stockRows, error: stockError } = await supabase
      .from("products")
      .select("id, name, stock_quantity")
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

    const { error } = await supabase.from("orders").insert({
      id:             order.id,
      customer_name:  order.customer_name,
      phone:          order.phone,
      email:          order.email,
      city:           order.city,
      delivery_note:  order.delivery_note,
      payment_method: order.payment_method,
      items:          order.items,
      subtotal:       order.subtotal,
      delivery_fee:   order.delivery_fee,
      total:          order.total,
      status:         order.status,
    });
    if (error) {
      console.error("SUPABASE_ERROR_DETAIL:", error);
      throw error;
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

        const payload = JSON.stringify({
          title: `New order ${order.id}`,
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
