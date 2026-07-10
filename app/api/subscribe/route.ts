import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/subscribe — public email sign-up (footer + checkout opt-in).
 * Deduped by a unique constraint; repeat sign-ups succeed silently.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { email, source } = (body ?? {}) as { email?: unknown; source?: unknown };

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 254) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("email_subscribers")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          source: source === "checkout" ? "checkout" : "footer",
        },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[LOVLOS SUBSCRIBE ERROR]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
