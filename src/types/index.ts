export interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  subscription_plan: 'free' | 'basic' | 'pro';
  subscription_expires_at: string | null;
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
  images: string[];
  skus: SourcingSku[];
  seller: SourcingSeller | null;
  stock: number;
  category?: string;
  min_order?: number;
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
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
