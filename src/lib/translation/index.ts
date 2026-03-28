/**
 * 1688 상품 한국어 번역 모듈
 * - 상품명: Papago API (캐시 우선)
 * - SKU 속성: 정적 룩업 우선 → 미스 시 Papago
 */

import type { SourcingProduct } from '@/types';
import { translateZhToKo, translateKoToZh } from './papago';
import { lookupZhToKo, containsChinese, containsKorean } from './lookup';
import { getCached, setCached } from './cache';

// 캐시를 통한 중국어→한국어 번역 (단일 텍스트)
async function zhToKoCached(text: string): Promise<string> {
  if (!text || !containsChinese(text)) return text;

  const cached = getCached(text, 'zh2ko');
  if (cached !== null) return cached;

  const lookup = lookupZhToKo(text);
  if (lookup !== null) {
    setCached(text, 'zh2ko', lookup);
    return lookup;
  }

  const translated = await translateZhToKo(text);
  setCached(text, 'zh2ko', translated);
  return translated;
}

// 한국어→중국어 번역 (검색 쿼리용)
export async function translateSearchQuery(keyword: string): Promise<string> {
  if (!keyword || !containsKorean(keyword)) return keyword;

  const cached = getCached(keyword, 'ko2zh');
  if (cached !== null) return cached;

  const translated = await translateKoToZh(keyword);
  setCached(keyword, 'ko2zh', translated);
  return translated;
}

// SKU properties 번역 (keys + values)
async function translateProperties(
  properties: Record<string, string>
): Promise<Record<string, string>> {
  const entries = Object.entries(properties);

  const translatedEntries = await Promise.all(
    entries.map(async ([key, value]) => {
      const [translatedKey, translatedValue] = await Promise.all([
        zhToKoCached(key),
        zhToKoCached(value),
      ]);
      return [translatedKey, translatedValue] as [string, string];
    })
  );

  return Object.fromEntries(translatedEntries);
}

// 상품 배열 일괄 번역
// skipSkus: 검색 목록처럼 SKU가 필요 없을 때 true로 설정 → Papago 호출 대폭 감소
export async function translateProducts(
  products: SourcingProduct[],
  options: { skipSkus?: boolean } = {}
): Promise<SourcingProduct[]> {
  const CONCURRENCY = 15;
  const results: SourcingProduct[] = [];

  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    const translated = await Promise.all(batch.map((p) => translateProduct(p, options.skipSkus)));
    results.push(...translated);
  }

  return results;
}

async function translateProduct(product: SourcingProduct, skipSkus = false): Promise<SourcingProduct> {
  // title + seller.location 동시에 번역
  const sellerHasChinese = !!(product.seller?.location && containsChinese(product.seller.location));
  const [titleKo, locationKo] = await Promise.all([
    zhToKoCached(product.title),
    sellerHasChinese ? zhToKoCached(product.seller!.location!) : Promise.resolve(undefined),
  ]);

  const translatedSeller = locationKo
    ? { ...product.seller!, location: locationKo }
    : product.seller;

  if (skipSkus) {
    return {
      ...product,
      title: titleKo,
      title_zh: product.title_zh ?? product.title,
      seller: translatedSeller,
    };
  }

  // SKU 번역 (상세 페이지에서만 실행)
  const translatedSkus = await Promise.all(
    product.skus.map(async (sku) => {
      const translatedProperties = sku.properties
        ? await translateProperties(sku.properties)
        : undefined;

      const translatedName = translatedProperties
        ? Object.values(translatedProperties).join(' / ')
        : await zhToKoCached(sku.name);

      return {
        ...sku,
        name: translatedName,
        properties: translatedProperties,
      };
    })
  );

  return {
    ...product,
    title: titleKo,
    title_zh: product.title_zh ?? product.title,
    skus: translatedSkus,
    seller: translatedSeller,
  };
}
