import { NextResponse } from "next/server";
import { getDeliveryConfig } from "@/lib/settings";

/** Public delivery pricing for client components (cart drawer, checkout).
 *  Cached; the admin settings PUT revalidates this path on change. */
export const revalidate = 3600;

export async function GET() {
  const config = await getDeliveryConfig();
  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
