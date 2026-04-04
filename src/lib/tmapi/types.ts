// TMAPI (api.tmapi.io) response types for 1688

export interface TmapiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// ─── Keyword Search ───

export interface TmapiSearchResult {
  page: number;
  page_size: number;
  has_next_page: boolean;
  total_count: number;
  keyword: string;
  sort: string;
  items: TmapiSearchItem[];
}

export interface TmapiSearchItem {
  item_id: number;
  product_url: string;
  title: string;
  img: string;
  price: string;
  price_info: {
    price: string;
    sale_price: string;
    origin_price: string;
  };
  currency: string;
  moq: string;
  quantity_begin: string;
  sale_info: {
    sale_quantity_90days: string;
  };
  delivery_info: {
    area_from: string[];
    free_shipping: boolean;
  };
  shop_info: {
    company_name: string;
    is_super_factory: boolean;
    shop_years: number;
    score_info?: {
      composite_score: string;
    };
  };
  item_repurchase_rate: string;
  is_ad?: boolean;
}

// ─── Item Detail ───

export interface TmapiItemDetail {
  item_id: number;
  product_url: string;
  title: string;
  category_id: number;
  currency: string;
  main_imgs: string[];
  video_url?: string;
  detail_url?: string;
  sale_count: string;
  price_info: {
    price: string;
    price_min: string;
    price_max: string;
    origin_price_min: string;
    origin_price_max: string;
    discount_price: string;
  };
  tiered_price_info?: {
    begin_num: number;
    prices: Array<{ begin_num: number; price: string }>;
  };
  shop_info: {
    shop_name: string;
    shop_url: string;
    seller_login_id: string;
    seller_user_id: string;
    seller_member_id: string;
  };
  delivery_info?: {
    location: string;
    delivery_fee: number;
  };
  service_tags?: string[];
  sku_props: TmapiSkuProp[];
  skus: TmapiSku[];
  stock: number;
  is_sold_out: boolean;
  product_props?: Array<Record<string, string>>;
}

export interface TmapiSkuProp {
  pid: string;
  prop_name: string;
  values: Array<{
    vid: string;
    name: string;
    imageUrl: string;
  }>;
}

export interface TmapiSku {
  skuid: string;
  specid: string;
  sale_price: string;
  origin_price: string;
  stock: number;
  props_ids: string;
  props_names: string;
  sale_count: number | null;
}

// ─── Image Search ───

export interface TmapiImageSearchResult {
  page: number;
  page_size: number;
  total_count: number;
  items: TmapiImageSearchItem[];
}

export interface TmapiImageSearchItem {
  item_id: number;
  product_url: string;
  title: string;
  img: string;
  price: string;
  price_info: {
    price: string;
    sale_price: string;
    origin_price: string;
  };
  shop_info: {
    company_name: string;
  };
  sale_info?: {
    sale_quantity_90days: string;
  };
}

// ─── Item Ratings ───

export interface TmapiItemRatingsResult {
  item_id: number;
  page: number;
  page_size: number;
  list: TmapiRating[];
}

export interface TmapiRating {
  id: string;
  feedback: string;
  rate_star: string;
  feedback_date: string;
  sku_map?: string;
  images?: string[];
  user_nick?: string;
}

// ─── Search Params ───

export interface TmapiSearchParams {
  keyword: string;
  page?: number;
  page_size?: number;
  sort?: 'default' | 'sales' | 'price_up' | 'price_down';
}

export interface TmapiImageSearchParams {
  img_url: string;
  page?: number;
  page_size?: number;
}
