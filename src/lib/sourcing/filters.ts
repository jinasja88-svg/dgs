/**
 * Shop 페이지 다중 필터 — 상태 / URL 직렬화 / 클라이언트 필터링.
 *
 * 서버에 위임하는 필드: keyword, category, sort
 * 클라이언트에서 필터링: priceMin/Max, rating, repurchase, shipping, features
 */

import type { SourcingProduct } from '@/types';

export type SortOption =
  | 'recommend'
  | 'sales'
  | 'price_up'
  | 'price_down'
  | 'rating'
  | 'repurchase';

export type ShopRatingFilter = 'any' | '4' | '4.5' | '5';
export type ShopRepurchaseFilter = 'any' | '95' | '99';
export type ShopShippingFilter = 'same_day' | '24h' | '48h';
export type ShopFeatureFilter =
  | 'select_1688'
  | 'new_30d'
  | 'new_7d'
  | 'return_7d'
  | 'super_factory'
  | 'free_shipping'
  | 'plus';

export interface ShopFilters {
  keyword: string;
  category: string;
  sort: SortOption;
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: 'CNY' | 'KRW';
  rating: ShopRatingFilter;
  repurchase: ShopRepurchaseFilter;
  shipping: ShopShippingFilter[];
  features: ShopFeatureFilter[];
}

export const DEFAULT_FILTERS: ShopFilters = {
  keyword: '',
  category: '',
  sort: 'rating',
  priceMin: null,
  priceMax: null,
  priceCurrency: 'KRW',
  rating: 'any',
  repurchase: 'any',
  shipping: [],
  features: [],
};

const VALID_SORTS: SortOption[] = [
  'recommend',
  'sales',
  'price_up',
  'price_down',
  'rating',
  'repurchase',
];
const VALID_RATINGS: ShopRatingFilter[] = ['any', '4', '4.5', '5'];
const VALID_REPURCHASE: ShopRepurchaseFilter[] = ['any', '95', '99'];
const VALID_SHIPPING: ShopShippingFilter[] = ['same_day', '24h', '48h'];
const VALID_FEATURES: ShopFeatureFilter[] = [
  'select_1688',
  'new_30d',
  'new_7d',
  'return_7d',
  'super_factory',
  'free_shipping',
  'plus',
];

function parseListParam<T extends string>(value: string | null, valid: readonly T[]): T[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is T => (valid as readonly string[]).includes(v));
}

export function searchParamsToFilters(sp: URLSearchParams | ReadonlyURLSearchParams): ShopFilters {
  const get = (key: string) => sp.get(key);
  const sort = get('sort');
  const rating = get('rate');
  const repur = get('repur');
  const cur = get('cur');

  const pminRaw = get('pmin');
  const pmaxRaw = get('pmax');
  const pmin = pminRaw !== null && pminRaw !== '' ? Number(pminRaw) : null;
  const pmax = pmaxRaw !== null && pmaxRaw !== '' ? Number(pmaxRaw) : null;

  return {
    keyword: get('q') || '',
    category: get('cat') || '',
    sort: VALID_SORTS.includes(sort as SortOption) ? (sort as SortOption) : DEFAULT_FILTERS.sort,
    priceMin: pmin !== null && Number.isFinite(pmin) ? pmin : null,
    priceMax: pmax !== null && Number.isFinite(pmax) ? pmax : null,
    priceCurrency: cur === 'CNY' ? 'CNY' : 'KRW',
    rating: VALID_RATINGS.includes(rating as ShopRatingFilter)
      ? (rating as ShopRatingFilter)
      : 'any',
    repurchase: VALID_REPURCHASE.includes(repur as ShopRepurchaseFilter)
      ? (repur as ShopRepurchaseFilter)
      : 'any',
    shipping: parseListParam(get('ship'), VALID_SHIPPING),
    features: parseListParam(get('feat'), VALID_FEATURES),
  };
}

interface ReadonlyURLSearchParams {
  get(name: string): string | null;
}

