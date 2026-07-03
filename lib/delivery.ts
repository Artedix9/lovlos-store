/** Delivery pricing shared by the cart drawer and checkout. */

export const DELIVERY_FEE = 5000; // TZS
export const FREE_DELIVERY_THRESHOLD = 150000; // TZS

export function deliveryFeeFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
