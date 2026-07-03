import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/reviews — public review submission (multipart/form-data).
 *
 * Fields: productId, author, rating (1–5), body, photo (optional file).
 * Reviews are inserted unapproved and only appear after moderation in
 * the admin Reviews tab. The optional photo is uploaded server-side so
 * there is no standalone public upload endpoint.
 */

const PHOTO_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const PHOTO_MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const productId = form.get("productId");
    const author = form.get("author");
    const rating = Number(form.get("rating"));
    const body = form.get("body");
    const photo = form.get("photo");

    if (typeof productId !== "string" || typeof author !== "string" || typeof body !== "string") {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!author.trim() || author.length > 60) {
      return NextResponse.json({ error: "Please enter your name (max 60 characters)." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Please select a rating." }, { status: 400 });
    }
    if (!body.trim() || body.length > 1000) {
      return NextResponse.json({ error: "Please write a review (max 1000 characters)." }, { status: 400 });
    }

    const db = getSupabase();

    const { data: product } = await db.from("products").select("id").eq("id", productId).maybeSingle();
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    let photoUrl: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      if (!PHOTO_TYPES.has(photo.type)) {
        return NextResponse.json({ error: "Photo must be a JPG, PNG, or WEBP image." }, { status: 400 });
      }
      if (photo.size > PHOTO_MAX_BYTES) {
        return NextResponse.json({ error: "Photo must be under 3 MB." }, { status: 400 });
      }
      const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
      const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await photo.arrayBuffer());
      const { error: uploadError } = await db.storage
        .from("product-images")
        .upload(path, buffer, { contentType: photo.type, upsert: false });
      if (uploadError) throw uploadError;
      photoUrl = db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await db.from("product_reviews").insert({
      product_id: productId,
      author: author.trim(),
      rating,
      body: body.trim(),
      photo_url: photoUrl,
      approved: false,
    });
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[LOVLOS REVIEW ERROR]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
