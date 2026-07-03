/** Recently-viewed products, persisted in localStorage (no account needed). */

const STORAGE_KEY = "lovlos-recently-viewed";
const MAX_ITEMS = 8;

export interface RecentItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function getRecentlyViewed(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as RecentItem[]).filter(
      (i) => typeof i?.id === "string" && typeof i?.name === "string" && typeof i?.price === "number"
    );
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: RecentItem): void {
  try {
    const next = [item, ...getRecentlyViewed().filter((i) => i.id !== item.id)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — feature silently degrades */
  }
}
