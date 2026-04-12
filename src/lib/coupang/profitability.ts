// ============================
// 쿠팡 수수료 / 배송비 / 수익 계산
// coupang-honey-list/index.html 276~343 기반 TypeScript 포팅
// ============================

import type { DeliveryType, RocketSize, ProfitAnalysis } from './types';

// ---------------------
// 카테고리별 수수료율 (%)
// ---------------------
interface CommissionSubCategory {
  default?: number;
  items?: Record<string, number>;
}

interface CommissionCategory {
  default: number;
  sub?: Record<string, CommissionSubCategory>;
}

const COMMISSION_RATES: Record<string, CommissionCategory> = {
  '가전디지털': {
    default: 7.8,
    sub: {
      '게임': { default: 6.8 },
      '냉난방가전': { items: { '냉난방에어컨': 5.8 } },
      '냉방가전': { items: { '멀티형에어컨': 5.8, '벽걸이형에어컨': 5.8, '스탠드형에어컨': 5.8, '이동식 스탠드형에어컨': 5.8 } },
      '카메라/카메라용품': { items: { '기타카메라': 6, '디지털카메라': 5.8, '초소형/히든카메라': 6, '카메라렌즈': 5.8, '캠코더/비디오카메라': 6, 'DSLR/SLR카메라': 5.8 } },
      '태블릿PC/액세서리': { items: { '태블릿PC': 5 } },
      '생활가전': { items: { '냉장고': 5.8, '세탁기': 5.8 } },
      '빔/스크린': { items: { '빔/프로젝터': 5.8 } },
      '영상가전': { items: { '영상액세서리': 5.8, 'TV': 5.8, 'VTR/DVD플레이어': 5.8 } },
      '컴퓨터/게임': { items: { '컴퓨터': 5 } },
      '컴퓨터주변기기': { items: { '3D프린터': 5.8, '기타프린터': 5.8, '레이져복합기': 5.8, '레이져프린터': 5.8, '모니터': 4.5, '복사기': 5.8, '스캐너': 5.8, '잉크젯복합기': 5.8, '잉크젯프린터': 5.8, '포토프린터': 5.8, '마우스/키보드': 6.5, '유무선공유기': 6.5, '태블릿/노트북악세사리': 6.4, '기타': 6.4 } },
    },
  },
  '가구/홈인테리어': { default: 10.8 },
  '도서': { default: 10.8 },
  '음반': { default: 10.8 },
  '문구/사무용품': {
    default: 10.8,
    sub: {
      '문구/팬시용품': { items: { '광학용품': 8.8 } },
      '사무용지류': { items: { '포토전용지': 7.8 } },
    },
  },
  '출산/유아': {
    default: 10,
    sub: {
      '기저귀/물티슈': { items: { '기저귀크림/파우더': 9.8 } },
      '영유아물티슈': { items: { '영유아물티슈': 8.2 } },
      '영유아식��': { default: 7.8 },
      '분유': { items: { '유아분유': 6.4 } },
      '기저귀': { items: { '배변훈련팬티': 6.4, '수영장기저귀': 6.4, '일회용기저귀': 6.4, '천기저귀': 6.4 } },
    },
  },
  '스포츠/레저용품': {
    default: 10.8,
    sub: {
      '골프용품': { items: { '골프거리측정기/GPS': 7.6, '골프클럽': 7.6, '골프풀세트': 7.6 } },
      '자전거용품': { items: { '성인용자전거': 7.6, '아동용자전거': 7.6 } },
      '스포츠의류': { default: 10.5 },
      '스포츠신발': { default: 10.5 },
    },
  },
  '뷰티': { default: 9.6 },
  '생활용품': {
    default: 7.8,
    sub: {
      '의료위생/보조용품': { items: { '금연용품(19)': 10.8, '기타금연/흡연용품': 10.8, '환자보조용품': 10, '흡연용품(19)': 10.8, '전자담배(19)': 10.8 } },
      '공구/철물/DIY': { items: { '건전지/충전기': 10.8, '건축/도장재료': 10.8 } },
      '공구/철물': { items: { '가스부품': 10.8, '공구세트': 10.8, '공구함': 10.8, '기타공구및철물용품': 10.8, '대공용품': 10.8, '목장갑': 10.8, '보호복/작업복': 10.8, '수공구': 10.8, '수도부품': 10.8, '안전용품': 10.8, '자물쇠/보조키/도어락': 10.8, '철물용품': 10.8, '측정용공구': 10.8 } },
      '조명/배선/전기코드류': { items: { '손전등': 10.8, '전구': 10.8, '전선/브라켓': 10.8, 'LED패널': 10.8 } },
      '방향/탈취/살충제': { items: { '모기퇴치용품': 10 } },
      '수납/정리잡화': { items: { '기타가정용품': 10.8, '수납/정리용품': 10.8, '압축팩/커버': 10.8, '옷걸이/벽걸이': 10.8 } },
      '안전용품': { items: { '가정/생활안전용품': 10.8, '안전사고방지용품': 10.8 } },
      '청소/세탁/욕실용품': { default: 10.8 },
      '해충퇴치용품': { items: { '살충/방충용품': 10 } },
      '성인용품(19)': { default: 9.6 },
    },
  },
  '식품': {
    default: 10.6,
    sub: {
      '영양제': { items: { '유아건강식품': 7.6 } },
      '채소류': { items: { '감자/고구마': 7.6 } },
      '신선식품': { items: { '쌀/잡곡류': 5.8 } },
      '면/라면': { default: 10.9 },
    },
  },
  '완구/취미': {
    default: 10.8,
    sub: {
      'RC완구': { items: { 'RC드론/쿼드콥터': 7.8 } },
    },
  },
  '자동차용품': {
    default: 10,
    sub: {
      '차량정비용품': { items: { '타이어용품': 9.6, '휠/휠악세서리': 9.6 } },
      '차량용전자기기': { items: { '경보기/스마트키': 7.8, '스마트기기용품': 7.8, '차량용음향기기': 7.8, '후방카메라/감지기': 7.8 } },
      '오토바이용품': { default: 7.6 },
      '방향제/디퓨저': { items: { '차량용방향제': 7.8 } },
      '공기청정/방향/탈취': { items: { '세정제/세정티슈': 7.8, '탈취제/세정제': 7.8 } },
      '차량가전용품': { items: { '내비게이션': 6.8, '블랙박스': 6.8, '하이패스': 6.8 } },
    },
  },
  '주방용품': {
    default: 10.8,
    sub: {
      '조리보조도구': { items: { '제면기': 7.8 } },
    },
  },
  '패션': {
    default: 10.5,
    sub: {
      '쥬얼리': { items: { '순금/골드바/돌반지': 4 } },
      '패션의류': { default: 10.5 },
      '패션잡화': { default: 10.5 },
    },
  },
  '반려/애완용품': { default: 10.8 },
};

