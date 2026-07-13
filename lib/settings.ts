import { getSupabase } from "./supabase";
import { DEFAULT_DELIVERY, type DeliveryConfig } from "./delivery";

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

/** Delivery fee + free-delivery threshold from site_settings, with the
 *  lib/delivery constants as fallbacks on any failure or bad value. */
export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  try {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("key, value")
      .in("key", ["delivery_fee", "free_delivery_threshold"]);

    if (error || !data) return DEFAULT_DELIVERY;
    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    const fee = Number(map.delivery_fee);
    const threshold = Number(map.free_delivery_threshold);
    return {
      fee: Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_DELIVERY.fee,
      threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : DEFAULT_DELIVERY.threshold,
    };
  } catch {
    return DEFAULT_DELIVERY;
  }
}