export function filtersToSearchParams(f: ShopFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.keyword) sp.set('q', f.keyword);
  if (f.category) sp.set('cat', f.category);
  if (f.sort && f.sort !== DEFAULT_FILTERS.sort) sp.set('sort', f.sort);
  if (f.priceMin !== null) sp.set('pmin', String(f.priceMin));
  if (f.priceMax !== null) sp.set('pmax', String(f.priceMax));
  if (f.priceCurrency !== DEFAULT_FILTERS.priceCurrency) sp.set('cur', f.priceCurrency);
  if (f.rating !== 'any') sp.set('rate', f.rating);
  if (f.repurchase !== 'any') sp.set('repur', f.repurchase);
  if (f.shipping.length) sp.set('ship', f.shipping.join(','));
  if (f.features.length) sp.set('feat', f.features.join(','));
  return sp;
}

export function countActiveFilters(f: ShopFilters): number {
  let n = 0;
  if (f.priceMin !== null || f.priceMax !== null) n++;
  if (f.rating !== 'any') n++;
  if (f.repurchase !== 'any') n++;
  n += f.shipping.length;
  n += f.features.length;
  return n;
}

/** 클라이언트 사이드 필터링 — 서버에서 안 거른 필드만 적용 */
export function applyClientFilters(products: SourcingProduct[], f: ShopFilters): SourcingProduct[] {
  if (!products.length) return products;

  const minRating =
    f.rating === '5' ? 5 : f.rating === '4.5' ? 4.5 : f.rating === '4' ? 4 : null;
  const minRepurchase =
    f.repurchase === '99' ? 99 : f.repurchase === '95' ? 95 : null;

  return products.filter((p) => {
    // ── price range ──
    if (f.priceCurrency === 'CNY') {
      if (f.priceMin !== null && p.price_cny < f.priceMin) return false;
      if (f.priceMax !== null && p.price_cny > f.priceMax) return false;
    } else {
      if (f.priceMin !== null && p.price_krw < f.priceMin) return false;
      if (f.priceMax !== null && p.price_krw > f.priceMax) return false;
    }

    // ── rating ──
    if (minRating !== null) {
      const r = p.seller?.rating;
      if (r == null || r < minRating) return false;
    }

    // ── repurchase rate ──
    if (minRepurchase !== null) {
      const rp = p.seller?.repurchase_rate;
      if (rp == null || rp < minRepurchase) return false;
    }

    // ── shipping ──
    if (f.shipping.length) {
      const wants24h = f.shipping.includes('24h') || f.shipping.includes('same_day');
      const wants48h = f.shipping.includes('48h');
      if (wants24h && !p.ships_in_24h) return false;
      if (wants48h && !p.ships_in_48h && !p.ships_in_24h) return false;
    }

    // ── features ──
    for (const feat of f.features) {
      switch (feat) {
        case 'select_1688':
          if (!p.is_1688_select) return false;
          break;
        case 'new_7d':
          if (!p.is_new) return false;
          break;
        case 'new_30d':
          if (!p.is_new) return false;
          break;
        case 'return_7d':
          if (!p.return_in_7d) return false;
          break;
        case 'super_factory':
          if (!p.is_super_factory) return false;
          break;
        case 'free_shipping':
          if (!p.free_shipping) return false;
          break;
        case 'plus':
          if (!p.badges?.some((b) => b.type === 'plus')) return false;
          break;
      }
    }

    return true;
  });
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommend', label: '추천순' },
  { value: 'sales', label: '판매량순' },
  { value: 'price_up', label: '낮은가격순' },
  { value: 'price_down', label: '높은가격순' },
  { value: 'rating', label: '평점순' },
  { value: 'repurchase', label: '재구매율순' },
];

export const FEATURE_LABELS: Record<ShopFeatureFilter, string> = {
  select_1688: '1688 엄선',
  new_7d: '7일 내 신상품',
  new_30d: '신상품',
  return_7d: '7일 반품',
  super_factory: '실력공장',
  free_shipping: '무료배송',
  plus: 'PLUS',
};

export const SHIPPING_LABELS: Record<ShopShippingFilter, string> = {
  same_day: '당일 배송',
  '24h': '24시간 내 배송',
  '48h': '48시간 내 배송',
};

export const RATING_LABELS: Record<ShopRatingFilter, string> = {
  any: '전체',
  '4': '★ 4.0+',
  '4.5': '★ 4.5+',
  '5': '★ 5.0',
};

export const REPURCHASE_LABELS: Record<ShopRepurchaseFilter, string> = {
  any: '전체',
  '95': '95%+',
  '99': '99%+',
};
