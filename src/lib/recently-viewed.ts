const KEY = 'ddalkkak-recently-viewed';
const MAX = 12;

export interface RecentlyViewedItem {
  product_id: string;
  title: string;
  image: string;
  price_krw: number;
  visited_at: string;
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'visited_at'>): void {
  const list = getRecentlyViewed().filter((i) => i.product_id !== item.product_id);
  list.unshift({ ...item, visited_at: new Date().toISOString() });
  if (list.length > MAX) list.length = MAX;
  localStorage.setItem(KEY, JSON.stringify(list));
}
