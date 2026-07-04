/**
 * Device-local order history + checkout profile.
 *
 * There are no password accounts — checkout is WhatsApp/M-Pesa based — so
 * "my account" lives in localStorage: every placed order is recorded here,
 * and the customer's details prefill the next checkout. The /orders page
 * uses the stored id+phone pair to fetch live statuses via /api/orders/track.
 */

export interface LocalOrder {
  id: string;
  phone: string;
  total: number;
  city: string;
  created_at: string;
}

export interface CheckoutProfile {
  name: string;
  phone: string;
  email: string;
  city: string;
}

const HISTORY_KEY = "lvl-order-history";
const PROFILE_KEY = "lvl-checkout-profile";
const HISTORY_MAX = 20;

export function getOrderHistory(): LocalOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as LocalOrder[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordOrder(order: LocalOrder): void {
  try {
    const list = [order, ...getOrderHistory().filter((o) => o.id !== order.id)].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* storage full/blocked — history is a convenience, never fatal */
  }
}

export function getCheckoutProfile(): CheckoutProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutProfile) : null;
  } catch {
    return null;
  }
}

export function saveCheckoutProfile(profile: CheckoutProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}
