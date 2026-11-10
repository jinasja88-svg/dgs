/**
 * 1688 상품 한국어 번역 모듈
 * - 상품명: Claude Sonnet API (Supabase 캐시 우선)
 * - SKU 속성: 정적 룩업 우선 → 미스 시 API
 */

import type { SourcingProduct } from '@/types';
import { translateZhToKo, translateKoToZh, translateZhToKoBatch } from './translator';
import { lookupZhToKo, containsChinese, containsKorean } from './lookup';
import { getCachedAsync, setCachedAsync } from './cache';

// 번역 실패 시 translator는 원문을 그대로 돌려주므로, 원문이 영구 캐시에 박히지 않도록 걸러낸다
async function cacheIfTranslated(text: string, direction: 'zh2ko' | 'ko2zh', translated: string): Promise<void> {
  if (!translated || translated === text) return;
  await setCachedAsync(text, direction, translated);
}

// 프리웜 등 별도 예산 경로에서 번역 출처(live/prewarm)를 지정할 때 사용
export { runWithTranslationSource } from './translator';

// Supabase 캐시를 통한 중국어→한국어 번역 (단일 텍스트)
async function zhToKoCached(text: string): Promise<string> {
  if (!text || !containsChinese(text)) return text;

  const lookup = lookupZhToKo(text);
  if (lookup !== null) return lookup;

  const cached = await getCachedAsync(text, 'zh2ko');
  if (cached !== null) return cached;

  const translated = await translateZhToKo(text);
  await cacheIfTranslated(text, 'zh2ko', translated);
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
    // 같은 문장(예: 동일 판매자명)은 한 번만 번역
    const uniqueTexts = [...new Set(toTranslate.map((t) => t.text))];
    const batchTranslated = await translateZhToKoBatch(uniqueTexts);
    const byText = new Map(uniqueTexts.map((text, j) => [text, batchTranslated[j]]));
    for (const { idx, text } of toTranslate) {
      results[idx] = byText.get(text) ?? text;
    }
    await Promise.all(uniqueTexts.map((text) => cacheIfTranslated(text, 'zh2ko', byText.get(text)!)));
  }

  return results;
}

// 한국어→중국어 번역 (검색 쿼리용)
export async function translateSearchQuery(keyword: string): Promise<string> {
  if (!keyword || !containsKorean(keyword)) return keyword;

  const cached = await getCachedAsync(keyword, 'ko2zh');
  if (cached !== null) return cached;

  const translated = await translateKoToZh(keyword);
  await cacheIfTranslated(keyword, 'ko2zh', translated);
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

  // 타이틀 + 판매자명을 한 번에 캐시 조회 → 미스만 배치 번역
  const titles = products.map((p) => p.title);
  const sellerNames = products.map((p) => p.seller?.name ?? '');
  const translated = await translateBatch([...titles, ...sellerNames]);
  const titleResults = translated.slice(0, products.length);
  const sellerResults = translated.slice(products.length);

  const withTitles = products.map((p, i) => ({
    ...p,
    title: titleResults[i],
    title_zh: p.title_zh ?? p.title,
    seller: p.seller && sellerResults[i]
      ? { ...p.seller, name: sellerResults[i], name_zh: p.seller.name_zh ?? p.seller.name }
      : p.seller,
  }));

  // skipSkus일 때는 타이틀·판매자명만 교체하여 반환
  if (options.skipSkus) return withTitles;

  // SKU 포함 번역 (상세 페이지)
  return Promise.all(withTitles.map((p) => translateProduct(p, false)));
}

// product_props (Array<Record<string,string>>) 를 한 번의 배치 호출로 번역
async function translateProductProps(
  props: Array<Record<string, string>> | undefined
): Promise<Array<Record<string, string>> | undefined> {
  if (!props?.length) return props;

  // 모든 키/값을 평탄화하여 단일 배치로 번역
  const allTexts: string[] = [];
  for (const prop of props) {
    for (const [k, v] of Object.entries(prop)) {
      allTexts.push(k, v);
    }
  }

  const translated = await translateBatch(allTexts);

  // 번역 결과를 원래 구조로 복원
  let cursor = 0;
  return props.map((prop) => {
    const entries = Object.entries(prop).map(() => {
      const tk = translated[cursor++];
      const tv = translated[cursor++];
      return [tk, tv] as [string, string];
    });
    return Object.fromEntries(entries);
  });
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

  const [translatedSkus, translatedProductProps] = await Promise.all([
    Promise.all(
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
    ),
    translateProductProps(product.product_props),
  ]);

  return {
    ...product,
    title: titleKo,
    title_zh: product.title_zh ?? product.title,
    skus: translatedSkus,
    seller: translatedSeller,
    product_props: translatedProductProps ?? product.product_props,
  };
}