const DEFAULT_COMMISSION = 10.8;

// ---------------------
// 로켓배송 사이즈별 배송비 (원)
// ---------------------
const ROCKET_FEES: Record<RocketSize, { normal: number; pro: number }> = {
  xSmall: { normal: 3850, pro: 1950 },
  small:  { normal: 4150, pro: 2200 },
  midium: { normal: 5000, pro: 3350 },
  large:  { normal: 6400, pro: 3575 },
  xLarge: { normal: 7900, pro: 5475 },
  xxLarge:{ normal: 11900, pro: 6975 },
};

const WING_FEE = 3000;

// ---------------------
// 카테고리 문자열 → 수수료율 (%)
// 3단계 탐색: 대분류 > 중분류 > 소분류
// ---------------------
export function getCommission(categoryStr: string | null | undefined): number {
  if (!categoryStr) return DEFAULT_COMMISSION;
  const parts = categoryStr.split('>').map((s) => s.trim());
  const cat1 = parts[0] || '';
  const cat2 = parts[1] || '';
  const cat3 = parts[2] || '';

  const top = COMMISSION_RATES[cat1];
  if (!top) return DEFAULT_COMMISSION;
  if (!top.sub) return top.default ?? DEFAULT_COMMISSION;

  const mid = top.sub[cat2];
  if (!mid) return top.default ?? DEFAULT_COMMISSION;
  if (mid.items && cat3 && mid.items[cat3] !== undefined) return mid.items[cat3];
  if (mid.default !== undefined) return mid.default;
  return top.default ?? DEFAULT_COMMISSION;
}

// ---------------------
// 배송비 계산
// ---------------------
export function getShipFee(deliveryType: DeliveryType, size: RocketSize = 'small'): number {
  if (deliveryType === 'wing') return WING_FEE;
  const tier = ROCKET_FEES[size] ?? ROCKET_FEES.small;
  return deliveryType === 'rocket_pro' ? tier.pro : tier.normal;
}

// ---------------------
// 수익 계산 (VAT 포함)
// salePrice: 쿠팡 판매가
// importCost: 수입 원가 (1688 소싱가 + 배대지 등)
// commRate: 수수료율 (%)
// shipFee: 배송비
// ---------------------
export function calcProfit(salePrice: number, importCost: number, commRate: number, shipFee: number): number {
  const commFee = salePrice * (commRate / 100);
  const shipVAT = shipFee * 0.1;
  const commVAT = commFee * 0.1;
  const netVAT = (salePrice - salePrice / 1.1 - (importCost - importCost / 1.1) - shipVAT - commVAT);
  const profit = salePrice - importCost - shipFee - shipVAT - commFee - commVAT - netVAT;
  return Math.round(profit);
}

export function calcMargin(profit: number, salePrice: number): number {
  if (salePrice <= 0) return 0;
  return Math.round((profit / salePrice) * 1000) / 10; // 소수점 1자리
}

export function calcROAS(marginPercent: number): number {
  if (marginPercent <= 0) return 0;
  return Math.round((11000 / marginPercent) * 10) / 10; // 소수점 1자리
}

// ---------------------
// 통합: 수익 분석 결과
// ---------------------
export function analyzeProfitability(
  salePrice: number,
  importCost: number,
  categoryStr: string | null | undefined,
  deliveryType: DeliveryType,
  rocketSize: RocketSize = 'small',
): ProfitAnalysis {
  const commission_rate = getCommission(categoryStr);
  const shipping_fee = getShipFee(deliveryType, rocketSize);
  const commission_fee = Math.round(salePrice * (commission_rate / 100));
  const profit = calcProfit(salePrice, importCost, commission_rate, shipping_fee);
  const margin_percent = calcMargin(profit, salePrice);
  const roas = calcROAS(margin_percent);

  return { commission_rate, commission_fee, shipping_fee, profit, margin_percent, roas };
}
