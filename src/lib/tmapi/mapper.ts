import type { SourcingProduct, SourcingSku, SourcingSeller, SourcingBadge } from '@/types';
import type { TmapiSearchItem, TmapiItemDetail, TmapiImageSearchItem } from './types';
import { toDdalkkakKrw } from '@/lib/sourcing/pricing';

function parsePriceRange(priceStr: string): number {
  if (!priceStr) return 0;
  const first = priceStr.split('-')[0];
  return parseFloat(first) || 0;
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
  const priceCny = parsePriceRange(item.price_info?.sale_price || item.price);
  const sig = buildSearchItemBadges(item);
  const ships24Rate = parseFloat(item.delivery_info?.delivery_24h_rate || '0');
  const ships48Rate = parseFloat(item.delivery_info?.delivery_48h_rate || '0');

  return {
    product_id: String(item.item_id),
    title: item.title,
    title_zh: item.title,
    price_cny: priceCny,
    price_krw: toDdalkkakKrw(priceCny, exchangeRate),
    images: item.img ? [item.img] : [],
    skus: [],
    seller: {
      name: item.shop_info?.company_name || '',
      years: item.shop_info?.shop_years,
      rating: item.shop_info?.score_info?.composite_score
        ? parseFloat(item.shop_info.score_info.composite_score)
        : undefined,
      is_super_factory: item.shop_info?.is_super_factory || false,
      repurchase_rate: item.item_repurchase_rate
        ? parseFloat(item.item_repurchase_rate)
        : undefined,
      sales_90d: item.sale_info?.sale_quantity_90days
        ? parseInt(item.sale_info.sale_quantity_90days)
        : undefined,
    },
    stock: 0,
    min_order: parseInt(item.moq) || 1,
    badges: sig.badges,
    is_new: sig.is_new,
    ships_in_24h: item.delivery_info?.is_24h_delivery === true || ships24Rate >= 0.5,
    ships_in_48h: ships48Rate >= 0.5,
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

  return {
    product_id: String(detail.item_id),
    title: detail.title,
    // title_zh: language=ko 호출 시 title이 이미 한국어이므로 중국어 원본 없음
    // 검색 목록에서 이미 title_zh가 설정되어 클라이언트에 전달됨
    price_cny: priceCny,
    price_krw: toDdalkkakKrw(priceCny, exchangeRate),
    images: detail.main_imgs || [],
    skus,
    seller,
    stock: totalStock,
    min_order: detail.tiered_price_info?.begin_num || 1,
    detail_url: detail.detail_url,
    is_1688_select: is1688Select,
    return_in_7d: isReturn7d,
  };
}

export function mapImageSearchItemToSourcingProduct(
  item: TmapiImageSearchItem,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(item.price_info?.sale_price || item.price);
  return {
    product_id: String(item.item_id),
    title: item.title,
    title_zh: item.title,
    price_cny: priceCny,
    price_krw: toDdalkkakKrw(priceCny, exchangeRate),
    images: item.img ? [item.img] : [],
    skus: [],
    seller: {
      name: item.shop_info?.company_name || '',
    },
    stock: 0,
    min_order: 1,
  };
}
