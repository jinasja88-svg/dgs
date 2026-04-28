/**
 * 1688 상품 한국어 번역 모듈
 * - 상품명: HuggingFace Qwen API (Supabase 캐시 우선)
 * - SKU 속성: 정적 룩업 우선 → 미스 시 API
 */

import type { SourcingProduct } from '@/types';
import { translateZhToKo, translateKoToZh, translateZhToKoBatch } from './papago';
import { lookupZhToKo, containsChinese, containsKorean } from './lookup';
import { getCachedAsync, setCachedAsync } from './cache';

// Supabase 캐시를 통한 중국어→한국어 번역 (단일 텍스트)
async function zhToKoCached(text: string): Promise<string> {
  if (!text || !containsChinese(text)) return text;

  const lookup = lookupZhToKo(text);
  if (lookup !== null) return lookup;

  const cached = await getCachedAsync(text, 'zh2ko');
  if (cached !== null) return cached;

  const translated = await translateZhToKo(text);
  await setCachedAsync(text, 'zh2ko', translated);
  return translated;
}

// 단일 텍스트 중국어→한국어 번역 (외부 노출용)
export async function translateSingle(text: string): Promise<string> {
  return zhToKoCached(text);
}

/**
 * 다수 중국어 텍스트를 캐시(룩업+Supabase) 우선 + 미스만 단일 배치 API로 번역.
 * 리뷰처럼 N개를 한 번에 처리해야 하는 경우 N콜이 1콜로 압축됨.
 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const toTranslate: { idx: number; text: string }[] = [];

  await Promise.all(
    texts.map(async (text, idx) => {
      if (!text || !containsChinese(text)) {
        results[idx] = text;
        return;
      }
      const lookup = lookupZhToKo(text);
      if (lookup !== null) {
        results[idx] = lookup;
        return;
      }
      const cached = await getCachedAsync(text, 'zh2ko');
      if (cached !== null) {
        results[idx] = cached;
        return;
      }
      toTranslate.push({ idx, text });
    })
  );

  if (toTranslate.length > 0) {
    const batchTranslated = await translateZhToKoBatch(toTranslate.map((t) => t.text));
    await Promise.all(
      toTranslate.map(async ({ idx, text }, j) => {
        results[idx] = batchTranslated[j];
        await setCachedAsync(text, 'zh2ko', batchTranslated[j]);
      })
    );
  }

  return results;
}

// 한국어→중국어 번역 (검색 쿼리용)
export async function translateSearchQuery(keyword: string): Promise<string> {
  if (!keyword || !containsKorean(keyword)) return keyword;

  const cached = await getCachedAsync(keyword, 'ko2zh');
  if (cached !== null) return cached;

  const translated = await translateKoToZh(keyword);
  await setCachedAsync(keyword, 'ko2zh', translated);
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
// skipSkus: 검색 목록처럼 SKU가 필요 없을 때 true로 설정 → API 호출 대폭 감소
export async function translateProducts(
  products: SourcingProduct[],
  options: { skipSkus?: boolean } = {}
): Promise<SourcingProduct[]> {
  if (products.length === 0) return products;

  // 타이틀 캐시 조회 (Supabase 병렬)
  const cacheResults = await Promise.all(
    products.map(async (p) => {
      const title = p.title;
      if (!title || !containsChinese(title)) return { cached: title, needsApi: false };
      const lookup = lookupZhToKo(title);
      if (lookup !== null) return { cached: lookup, needsApi: false };
      const cached = await getCachedAsync(title, 'zh2ko');
      return cached !== null ? { cached, needsApi: false } : { cached: title, needsApi: true };
    })
  );

  // 캐시 미스 타이틀만 배치 API 호출
  const titleResults: string[] = products.map((p) => p.title);
  const toTranslate: { idx: number; text: string }[] = [];

  for (let i = 0; i < products.length; i++) {
    if (!cacheResults[i].needsApi) {
      titleResults[i] = cacheResults[i].cached;
    } else {
      toTranslate.push({ idx: i, text: products[i].title });
    }
  }

  if (toTranslate.length > 0) {
    const batchTexts = toTranslate.map((t) => t.text);
    const batchTranslated = await translateZhToKoBatch(batchTexts);

    // 캐시 저장 + 결과 반영 (병렬)
    await Promise.all(
      toTranslate.map(async ({ idx, text }, j) => {
        const translated = batchTranslated[j];
        titleResults[idx] = translated;
        await setCachedAsync(text, 'zh2ko', translated);
      })
    );
  }

  // skipSkus일 때는 타이틀만 교체하여 반환
  if (options.skipSkus) {
    return products.map((p, i) => ({
      ...p,
      title: titleResults[i],
      title_zh: p.title_zh ?? p.title,
    }));
  }

  // SKU 포함 번역 (상세 페이지)
  return Promise.all(products.map((p, i) => translateProduct({ ...p, title: titleResults[i] }, false)));
}

async function translateProduct(product: SourcingProduct, skipSkus = false): Promise<SourcingProduct> {
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
