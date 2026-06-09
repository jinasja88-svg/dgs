import type { SourcingProduct, SourcingSku, SourcingSeller, SourcingBadge } from '@/types';
import type { TmapiSearchItem, TmapiItemDetail, TmapiImageSearchItem } from './types';
import { toDdalkkakKrw } from '@/lib/sourcing/pricing';

function parsePriceRange(priceStr: string): number {
  if (!priceStr) return 0;
  const first = priceStr.split('-')[0];
  return parseFloat(first) || 0;
}

function parsePriceMax(priceStr: string): number | undefined {
  if (!priceStr) return undefined;
  const parts = priceStr.split('-').map((p) => parseFloat(p)).filter((n) => Number.isFinite(n));
  if (parts.length <= 1) return undefined;
  return Math.max(...parts);
}

function parsePercent(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return undefined;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function parseCount(value?: string | number | null): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function daysSince(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  if (isNaN(t)) return Number.POSITIVE_INFINITY;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function tagsHas(tags: string[] | undefined, ...needles: RegExp[]): boolean {
  if (!tags?.length) return false;
  return tags.some((t) => needles.some((re) => re.test(t)));
}

function buildServiceLabels(tags?: string[]): string[] {
  if (!tags?.length) return [];
  const labels: string[] = [];
  const add = (label: string) => {
    if (!labels.includes(label)) labels.push(label);
  };

  for (const tag of tags) {
    if (/1688Select|select1688/i.test(tag)) add('1688 엄선');
    else if (/7daysReturn|7day|return/i.test(tag)) add('7일 반품');
    else if (/quality|assurance|cert/i.test(tag)) add('품질 보장');
    else if (/drop|consign|proxy/i.test(tag)) add('위탁판매 지원');
  }
  return labels.slice(0, 6);
}

function buildSearchItemBadges(item: TmapiSearchItem): {
  badges: SourcingBadge[];
  is_new: boolean;
  is_1688_select: boolean;
  free_shipping: boolean;
  return_in_7d: boolean;
} {
  const badges: SourcingBadge[] = [];
  const tags = item.service_tags;
  const dateAdded = item.sale_info?.date_added;
  const daysOld = daysSince(dateAdded);
  const is1688Select = tagsHas(tags, /1688Select/i, /select1688/i);
  const isReturn7d = tagsHas(tags, /7daysReturn/i, /7day/i, /return/i);

  // voltage 보호 — 가장 중요한 배지 1개만 primary
  if (is1688Select) {
    badges.push({ type: 'select_1688', label: '1688 엄선', tone: 'primary' });
  } else if (item.shop_info?.is_plus) {
    badges.push({ type: 'plus', label: 'PLUS', tone: 'primary' });
  }

  // 보조 배지 — 흰 면 + 잉크 텍스트
  const isNew7 = item.sale_info?.is_new === true || daysOld <= 7;
  const isNew30 = !isNew7 && daysOld <= 30;
  if (isNew7) {
    badges.push({ type: 'new_7d', label: '신상품', tone: 'ink' });
  } else if (isNew30) {
    badges.push({ type: 'new_30d', label: '신상품', tone: 'muted' });
  }
  if (item.shop_info?.is_super_factory) {
    badges.push({ type: 'super_factory', label: '실력공장', tone: 'muted' });
  }
  if (item.delivery_info?.free_shipping) {
    badges.push({ type: 'free_shipping', label: '무료배송', tone: 'success' });
  }
  if (isReturn7d) {
    badges.push({ type: 'return_7d', label: '7일 반품', tone: 'success' });
  }

  return {
    badges: badges.slice(0, 2), // DESIGN.md §6.4 — 좌상단 배지 최대 2개
    is_new: isNew7 || isNew30,
    is_1688_select: is1688Select,
    free_shipping: !!item.delivery_info?.free_shipping,
    return_in_7d: isReturn7d,
  };
}

export function mapSearchItemToSourcingProduct(
  item: TmapiSearchItem,
  exchangeRate: number
): SourcingProduct {
  const priceRaw = item.price_info?.sale_price || item.price;
  const priceCny = parsePriceRange(priceRaw);
  const sales90d = parseCount(item.sale_info?.sale_quantity_90days);
  const rating = item.shop_info?.score_info?.composite_score
    ? parseFloat(item.shop_info.score_info.composite_score)
    : undefined;
  const repurchaseRate = parsePercent(item.item_repurchase_rate);
  const sig = buildSearchItemBadges(item);
  const ships24Rate = parsePercent(item.delivery_info?.delivery_24h_rate);
  const ships48Rate = parsePercent(item.delivery_info?.delivery_48h_rate);

  return {
    product_id: String(item.item_id),
    title: item.title,
    title_zh: item.title,
    price_cny: priceCny,
    price_cny_max: parsePriceMax(priceRaw),
    origin_price_cny: parsePriceRange(item.price_info?.origin_price),
    price_krw: toDdalkkakKrw(priceCny, exchangeRate),
    import_unit_label: '* 수입시 예상 단가',
    images: item.img ? [item.img] : [],
    skus: [],
    seller: {
      name: item.shop_info?.company_name || '',
      years: item.shop_info?.shop_years,
      rating,
      is_super_factory: item.shop_info?.is_super_factory || false,
      repurchase_rate: repurchaseRate,
      sales_90d: sales90d,
      delivery_24h_rate: ships24Rate,
      delivery_48h_rate: ships48Rate,
      is_plus: !!item.shop_info?.is_plus,
    },
    stock: 0,
    min_order: parseInt(item.moq) || 1,
    sales_90d: sales90d,
    sales_monthly: sales90d ? Math.round(sales90d / 3) : undefined,
    repurchase_rate: repurchaseRate,
    rating,
    service_tags: item.service_tags || [],
    service_labels: buildServiceLabels(item.service_tags),
    badges: sig.badges,
    is_new: sig.is_new,
    ships_in_24h: item.delivery_info?.is_24h_delivery === true || (ships24Rate ?? 0) >= 50,
    ships_in_48h: (ships48Rate ?? 0) >= 50,
    is_1688_select: sig.is_1688_select,
    is_super_factory: !!item.shop_info?.is_super_factory,
    free_shipping: sig.free_shipping,
    return_in_7d: sig.return_in_7d,
    is_ad: !!item.is_ad,
  };
}

export function mapItemDetailToSourcingProduct(
  detail: TmapiItemDetail,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(detail.price_info?.price_min || detail.price_info?.price || '0');
  const priceMax = parsePriceRange(detail.price_info?.price_max || detail.price_info?.price || '');
  const saleCount = parseCount(detail.sale_count);

  const skus: SourcingSku[] = (detail.skus || []).map((sku) => {
    const skuPrice = parseFloat(sku.sale_price) || priceCny;
    // props_names format: "속성명:값1; 값2" — extract the values part
    const name = sku.props_names
      ? sku.props_names.replace(/^[^:]+:/, '').trim()
      : sku.skuid;

    // Find matching image from sku_props
    let image: string | undefined;
    if (sku.props_ids && detail.sku_props?.length) {
      const [pid, vid] = sku.props_ids.split(':');
      const prop = detail.sku_props.find((p) => p.pid === pid);
      const val = prop?.values.find((v) => v.vid === vid);
      if (val?.imageUrl) image = val.imageUrl;
    }

    return {
      sku_id: sku.skuid,
      name,
      price_cny: skuPrice,
      price_krw: toDdalkkakKrw(skuPrice, exchangeRate),
      stock: sku.stock || 0,
      image,
    };
  });

  const seller: SourcingSeller | null = detail.shop_info
    ? {
        name: detail.shop_info.shop_name || detail.shop_info.seller_login_id || '',
        location: detail.delivery_info?.location,
      }
    : null;

  const totalStock = detail.stock || (skus.length > 0
    ? skus.reduce((sum, s) => sum + s.stock, 0)
    : 0);

  const tags = detail.service_tags;
  const isReturn7d = tagsHas(tags, /7daysReturn/i, /7day/i, /return/i);
  const is1688Select = tagsHas(tags, /1688Select/i, /select1688/i);

  // 무게: TMAPI delivery_info.unit_weight (kg)
  const weightKg =
    typeof detail.delivery_info?.unit_weight === 'number' && detail.delivery_info.unit_weight > 0
      ? detail.delivery_info.unit_weight
      : undefined;

  // 사이즈/규격: product_props 에서 치수 관련 키 추출 (셀러 입력 의존)
  const dimensionRe = /尺寸|规格|包装尺寸|长宽高|尺码|사이즈|규격/;
  let dimensions: string | undefined;
  for (const row of detail.product_props || []) {
    for (const [k, v] of Object.entries(row)) {
      if (dimensionRe.test(k) && v) {
        dimensions = String(v);
        break;
      }
    }
    if (dimensions) break;
  }

  return {
    product_id: String(detail.item_id),
    title: detail.title,
    // title_zh: language=ko 호출 시 title이 이미 한국어이므로 중국어 원본 없음
    // 검색 목록에서 이미 title_zh가 설정되어 클라이언트에 전달됨
    price_cny: priceCny,
    price_cny_max: priceMax && priceMax !== priceCny ? priceMax : undefined,
    origin_price_cny: parsePriceRange(detail.price_info?.origin_price_min),
    price_krw: toDdalkkakKrw(priceCny, exchangeRate),
    import_unit_label: '* 수입시 예상 단가',
    images: detail.main_imgs || [],
    skus,
    seller,
    stock: totalStock,
    min_order: detail.tiered_price_info?.begin_num || 1,
    detail_url: detail.detail_url,
    sale_count: saleCount,
    service_tags: tags || [],
    service_labels: buildServiceLabels(tags),
    product_props: detail.product_props || [],
    weight_kg: weightKg,
    dimensions,
    tier_prices: detail.tiered_price_info?.prices?.map((p) => ({
      begin_num: p.begin_num,
      price_cny: parseFloat(p.price) || priceCny,
      price_krw: toDdalkkakKrw(parseFloat(p.price) || priceCny, exchangeRate),
    })),
    is_1688_select: is1688Select,
    return_in_7d: isReturn7d,
  };
}

export function mapImageSearchItemToSourcingProduct(
  item: TmapiImageSearchItem,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(item.price_info?.sale_price || item.price);
  const sales90d = parseCount(item.sale_info?.sale_quantity_90days);
  return {
    product_id: String(item.item_id),
    title: item.title,
    title_zh: item.title,
    price_cny: priceCny,
    origin_price_cny: parsePriceRange(item.price_info?.origin_price),
    price_krw: toDdalkkakKrw(priceCny, exchangeRate),
    import_unit_label: '* 수입시 예상 단가',
    images: item.img ? [item.img] : [],
    skus: [],
    seller: {
      name: item.shop_info?.company_name || '',
      sales_90d: sales90d,
    },
    stock: 0,
    min_order: 1,
    sales_90d: sales90d,
    sales_monthly: sales90d ? Math.round(sales90d / 3) : undefined,
  };
}
