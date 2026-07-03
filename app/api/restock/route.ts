import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/restock
 *
 * Public endpoint: a shopper on a sold-out product leaves their WhatsApp
 * number to be notified on restock. Deduped per (product, phone) by a
 * unique constraint — repeat submissions succeed silently.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { productId, phone } = (body ?? {}) as { productId?: unknown; phone?: unknown };

    if (typeof productId !== "string" || typeof phone !== "string") {
      return NextResponse.json({ error: "Product and phone number are required." }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }

    const db = getSupabase();

    const { data: product } = await db.from("products").select("id").eq("id", productId).maybeSingle();
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { error } = await db
      .from("restock_requests")
      .upsert({ product_id: productId, phone: digits }, { onConflict: "product_id,phone", ignoreDuplicates: true });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[LOVLOS RESTOCK ERROR]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
