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

// 상품 배열 일괄 번역 (최대 동시 5개)
export async function translateProducts(
  products: SourcingProduct[]
): Promise<SourcingProduct[]> {
  const CONCURRENCY = 5;
  const results: SourcingProduct[] = [];

  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    const translated = await Promise.all(batch.map(translateProduct));
    results.push(...translated);
  }

  return results;
}

async function translateProduct(product: SourcingProduct): Promise<SourcingProduct> {
  // title 번역 (title_zh는 중국어 원본 유지)
  const titleKo = await zhToKoCached(product.title);

  // SKU 번역
  const translatedSkus = await Promise.all(
    product.skus.map(async (sku) => {
      const translatedProperties = sku.properties
        ? await translateProperties(sku.properties)
        : undefined;

      // name을 번역된 properties values로 재조합
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

  // seller.location 번역 (선택적)
  let translatedSeller = product.seller;
  if (product.seller?.location && containsChinese(product.seller.location)) {
    const locationKo = await zhToKoCached(product.seller.location);
    translatedSeller = { ...product.seller, location: locationKo };
  }

  return {
    ...product,
    title: titleKo,
    title_zh: product.title_zh ?? product.title, // 원본 중국어 보존
    skus: translatedSkus,
    seller: translatedSeller,
  };
}
