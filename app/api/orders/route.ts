import { NextRequest, NextResponse } from "next/server";
import { generateOrderId } from "@/lib/orders";
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
      id: generateOrderId(),
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[LOVLOS ORDER ERROR]", err);
    return NextResponse.json(
      { error: "Failed to save order. Please try again." },
      { status: 500 }
    );
  }
}
