// TMAPI raw response types

export interface TmapiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// Keyword search
export interface TmapiSearchResult {
  totalCount: number;
  pageSize: number;
  pageIndex: number;
  offerList: TmapiSearchItem[];
}

export interface TmapiSearchItem {
  offerId: number;
  subject: string;
  imageUrl: string;
  priceInfo: {
    price: string; // e.g. "25.50" or "25.50-35.00"
  };
  quantitySummity: number;
  tradeQuantity: number;
  sellerLoginId: string;
  sellerMemberId: string;
  companyName: string;
}

// Item detail
export interface TmapiItemDetail {
  offerId: number;
  subject: string;
  categoryName: string;
  images: string[];
  priceInfo: TmapiPriceRange[];
  skuInfos: TmapiSkuInfo[];
  sellerInfo: TmapiSellerInfo;
  quantityBegin: number;
  saleCount: number;
  description: string;
}

export interface TmapiPriceRange {
  beginAmount: number;
  price: string;
}

export interface TmapiSkuInfo {
  skuId: number;
  specAttrs: TmapiSpecAttr[];
  price: string;
  amountOnSale: number;
  imageUrl?: string;
}

export interface TmapiSpecAttr {
  attributeDisplayName: string;
  value: string;
}

export interface TmapiSellerInfo {
  loginId: string;
  memberId: string;
  companyName: string;
  sellerLevel: string;
  yearOfBegin: number;
  tp: {
    score: number;
  };
  bizArea: string;
}

// Image search
export interface TmapiImageSearchResult {
  totalCount: number;
  pageSize: number;
  data: TmapiImageSearchItem[];
}

export interface TmapiImageSearchItem {
  offerId: number;
  subject: string;
  imageUrl: string;
  price: string;
  companyName: string;
}

// Image convert
export interface TmapiImageConvertResult {
  url: string;
}

// Search params
export interface TmapiSearchParams {
  keyword: string;
  page?: number;
  page_size?: number;
  sort?: 'default' | 'price_asc' | 'price_desc' | 'sale_desc';
}

export interface TmapiImageSearchParams {
  img_url: string;
  page?: number;
  page_size?: number;
}
