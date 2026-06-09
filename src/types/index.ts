export interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  subscription_plan: 'free' | 'basic' | 'pro';
  subscription_expires_at: string | null;
  preferred_categories?: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  type: 'course' | 'software';
  title: string;
  slug: string;
  description: string | null;
  content_html: string | null;
  price: number;
  discount_price: number | null;
  thumbnail_url: string | null;
  category_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  total_amount: number;
  payment_method: string | null;
  payment_key: string | null;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  product?: Product;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  detail_address?: string;
  postal_code: string;
}

// Sourcing types
export interface SourcingProduct {
  product_id: string;
  title: string;
  title_zh?: string;
  price_cny: number;
  price_krw: number;
  price_cny_max?: number;
  origin_price_cny?: number;
  import_unit_label?: string;
  images: string[];
  skus: SourcingSku[];
  seller: SourcingSeller | null;
  stock: number;
  category?: string;
  min_order?: number;
  detail_url?: string;
  sale_count?: number;
  sales_90d?: number;
  sales_monthly?: number;
  repurchase_rate?: number;
  rating?: number;
  service_tags?: string[];
  service_labels?: string[];
  product_props?: Array<Record<string, string>>;
  /** 단위 무게(kg) — TMAPI delivery_info.unit_weight */
  weight_kg?: number;
  /** 사이즈/규격 — product_props 내 尺寸/规格/包装尺寸 등에서 추출(있을 때만) */
  dimensions?: string;
  tier_prices?: Array<{ begin_num: number; price_cny: number; price_krw: number }>;
  // ─ Phase 1: 신뢰 시그널 / 배지 ─
  badges?: SourcingBadge[];
  is_new?: boolean;
  ships_in_24h?: boolean;
  ships_in_48h?: boolean;
  is_1688_select?: boolean;
  is_super_factory?: boolean;
  free_shipping?: boolean;
  return_in_7d?: boolean;
  is_ad?: boolean;
}

export type SourcingBadgeTone = 'primary' | 'ink' | 'success' | 'muted';
export type SourcingBadgeType =
  | 'new_7d'
  | 'new_30d'
  | 'select_1688'
  | 'super_factory'
  | 'plus'
  | 'free_shipping'
  | 'return_7d'
  | 'bestseller';

export interface SourcingBadge {
  type: SourcingBadgeType;
  label: string;
  tone: SourcingBadgeTone;
}

export interface SourcingSku {
  sku_id: string;
  name: string;
  price_cny: number;
  price_krw: number;
  stock: number;
  image?: string;
  properties?: Record<string, string>;
}

export interface SourcingSeller {
  name: string;
  rating?: number;
  years?: number;
  location?: string;
  is_super_factory?: boolean;
  repurchase_rate?: number;
  sales_90d?: number;
  delivery_24h_rate?: number;
  delivery_48h_rate?: number;
  is_plus?: boolean;
}

export interface SourcingOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: SourcingOrderStatus;
  items: SourcingOrderItem[];
  total_cny: number;
  total_krw: number;
  service_fee: number;
  shipping_fee: number;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export type SourcingOrderStatus =
  | 'pending'
  | 'paid'
  | 'purchasing'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export interface SourcingOrderItem {
  product_id: string;
  title: string;
  image: string;
  sku_name?: string;
  quantity: number;
  price_cny: number;
  price_krw: number;
}

/** B2B 결제 시 입력하는 주문자 사업자 정보 (필수) */
export interface BusinessInfo {
  company_name: string;        // 상호
  registration_number: string; // 사업자등록번호 (10자리)
  representative: string;      // 대표자명
  business_type: string;       // 업태
  business_item: string;       // 종목
  address: string;             // 사업장 주소
}

/** 약관 동의 스냅샷 */
export interface TermsAgreed {
  terms: boolean;    // 이용약관
  privacy: boolean;  // 개인정보 처리방침
  coupang: boolean;  // 쿠팡 로켓그로스 관련 안내
  agreed_at: string; // 동의 시각 ISO
}

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  fetched_at: string;
}

export interface SourcingCategory {
  id: string;
  name: string;
  name_zh: string;
  icon?: string;
}

export interface SourcingCartItem {
  product_id: string;
  title: string;
  image: string;
  sku_id?: string;
  sku_name?: string;
  quantity: number;
  price_cny: number;
  price_krw: number;
  min_order?: number;
}

export interface SourcingReview {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// CS (Customer Service) types
export type CSInquiryCategory = 'order' | 'shipping' | 'return' | 'product' | 'payment' | 'other';
export type CSInquiryStatus   = 'open' | 'in_progress' | 'answered' | 'closed';
export type CSReturnType      = 'return' | 'exchange';
export type CSReturnReason    = 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'other';
export type CSReturnStatus    = 'requested' | 'reviewing' | 'approved' | 'rejected' | 'completed';

export interface CSInquiry {
  id: string;
  user_id: string;
  order_id?: string | null;
  category: CSInquiryCategory;
  title: string;
  content: string;
  status: CSInquiryStatus;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  profile?: Pick<Profile, 'id' | 'name' | 'email'>;
  order?: Pick<SourcingOrder, 'id' | 'order_number'>;
}

export interface CSReturn {
  id: string;
  user_id: string;
  order_id: string;
  return_type: CSReturnType;
  reason: CSReturnReason;
  detail: string;
  status: CSReturnStatus;
  refund_amount?: number | null;
  admin_note?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  profile?: Pick<Profile, 'id' | 'name' | 'email'>;
  order?: Pick<SourcingOrder, 'id' | 'order_number'>;
}

export interface CSFAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Coupang Analysis types
export type { CoupangProduct, DeliveryType, RocketSize, ProfitAnalysis, CoupangSortKey } from '@/lib/coupang/types';

export interface Generated13SectionContent {
  hero: {
    headline_options: string[];
    subheadline: string;
    urgency_badge: string;
    cta_text: string;
  };
  pain: {
    intro: string;
    pain_points: string[];
    emotional_hook: string;
  };
  problem: {
    hook: string;
    reasons: string[];
    reframe: string;
  };
  solution: {
    intro: string;
    one_liner: string;
    target_fit: string;
  };
  how_it_works: {
    steps: { title: string; description: string }[];
  };
  benefits: {
    items: { title: string; description: string }[];
  };
  social_proof: {
    headline: string;
    stats: string[];
    testimonials: { name: string; content: string; result: string }[];
  };
  target_filter: {
    recommended: string[];
    not_recommended: string[];
  };
  faq: { question: string; answer: string }[];
  final_cta: {
    headline: string;
    urgency: string;
    cta_text: string;
    closing: string;
  };
  trust_text: string;
}
