import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { waPhone } from "@/lib/followups";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await getSupabase().from("customers").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** PUT { phone, opted_in?, vip?, note? } — upsert one customer's preferences. */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const phone = waPhone(String(body.phone ?? ""));
  if (phone.length < 9) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const row: Record<string, unknown> = { phone, updated_at: new Date().toISOString() };
  if (typeof body.opted_in === "boolean") row.opted_in = body.opted_in;
  if (typeof body.vip === "boolean") row.vip = body.vip;
  if (typeof body.note === "string") row.note = body.note.slice(0, 500);

  const { data, error } = await getSupabase()
    .from("customers")
    .upsert(row, { onConflict: "phone" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
