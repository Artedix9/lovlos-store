import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { getAllHeroImages } from "@/lib/hero";

const VALID_PAGES = ["home", "women", "men", "accessories"] as const;
type Page = (typeof VALID_PAGES)[number];

const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  women: "/women",
  men: "/men",
  accessories: "/accessories",
};

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-key") === secret;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const heroes = await getAllHeroImages();
  return NextResponse.json(heroes);
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { page, desktop_src, mobile_src } = body;

  if (!page || !VALID_PAGES.includes(page as Page)) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("hero_images")
    .upsert({ page, desktop_src: desktop_src ?? "", mobile_src: mobile_src ?? "" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(PAGE_PATHS[page as Page]);

  return NextResponse.json({ success: true });
}
