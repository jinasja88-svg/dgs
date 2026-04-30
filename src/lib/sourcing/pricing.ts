/**
 * 가격 변환 헬퍼 — UI 노출 정책상 "수수료" 단어와 12% 라는 숫자는 화면에서 가립니다.
 *
 * - toDdalkkakKrw: 카드/리스트/상세/장바구니에 노출되는 "딸깍 단가" (마진 포함). 사용자에겐 단일 단가로만 보임.
 * - toRawKrw: 백엔드 정산/주문 처리에서만 사용 (마진 미포함, 환율만 적용).
 */

export const MARGIN_RATE = 0.12;

export function toDdalkkakKrw(priceCny: number, exchangeRate: number): number {
  return Math.round(priceCny * exchangeRate * (1 + MARGIN_RATE));
}

export function toRawKrw(priceCny: number, exchangeRate: number): number {
  return Math.round(priceCny * exchangeRate);
}

/**
 * 표시되는 "딸깍 단가"에서 마진을 역으로 떼어 백엔드 정산용 raw KRW 값을 추정.
 * (mapper 가 이미 toDdalkkakKrw 로 만든 가격을 들고 있을 때 정산값이 필요한 경우 사용)
 */
export function ddalkkakKrwToRaw(ddalkkakKrw: number): number {
  return Math.round(ddalkkakKrw / (1 + MARGIN_RATE));
}
