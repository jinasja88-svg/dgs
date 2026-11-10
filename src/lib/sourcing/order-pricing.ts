import { mapItemDetailToSourcingProduct, getCachedItemDetail } from '@/lib/tmapi';
import { getExchangeRate } from '@/lib/exchange-rate';
import { getCached } from '@/lib/persistent-cache';
import type { SourcingProduct } from '@/types';

// 장바구니 담은 뒤 환율이 조금 변해도 정상 주문이 막히지 않도록 허용하는 하락폭
const PRICE_TOLERANCE = 0.03;

export interface OrderItemInput {
  product_id: string;
  sku_id?: string;
  sku_name?: string;
  quantity: number;
  price_cny: number;
  price_krw: number;
}

export class OrderPriceError extends Error {}

async function loadProduct(productId: string): Promise<SourcingProduct> {
  // 상세 페이지가 이미 만들어 둔 캐시를 우선 사용 (번역 비용 없음)
  const cached = await getCached<SourcingProduct>(`tmapi:product:${productId}`);
  if (cached) return cached;
  const [exchangeRate, detail] = await Promise.all([
    getExchangeRate(),
    getCachedItemDetail(productId, 'ko'),
  ]);
  return mapItemDetailToSourcingProduct(detail, exchangeRate);
}

/**
 * 클라이언트가 보낸 단가를 1688 원장 가격과 대조한다.
 * - sku_id가 맞으면 그 SKU 가격이 하한
 * - 아니면 상품 내 가장 싼 SKU/구간 가격이 하한
 * 하한보다 (허용 오차 이상) 싸면 위·변조로 보고 거절한다.
 */
export async function verifyOrderItemPrices(items: OrderItemInput[]): Promise<void> {
  const productIds = [...new Set(items.map((i) => i.product_id))];
  const products = new Map<string, SourcingProduct>();
  await Promise.all(
    productIds.map(async (id) => {
      try {
        products.set(id, await loadProduct(id));
      } catch {
        throw new OrderPriceError('상품 가격을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    })
  );

  for (const item of items) {
    const product = products.get(item.product_id)!;
    const sku = item.sku_id ? product.skus.find((s) => s.sku_id === item.sku_id) : undefined;

    const candidates = sku
      ? [sku.price_krw]
      : [
          product.price_krw,
          ...product.skus.map((s) => s.price_krw),
          ...(product.tier_prices ?? []).map((t) => t.price_krw),
        ];
    const floor = Math.min(...candidates.filter((p) => p > 0));

    if (Number.isFinite(floor) && item.price_krw < floor * (1 - PRICE_TOLERANCE)) {
      throw new OrderPriceError('상품 가격이 변경되었습니다. 장바구니를 새로고침한 뒤 다시 주문해주세요.');
    }
  }
}
