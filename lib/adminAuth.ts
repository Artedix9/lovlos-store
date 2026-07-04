import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Shared admin auth for all /api/admin routes.
 *
 * - Constant-time key comparison (no timing side channel).
 * - Per-IP lockout after repeated failures. The counter is in-memory, so
 *   each serverless instance tracks its own window — imperfect, but it
 *   still turns "hammer the key" from thousands of tries into a handful.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

const failures = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function keysMatch(provided: string, secret: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Returns null when authorized; otherwise the 401/429 response to send. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const now = Date.now();
  const rec = failures.get(ip);
  if (rec && rec.resetAt <= now) failures.delete(ip);

  const active = failures.get(ip);
  if (active && active.count >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  if (keysMatch(req.headers.get("x-admin-key") ?? "", secret)) {
    failures.delete(ip);
    return null;
  }

  if (active) {
    active.count += 1;
  } else {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
