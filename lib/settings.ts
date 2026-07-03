import { getSupabase } from "./supabase";

/** Announcement bar text — empty string hides the bar. Empty on any failure. */
export async function getAnnouncement(): Promise<string> {
  try {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle();

    if (error || !data) return "";
    return data.value ?? "";
  } catch {
    return "";
  }
}
