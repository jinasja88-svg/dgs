/**
 * 국내 배송비 정책 — 단일 출처.
 *
 * 조사 기준(2026): 우체국 소형 택배 최저 ~3,200원, CJ대한통운 표준 ~3,000원.
 * 본 서비스는 통관 후 국내 최종 배송 구간에 대해 기본 정액 + 도서산간 할증을 적용한다.
 * (해외 국제운송비/통관비는 별도 견적 단계에서 안내)
 */

export const DOMESTIC_SHIPPING_FEE = 3000; // 기본 (5kg 이하 표준 택배 기준)
export const REMOTE_AREA_SURCHARGE = 3000; // 제주 및 도서산간 추가

export interface ShippingAddressLike {
  postal_code?: string | null;
  address?: string | null;
}

/** 제주 우편번호(63000~63644) 대역 */
function isJejuPostal(pc: string): boolean {
  return /^63[0-6]/.test(pc);
}

/** 제주/도서산간 여부 — 우편번호 우선, 없으면 주소 텍스트로 보조 판정 */
export function isRemoteArea(address?: ShippingAddressLike | null): boolean {
  if (!address) return false;
  const pc = (address.postal_code || '').replace(/\D/g, '');
  if (pc && isJejuPostal(pc)) return true;
  const text = address.address || '';
  return /제주|울릉|독도|백령|연평|흑산|거문|추자/.test(text);
}

export function getRemoteAreaSurcharge(address?: ShippingAddressLike | null): number {
  return isRemoteArea(address) ? REMOTE_AREA_SURCHARGE : 0;
}

/** 배송지 기반 국내 배송비(기본 + 도서산간 할증) */
export function getDomesticShippingFee(address?: ShippingAddressLike | null): number {
  return DOMESTIC_SHIPPING_FEE + getRemoteAreaSurcharge(address);
}

export const SHIPPING_POLICY_LABELS = {
  base: '국내 기본 배송비 3,000원 (5kg 이하 표준 택배 기준)',
  remote: '제주 및 도서산간 지역 +3,000원',
  note: '국내 배송비는 부피·무게에 따라 달라질 수 있으며, 해외 통관·국제운송비는 견적 시 별도 안내됩니다.',
};

/** 매뉴얼/가이드 페이지용 배송비 표 데이터 */
export const SHIPPING_FEE_TABLE: { label: string; fee: string }[] = [
  { label: '국내 기본 (5kg 이하 표준 택배)', fee: '3,000원' },
  { label: '제주 / 도서산간 할증', fee: '+3,000원' },
  { label: '해외 국제운송 · 통관비', fee: '견적 시 별도 안내' },
];
