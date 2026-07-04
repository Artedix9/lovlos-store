import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";

/** GET → VAPID public key + how many devices are subscribed. */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const db = getSupabase();
  const [{ data: keyRow }, { count }] = await Promise.all([
    db.from("site_settings").select("value").eq("key", "vapid_public").maybeSingle(),
    db.from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);

  if (!keyRow?.value) {
    return NextResponse.json({ error: "Push keys are not configured." }, { status: 500 });
  }
  return NextResponse.json({ publicKey: keyRow.value, devices: count ?? 0 });
}

/** POST { subscription } → register this browser for new-order alerts. */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const subscription = body?.subscription;
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("push_subscriptions")
    .upsert({ endpoint: subscription.endpoint, subscription }, { onConflict: "endpoint" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
