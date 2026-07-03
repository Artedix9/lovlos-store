import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/orders/track
 *
 * Looks up an order by ID + phone number. Both must match — the phone acts
 * as a lightweight ownership check so order IDs alone can't be enumerated.
 * POST keeps the phone number out of URLs and server logs.
 */

/** Tanzanian numbers share their last 9 digits across formats
    (0746 704 036 vs +255 746 704 036) — compare on that. */
function lastNine(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

const NOT_FOUND = NextResponse.json(
  { error: "No order found matching that ID and phone number." },
  { status: 404 }
);

interface StoredItem {
  name?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { orderId, phone } = (body ?? {}) as { orderId?: unknown; phone?: unknown };

    if (typeof orderId !== "string" || typeof phone !== "string") {
      return NextResponse.json({ error: "Order ID and phone number are required." }, { status: 400 });
    }

    const digits = lastNine(phone);
    if (digits.length < 9) return NOT_FOUND;

    /* Accept "LVL-ABC123" or bare "ABC123", any casing */
    const cleaned = orderId.trim().toUpperCase();
    const id = cleaned.startsWith("LVL-") ? cleaned : `LVL-${cleaned}`;

    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, phone, status, created_at, city, payment_method, items, subtotal, delivery_fee, total")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data || lastNine(data.phone) !== digits) return NOT_FOUND;

    /* Sanitized view — no name, email, or delivery note in the response */
    return NextResponse.json({
      order: {
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        city: data.city,
        payment_method: data.payment_method,
        items: ((data.items ?? []) as StoredItem[]).map((i) => ({
          name: i.name ?? "",
          size: i.size ?? "",
          color: i.color,
          quantity: i.quantity ?? 1,
          price: i.price ?? 0,
        })),
        subtotal: data.subtotal,
        delivery_fee: data.delivery_fee,
        total: data.total,
      },
    });
  } catch (err) {
    console.error("[LOVLOS TRACK ERROR]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
