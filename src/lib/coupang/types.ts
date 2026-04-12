// ============================
// 쿠팡 분석 타입 정의
// ============================

export interface CoupangProduct {
  id: string;
  product_name: string;
  item_name: string | null;
  category: string;
  category_l1: string;
  category_l2: string | null;
  price: number;
  rating: number | null;
  review_count: number;
  view_count: number;
  image_url: string | null;
  coupang_url: string;
  main_keyword: string | null;
  sub_keyword1: string | null;
  sub_keyword2: string | null;
  buy_count: number | null;
  conversion_rate: number | null;
  conversion_source: string | null;
  estimated_monthly_sales: number | null;
  estimated_monthly_revenue: number | null;
  is_excluded_brand: boolean;
  crawled_at: string;
}

export type DeliveryType = 'wing' | 'rocket_normal' | 'rocket_pro';
export type RocketSize = 'xSmall' | 'small' | 'midium' | 'large' | 'xLarge' | 'xxLarge';

export interface ProfitAnalysis {
  commission_rate: number;
  commission_fee: number;
  shipping_fee: number;
  profit: number;
  margin_percent: number;
  roas: number;
}

export type CoupangSortKey =
  | 'view_count'
  | 'estimated_monthly_sales'
  | 'estimated_monthly_revenue'
  | 'price'
  | 'review_count'
  | 'buy_count';
