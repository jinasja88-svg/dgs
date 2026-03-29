import type { SourcingProduct, SourcingSku, SourcingSeller } from '@/types';
import type { TmapiSearchItem, TmapiItemDetail, TmapiImageSearchItem } from './types';

function parsePriceRange(priceStr: string): number {
  if (!priceStr) return 0;
  const first = priceStr.split('-')[0];
  return parseFloat(first) || 0;
}

function cnyToKrw(priceCny: number, exchangeRate: number): number {
  return Math.round(priceCny * exchangeRate);
}

export function mapSearchItemToSourcingProduct(
  item: TmapiSearchItem,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(item.price_info?.sale_price || item.price);
  return {
    product_id: String(item.item_id),
    title: item.title,
    title_zh: item.title,
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: item.img ? [item.img] : [],
    skus: [],
    seller: {
      name: item.shop_info?.company_name || '',
      years: item.shop_info?.shop_years,
      rating: item.shop_info?.score_info?.composite_score
        ? parseFloat(item.shop_info.score_info.composite_score)
        : undefined,
    },
    stock: 0,
    min_order: parseInt(item.moq) || 1,
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
      price_krw: cnyToKrw(skuPrice, exchangeRate),
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

  return {
    product_id: String(detail.item_id),
    title: detail.title,
    // title_zh: language=ko 호출 시 title이 이미 한국어이므로 중국어 원본 없음
    // 검색 목록에서 이미 title_zh가 설정되어 클라이언트에 전달됨
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: detail.main_imgs || [],
    skus,
    seller,
    stock: totalStock,
    min_order: detail.tiered_price_info?.begin_num || 1,
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
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: item.img ? [item.img] : [],
    skus: [],
    seller: {
      name: item.shop_info?.company_name || '',
    },
    stock: 0,
    min_order: 1,
  };
}
