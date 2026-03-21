/**
 * 1688 직접 API 클라이언트
 *
 * 두 가지 모드:
 * - 프록시 모드: ALI1688_PROXY_URL → 중국 프록시 서버 경유
 * - 직접 모드: 서버에서 1688 API 직접 호출
 */

import { callMtop, callViaProxy, getProxyUrl } from './mtop';

// ─── Types ───

export interface Ali1688UploadResult {
  requestId: string;
  sessionId: string;
  imageId: string;
}

export interface Ali1688SearchItem {
  offerId: number;
  subject: string;
  image: {
    imgUrl: string;
  };
  priceInfo?: {
    price: string;
  };
  tradeQuantity?: {
    value: number;
  };
  company?: {
    name: string;
  };
}

export interface Ali1688ImageSearchResult {
  offerList: Ali1688SearchItem[];
  allCategories?: Array<{ categoryId: string; name: string; count: number }>;
  pageCount: number;
}

export interface Ali1688ItemDetail {
  offerId: number;
  subject: string;
  categoryName?: string;
  images: string[];
  priceInfo?: Array<{ beginAmount: number; price: string }>;
  skuInfos?: Array<{
    skuId: number;
    specAttrs: Array<{ name: string; value: string }>;
    price: string;
    amountOnSale: number;
    imageUrl?: string;
  }>;
  sellerInfo?: {
    loginId: string;
    companyName: string;
    sellerLevel: string;
    yearOfBegin: number;
    tp?: { score: number };
    bizArea?: string;
  };
  quantityBegin?: number;
  saleCount?: number;
}

// ─── 이미지 업로드 ───

const IMAGE_UPLOAD_APP_KEY = 'pvvljh1grxcmaay2vgpe9nb68gg9ueg2';

export async function uploadImage(imageBase64: string): Promise<Ali1688UploadResult> {
  const raw = imageBase64.includes(',') ? imageBase64.split(',').pop()! : imageBase64;
  const proxyUrl = getProxyUrl();

  if (proxyUrl) {
    // 프록시 경유
    const result = await callViaProxy<{ data?: { data?: Ali1688UploadResult } }>(
      proxyUrl,
      '/upload-image',
      { method: 'POST', body: { imageBase64: raw } }
    );
    const d = result?.data?.data;
    if (!d?.requestId || !d?.sessionId || !d?.imageId) {
      throw new Error(`1688 image upload failed via proxy: ${JSON.stringify(result)}`);
    }
    return d;
  }

  // 직접 호출
  const result = await callMtop<{
    data: { data: { requestId: string; sessionId: string; imageId: string } };
    ret: string[];
  }>({
    api: 'mtop.1688.imageService.putImage',
    version: '1.0',
    data: {
      imageBase64: raw,
      appName: 'searchImageUpload',
      appKey: IMAGE_UPLOAD_APP_KEY,
    },
    method: 'POST',
  });

  const d = result?.data?.data;
  if (!d?.requestId || !d?.sessionId || !d?.imageId) {
    throw new Error(`1688 image upload failed: ${JSON.stringify(result?.ret || result)}`);
  }

  return { requestId: d.requestId, sessionId: d.sessionId, imageId: d.imageId };
}

// ─── 이미지 검색 ───

export async function searchByImage(params: {
  imageId: string;
  sessionId: string;
  requestId: string;
  page?: number;
  pageSize?: number;
  categoryId?: string;
}): Promise<Ali1688ImageSearchResult> {
  const { imageId, sessionId, requestId, page = 1, pageSize = 40, categoryId } = params;
  const proxyUrl = getProxyUrl();

  const query: Record<string, string> = {
    imageId,
    sessionId,
    requestId,
    page: String(page),
    pageSize: String(pageSize),
  };
  if (categoryId) query.categoryId = categoryId;

  if (proxyUrl) {
    const data = await callViaProxy<{
      status: string;
      data: { data: { offerList: Ali1688SearchItem[]; allCategories?: unknown[]; pageCount: number } };
    }>(proxyUrl, '/image-search', { method: 'GET', query });

    return {
      offerList: data?.data?.data?.offerList || [],
      pageCount: data?.data?.data?.pageCount || 1,
    };
  }

  // 직접 호출
  const queryParams = new URLSearchParams({
    tab: 'imageSearch',
    imageId,
    imageIdList: imageId,
    filt: 'y',
    beginPage: String(page),
    pageSize: String(pageSize),
    pageName: 'image',
    requestId,
    sessionId,
  });
  if (categoryId) queryParams.set('pailitaoCategoryId', categoryId);

  const res = await fetch(`https://search.1688.com/service/imageSearchOfferResultViewService?${queryParams}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://s.1688.com/',
      'Accept': '*/*',
    },
  });

  const data = await res.json();

  if (data.status !== 'success' || !data.data?.data?.offerList) {
    throw new Error(`1688 image search failed: ${JSON.stringify(data.data?.code || data.status)}`);
  }

  return {
    offerList: data.data.data.offerList || [],
    allCategories: data.data.data.allCategories || [],
    pageCount: data.data.data.pageCount || 1,
  };
}

// ─── 키워드 검색 ───

export async function searchByKeyword(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}): Promise<{
  offerList: Ali1688SearchItem[];
  totalCount: number;
  pageCount: number;
}> {
  const { keyword, page = 1, pageSize = 40, sort } = params;
  const proxyUrl = getProxyUrl();

  const query: Record<string, string> = {
    keyword,
    page: String(page),
    pageSize: String(pageSize),
  };
  if (sort) query.sort = sort;

  if (proxyUrl) {
    const data = await callViaProxy<{
      data: { data: { offerList: Ali1688SearchItem[]; totalCount: number; pageCount: number } };
    }>(proxyUrl, '/keyword-search', { method: 'GET', query });

    return {
      offerList: data?.data?.data?.offerList || [],
      totalCount: data?.data?.data?.totalCount || 0,
      pageCount: data?.data?.data?.pageCount || 1,
    };
  }

  // 직접 호출
  const queryParams = new URLSearchParams({
    keywords: keyword,
    beginPage: String(page),
    pageSize: String(pageSize),
    pageName: 'search',
    filt: 'y',
    tab: 'all',
  });
  if (sort) queryParams.set('sortType', sort);

  const res = await fetch(`https://search.1688.com/service/offerSearchService?${queryParams}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://s.1688.com/',
      'Accept': '*/*',
    },
  });

  const data = await res.json();

  return {
    offerList: data.data?.data?.offerList || [],
    totalCount: data.data?.data?.totalCount || 0,
    pageCount: data.data?.data?.pageCount || 1,
  };
}

// ─── URL → base64 변환 ───

export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl;

  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(buffer).toString('base64');

  return `data:${contentType};base64,${base64}`;
}

// ─── 상품 상세 ───

export async function getItemDetail(offerId: string): Promise<Ali1688ItemDetail | null> {
  try {
    const result = await callMtop<{
      data: { data: Ali1688ItemDetail };
      ret: string[];
    }>({
      api: 'mtop.1688.modularasyncservice.executemodulearservice',
      version: '1.0',
      data: { offerId, language: 'ko' },
      method: 'POST',
    });

    return result?.data?.data || null;
  } catch {
    return null;
  }
}
