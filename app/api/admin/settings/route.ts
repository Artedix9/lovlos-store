import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-key") === secret;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase().from("site_settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])));
}

/** PUT { key, value } — currently used for the announcement bar text. */
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { key, value } = body as { key?: string; value?: string };
  if (!key || typeof value !== "string") {
    return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The announcement bar renders from the root layout on every page.
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
