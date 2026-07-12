/** Session-scoped stash for promo codes arriving via campaign links
 *  (?promo=CODE / ?code=CODE), picked up automatically at checkout. */

const KEY = "lvl-promo-code";

export function storePromoFromUrl(search: string): void {
  try {
    const params = new URLSearchParams(search);
    const code = (params.get("promo") ?? params.get("code") ?? "").trim().toUpperCase();
    if (code && /^[A-Z0-9-]{2,32}$/.test(code)) {
      sessionStorage.setItem(KEY, code);
    }
  } catch {
    /* storage unavailable (private mode) — campaign links just degrade */
  }
}

export function getStoredPromo(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearStoredPromo(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
