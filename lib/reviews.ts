import { getSupabase } from "./supabase";

export interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;      // 1–5
  body: string;
  photo_url: string | null;
  created_at: string;
}

/** Approved reviews for one product, newest first. Empty on any failure. */
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  try {
    const { data, error } = await getSupabase()
      .from("product_reviews")
      .select("id, product_id, author, rating, body, photo_url, created_at")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
