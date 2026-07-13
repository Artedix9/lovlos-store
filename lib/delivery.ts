/** Delivery pricing shared by the cart drawer, checkout, and order APIs.
 *
 *  The live values come from site_settings (editable in the admin with no
 *  redeploy): servers read them via getDeliveryConfig() in lib/settings.ts,
 *  clients via the useDeliveryConfig() hook. The constants below are only
 *  fallbacks when settings are missing or unreachable. */

export const DELIVERY_FEE = 5000; // TZS — fallback
export const FREE_DELIVERY_THRESHOLD = 150000; // TZS — fallback

export interface DeliveryConfig {
  fee: number;
  threshold: number;
}

export const DEFAULT_DELIVERY: DeliveryConfig = {
  fee: DELIVERY_FEE,
  threshold: FREE_DELIVERY_THRESHOLD,
};

export function deliveryFeeFor(subtotal: number, config: DeliveryConfig = DEFAULT_DELIVERY): number {
  return subtotal >= config.threshold ? 0 : config.fee;
}
