/**
 * 1688 직접 API 클라이언트
 *
 * 두 가지 모드:
 * - 프록시 모드: ALI1688_PROXY_URL → 중국 프록시 서버 경유
 * - 직접 모드: 서버에서 1688 API 직접 호출
 */

import { acquireToken, callMtop, callViaProxy, getProxyUrl, proxiedFetch } from './mtop';

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

  // 직접 호출: 세션 쿠키 포함하여 봇 차단 우회
  const { cookies } = await acquireToken();

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

  const res = await proxiedFetch(`https://search.1688.com/service/imageSearchOfferResultViewService?${queryParams}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://s.1688.com/',
      'Accept': '*/*',
      'Cookie': cookies,
    },
  });

  const data = await res.json();

  if (process.env.NODE_ENV === 'development') {
    console.log('[1688 imageSearch] status:', data.status, '| keys:', Object.keys(data.data || {}));
  }

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

// 1688 검색 페이지의 TPP(Taobao Page Platform) ID
const SEARCH_TPPID = 32517;
const SEARCH_PAGE_ID = 'GhwpBrPKR5OMydkWKGhf24pD5weFsBOg9FLvtQU9uOShVA43';

interface TppOfferItem {
  cellType: string;
  data: {
    offerId: string;
    title: string;
    priceInfo?: { price: string; priceType?: string };
    offerPicUrl?: string;
    odPicUrl?: string;
    linkUrl?: string;
    isP4P?: string | boolean;
    isAd?: string | boolean;
    company?: { name: string };
    tradeQuantity?: { value: number };
    afterPrice?: { text: string };
    loginId?: string;
  };
}

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

  // 직접 모드: TPP 검색 API (mtop.relationrecommend.WirelessRecommend.recommend v2.0)
  const tppParams: Record<string, unknown> = {
    method: 'getOfferList',
    keywords: keyword,
    pageId: SEARCH_PAGE_ID,
    verticalProductFlag: 'pcmarket',
    searchScene: 'pcOfferSearch',
    charset: 'GBK',
    beginPage: page,
    pageSize,
  };
  if (sort) tppParams.sortType = sort;

  const result = await callMtop<{
    ret: string[];
    data: {
      result: unknown[];
      code: string;
      data: {
        OFFER?: {
          found: string;
          hasMore: string;
          items: TppOfferItem[];
        };
      };
    };
  }>({
    api: 'mtop.relationrecommend.WirelessRecommend.recommend',
    version: '2.0',
    data: {
      appId: SEARCH_TPPID,
      params: JSON.stringify(tppParams),
    },
    method: 'POST',
  });

  const offerData = result?.data?.data?.OFFER;

  if (process.env.NODE_ENV === 'development') {
    console.log('[1688 keywordSearch] ret:', result.ret, '| code:', result?.data?.code, '| items:', offerData?.items?.length ?? 0);
  }

  if (!offerData?.items) {
    return { offerList: [], totalCount: 0, pageCount: 1 };
  }

  const totalCount = Number(offerData.found) || 0;
  const pageCount = Math.ceil(totalCount / pageSize) || 1;

  const offerList: Ali1688SearchItem[] = offerData.items
    .filter((item) => item?.data?.offerId)
    .map((item) => ({
      offerId: Number(item.data.offerId),
      subject: item.data.title || '',
      image: { imgUrl: item.data.offerPicUrl || item.data.odPicUrl || '' },
      priceInfo: item.data.priceInfo ? { price: item.data.priceInfo.price } : undefined,
      company: item.data.company
        ? { name: item.data.company.name }
        : item.data.loginId
          ? { name: item.data.loginId }
          : undefined,
    }));

  return { offerList, totalCount, pageCount };
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

// ─── 상품 상세 (HTML 스크래핑) ───

/**
 * 1688 상품 상세 페이지 HTML에서 window.context JSON을 파싱하여 상품 정보를 반환.
 * 한국 IP에서도 detail.1688.com은 접근 가능하며 HTML 내 JSON에 상품 데이터가 내장됨.
 */
export async function getItemDetail(offerId: string): Promise<Ali1688ItemDetail | null> {
  const proxyUrl = getProxyUrl();

  if (proxyUrl) {
    try {
      const result = await callViaProxy<{ data: { data: Ali1688ItemDetail } }>(
        proxyUrl,
        `/product/${offerId}`,
        { method: 'GET' }
      );
      return result?.data?.data || null;
    } catch {
      return null;
    }
  }

  // 직접 모드: detail.1688.com HTML 스크래핑
  try {
    const res = await proxiedFetch(`https://detail.1688.com/offer/${offerId}.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // window.context= 에서 JSON 추출
    const contextMatch = html.match(/window\.context\s*=\s*(\{[\s\S]+?);\s*(?:window\.|<\/script>)/);
    if (!contextMatch) return null;

    let ctx: Record<string, unknown>;
    try {
      ctx = JSON.parse(contextMatch[1]);
    } catch {
      return null;
    }

    // 상품 기본 정보
    const offerBaseInfo = extractNested(ctx, ['result', 'data', 'offerBaseInfo']) as Record<string, unknown> | null;
    const skuInfo = extractNested(ctx, ['result', 'data', 'skuInfoMap']) as Record<string, unknown> | null;
    const priceRanges = extractNested(ctx, ['result', 'data', 'priceRangeList']) as Array<{ startQuantity: number; price: number }> | null;
    const sellerInfo = extractNested(ctx, ['result', 'data', 'sellerMemberId']) as string | null;
    const companyInfo = extractNested(ctx, ['result', 'data', 'sellerLoginId']) as string | null;

    // 이미지 추출
    const imageList = extractNested(ctx, ['result', 'data', 'offerImageList']) as Array<{ imageUrl?: string }> | null;
    const images: string[] = (imageList || [])
      .map((img) => img?.imageUrl || '')
      .filter(Boolean)
      .map((url) => url.startsWith('//') ? `https:${url}` : url);

    // 주제 (상품명)
    const subject = (
      extractNested(ctx, ['result', 'data', 'subject']) ||
      html.match(/"subject":"([^"]+)"/)?.[1] ||
      ''
    ) as string;

    // SKU 정보
    const skuMap = skuInfo as Record<string, { specList?: Array<{ name: string; value: string }>; price?: number; canBookCount?: number; imageUrl?: string }> | null;
    const skuInfos = skuMap
      ? Object.entries(skuMap).map(([skuId, sku]) => ({
          skuId: Number(skuId),
          specAttrs: (sku.specList || []).map((s) => ({ name: s.name, value: s.value })),
          price: String(sku.price || 0),
          amountOnSale: sku.canBookCount || 0,
          imageUrl: sku.imageUrl,
        }))
      : [];

    // 가격
    const priceInfo = priceRanges?.map((r) => ({
      beginAmount: r.startQuantity || 1,
      price: String(r.price || 0),
    })) || [];

    const offerId_num = Number(offerId);

    if (!subject) return null;

    return {
      offerId: offerId_num,
      subject,
      images,
      skuInfos,
      priceInfo: priceInfo.length ? priceInfo : undefined,
      sellerInfo: (companyInfo || sellerInfo)
        ? { loginId: String(companyInfo || ''), companyName: String(companyInfo || sellerInfo || ''), sellerLevel: '', yearOfBegin: 0 }
        : undefined,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[1688 itemDetail] scrape error:', err);
    }
    return null;
  }
}

function extractNested(obj: unknown, keys: string[]): unknown {
  let cur = obj;
  for (const key of keys) {
    if (!cur || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur ?? null;
}
