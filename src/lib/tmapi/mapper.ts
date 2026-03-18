import type { SourcingProduct, SourcingSku, SourcingSeller } from '@/types';
import type { TmapiSearchItem, TmapiItemDetail, TmapiImageSearchItem } from './types';

export function parsePriceRange(priceStr: string): number {
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
  const priceCny = parsePriceRange(item.priceInfo?.price);
  return {
    product_id: String(item.offerId),
    title: item.subject,
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: item.imageUrl ? [item.imageUrl] : [],
    skus: [],
    seller: {
      name: item.companyName || item.sellerLoginId || '',
    },
    stock: item.quantitySummity || 0,
    min_order: 1,
  };
}

export function mapItemDetailToSourcingProduct(
  detail: TmapiItemDetail,
  exchangeRate: number
): SourcingProduct {
  const priceCny = detail.priceInfo?.[0]
    ? parseFloat(detail.priceInfo[0].price)
    : 0;

  const skus: SourcingSku[] = (detail.skuInfos || []).map((sku) => {
    const skuPrice = parseFloat(sku.price) || priceCny;
    const properties: Record<string, string> = {};
    for (const attr of sku.specAttrs || []) {
      properties[attr.attributeDisplayName] = attr.value;
    }
    const name = (sku.specAttrs || []).map((a) => a.value).join(' / ') || String(sku.skuId);
    return {
      sku_id: String(sku.skuId),
      name,
      price_cny: skuPrice,
      price_krw: cnyToKrw(skuPrice, exchangeRate),
      stock: sku.amountOnSale || 0,
      image: sku.imageUrl,
      properties,
    };
  });

  const seller: SourcingSeller | null = detail.sellerInfo
    ? {
        name: detail.sellerInfo.companyName || detail.sellerInfo.loginId || '',
        rating: detail.sellerInfo.tp?.score,
        years: detail.sellerInfo.yearOfBegin
          ? new Date().getFullYear() - detail.sellerInfo.yearOfBegin
          : undefined,
        location: detail.sellerInfo.bizArea,
      }
    : null;

  const totalStock = skus.length > 0
    ? skus.reduce((sum, s) => sum + s.stock, 0)
    : 0;

  return {
    product_id: String(detail.offerId),
    title: detail.subject,
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: detail.images || [],
    skus,
    seller,
    stock: totalStock,
    category: detail.categoryName,
    min_order: detail.quantityBegin || 1,
  };
}

export function mapImageSearchItemToSourcingProduct(
  item: TmapiImageSearchItem,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(item.price);
  return {
    product_id: String(item.offerId),
    title: item.subject,
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: item.imageUrl ? [item.imageUrl] : [],
    skus: [],
    seller: {
      name: item.companyName || '',
    },
    stock: 0,
    min_order: 1,
  };
}
