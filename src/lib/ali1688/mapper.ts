/**
 * 1688 직접 API 응답을 SourcingProduct로 변환
 */

import type { SourcingProduct } from '@/types';
import type { Ali1688SearchItem, Ali1688ItemDetail } from './client';

function parsePriceRange(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  const first = priceStr.split('-')[0];
  return parseFloat(first) || 0;
}

function cnyToKrw(priceCny: number, exchangeRate: number): number {
  return Math.round(priceCny * exchangeRate);
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

function normalizeImageUrl(url: string): string {
  if (!url) return '';
  // // 로 시작하면 https: 붙이기
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

/**
 * 이미지 검색 결과 아이템 → SourcingProduct
 */
export function mapSearchItemToProduct(
  item: Ali1688SearchItem,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(item.priceInfo?.price);
  const imageUrl = normalizeImageUrl(item.image?.imgUrl || '');

  return {
    product_id: String(item.offerId),
    title: stripHtml(item.subject || ''),
    title_zh: stripHtml(item.subject || ''),
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: imageUrl ? [imageUrl] : [],
    skus: [],
    seller: item.company
      ? { name: item.company.name }
      : null,
    stock: item.tradeQuantity?.value || 0,
  };
}

/**
 * 상품 상세 → SourcingProduct
 */
export function mapDetailToProduct(
  detail: Ali1688ItemDetail,
  exchangeRate: number
): SourcingProduct {
  const priceCny = parsePriceRange(detail.priceInfo?.[0]?.price);

  const skus = (detail.skuInfos || []).map((sku) => {
    const skuPrice = parseFloat(sku.price) || priceCny;
    return {
      sku_id: String(sku.skuId),
      name: sku.specAttrs.map((a) => a.value).join(' / '),
      price_cny: skuPrice,
      price_krw: cnyToKrw(skuPrice, exchangeRate),
      stock: sku.amountOnSale || 0,
      image: sku.imageUrl ? normalizeImageUrl(sku.imageUrl) : undefined,
      properties: Object.fromEntries(sku.specAttrs.map((a) => [a.name, a.value])),
    };
  });

  const totalStock = skus.length > 0
    ? skus.reduce((sum, s) => sum + s.stock, 0)
    : 0;

  return {
    product_id: String(detail.offerId),
    title: stripHtml(detail.subject || ''),
    title_zh: stripHtml(detail.subject || ''),
    price_cny: priceCny,
    price_krw: cnyToKrw(priceCny, exchangeRate),
    images: (detail.images || []).map(normalizeImageUrl),
    skus,
    seller: detail.sellerInfo
      ? {
          name: detail.sellerInfo.companyName || detail.sellerInfo.loginId,
          rating: detail.sellerInfo.tp?.score,
          years: detail.sellerInfo.yearOfBegin
            ? new Date().getFullYear() - detail.sellerInfo.yearOfBegin
            : undefined,
          location: detail.sellerInfo.bizArea,
        }
      : null,
    stock: totalStock,
    category: detail.categoryName,
    min_order: detail.quantityBegin,
  };
}
