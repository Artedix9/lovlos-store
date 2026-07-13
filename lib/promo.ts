/** Promo code types and validation shared by checkout, the public
 *  validate endpoint, and the order API's server-side re-check. */

export interface PromoCode {
  code: string;
  discount_type: "percent" | "fixed" | "free_delivery";
  discount_value: number;
  min_subtotal: number;
  max_uses: number | null;
  use_count: number;
  visit_count?: number; // campaign-link landings (?promo=CODE), once per session
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Discount in TZS for this promo at this subtotal (never exceeds the subtotal).
 *  Free-delivery codes discount exactly the delivery fee that would be charged. */
export function promoDiscountFor(
  promo: Pick<PromoCode, "discount_type" | "discount_value">,
  subtotal: number,
  deliveryFee = 0
): number {
  if (promo.discount_type === "free_delivery") return Math.max(deliveryFee, 0);
  const raw =
    promo.discount_type === "percent"
      ? Math.round((subtotal * promo.discount_value) / 100)
      : promo.discount_value;
  return Math.min(Math.max(raw, 0), subtotal);
}

export type PromoCheck =
  | { ok: true; discount: number }
  | { ok: false; reason: string };

/** Full eligibility check. `promo` is null when the code wasn't found. */
export function checkPromo(
  promo: PromoCode | null,
  subtotal: number,
  deliveryFee = 0
): PromoCheck {
  if (!promo || !promo.active) {
    return { ok: false, reason: "That promo code isn't valid." };
  }
  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "That promo code has expired." };
  }
  if (promo.max_uses != null && promo.use_count >= promo.max_uses) {
    return { ok: false, reason: "That promo code has been fully redeemed." };
  }
  if (subtotal < promo.min_subtotal) {
    return {
      ok: false,
      reason: `This code needs a minimum order of TZS ${promo.min_subtotal.toLocaleString("en-TZ")}.`,
    };
  }
  return { ok: true, discount: promoDiscountFor(promo, subtotal, deliveryFee) };
}

/** Human-readable summary, e.g. "10% off", "TZS 5,000 off", or "Free delivery". */
export function promoLabel(promo: Pick<PromoCode, "discount_type" | "discount_value">): string {
  if (promo.discount_type === "free_delivery") return "Free delivery";
  return promo.discount_type === "percent"
    ? `${promo.discount_value}% off`
    : `TZS ${promo.discount_value.toLocaleString("en-TZ")} off`;
}
