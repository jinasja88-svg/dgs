/**
 * 1688 mtop API 클라이언트
 *
 * 세 가지 모드 지원:
 * 1. 프록시 모드 (ALI1688_PROXY_URL 설정 시): 중국 Express 프록시 서버 경유
 * 2. Squid 모드 (ALI1688_HTTPS_PROXY 설정 시): Squid HTTP 포워드 프록시 경유
 * 3. 직접 모드 (기본): 서버에서 1688 API 직접 호출
 *
 * 서명 공식: sign = MD5(token + "&" + timestamp + "&" + appKey + "&" + data)
 */

import { createHash } from 'crypto';

// ─── Squid 포워드 프록시 지원 ───

let _squidAgent: unknown = null;

async function proxiedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const squidProxy = process.env.ALI1688_HTTPS_PROXY;
  if (squidProxy) {
    if (!_squidAgent) {
      const { ProxyAgent } = await import('undici');
      _squidAgent = new ProxyAgent(squidProxy);
    }
    return fetch(url, { ...options, dispatcher: _squidAgent } as RequestInit & { dispatcher: unknown });
  }
  return fetch(url, options);
}

const MTOP_BASE = 'https://h5api.m.1688.com/h5';
const APP_KEY = '12574478';
const JSV = '2.7.2';

export interface MtopToken {
  token: string;
  cookies: string;
  expiresAt: number;
}

let cachedToken: MtopToken | null = null;

function getProxyUrl(): string | null {
  return process.env.ALI1688_PROXY_URL || null;
}

function getProxySecret(): string {
  return process.env.ALI1688_PROXY_SECRET || '';
}

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

function generateSign(token: string, timestamp: string, appKey: string, data: string): string {
  return md5(`${token}&${timestamp}&${appKey}&${data}`);
}

/**
 * 1688.com에 접속하여 _m_h5_tk 토큰을 획득
 */
export async function acquireToken(): Promise<MtopToken> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken;
  }

  // 프록시 모드: 프록시 서버의 /health에서 토큰 상태 확인 (토큰 관리는 프록시가 담당)
  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    cachedToken = {
      token: 'proxy-managed',
      cookies: '',
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    return cachedToken;
  }

  // 직접 모드: 1688에서 토큰 획득
  const cookieMap = new Map<string, string>();

  // Step 1: 메인 페이지 접속
  const res = await proxiedFetch('https://www.1688.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    redirect: 'manual',
  });

  for (const sc of (res.headers.getSetCookie?.() || [])) {
    const match = sc.match(/^([^=]+)=([^;]*)/);
    if (match) cookieMap.set(match[1], match[2]);
  }

  let token = '';
  const h5tk = cookieMap.get('_m_h5_tk');
  if (h5tk) {
    token = decodeURIComponent(h5tk.trim().split('_')[0] || '');
  }

  // Step 2: 토큰 없으면 mtop 호출로 재시도
  if (!token) {
    const mtopRes = await proxiedFetch(
      `${MTOP_BASE}/mtop.1688.imageservice.putimage/1.0/?jsv=${JSV}&appKey=${APP_KEY}&t=${Date.now()}&sign=undefined&api=mtop.1688.imageService.putImage&v=1.0&type=originaljson&dataType=jsonp`,
      {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://s.1688.com/',
          'Origin': 'https://s.1688.com',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'data={}',
      }
    );

    for (const sc of (mtopRes.headers.getSetCookie?.() || [])) {
      const match = sc.match(/^([^=]+)=([^;]*)/);
      if (match) cookieMap.set(match[1], match[2]);
    }

    const h5tk2 = cookieMap.get('_m_h5_tk');
    if (h5tk2) {
      token = decodeURIComponent(h5tk2.trim().split('_')[0] || '');
    }
  }

  if (!token) {
    throw new Error('Failed to acquire _m_h5_tk token from 1688.com');
  }

  const cookies = Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  cachedToken = {
    token,
    cookies,
    expiresAt: Date.now() + 25 * 60 * 1000, // 25분 유효
  };

  return cachedToken;
}

export function invalidateToken(): void {
  cachedToken = null;
}

/**
 * 프록시 서버를 경유하여 API 호출
 */
async function callViaProxy<T>(
  proxyUrl: string,
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> }
): Promise<T> {
  const { method = 'GET', body, query } = options;

  let url = `${proxyUrl}${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Proxy-Token': getProxySecret(),
    },
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Proxy error: ${err.error || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * mtop API 호출 (직접 모드)
 */
export async function callMtop<T = unknown>(params: {
  api: string;
  version?: string;
  data: Record<string, unknown>;
  method?: 'GET' | 'POST';
}): Promise<T> {
  const { api, version = '1.0', data, method = 'POST' } = params;
  const { token, cookies } = await acquireToken();
  const timestamp = String(Date.now());
  const dataStr = JSON.stringify(data);
  const sign = generateSign(token, timestamp, APP_KEY, dataStr);

  const apiPath = api.toLowerCase();
  const queryParams = new URLSearchParams({
    jsv: JSV,
    appKey: APP_KEY,
    t: timestamp,
    sign,
    api,
    ecode: '0',
    v: version,
    type: 'originaljson',
    dataType: 'jsonp',
  });

  const url = `${MTOP_BASE}/${apiPath}/${version}/?${queryParams}`;

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Referer': 'https://s.1688.com/',
    'Origin': 'https://s.1688.com',
    'Accept': 'application/json',
    'Cookie': cookies,
  };

  let response: Response;

  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    response = await proxiedFetch(url, {
      method: 'POST',
      headers,
      body: `data=${encodeURIComponent(dataStr)}`,
    });
  } else {
    response = await proxiedFetch(url, { method: 'GET', headers });
  }

  const result = await response.json();

  // TOKEN 오류 → 갱신 후 1회 재시도
  if (result.ret && Array.isArray(result.ret)) {
    const retStr = result.ret.join(',');
    if (retStr.includes('TOKEN_EMPTY') || retStr.includes('ILLEGAL_ACCESS') || retStr.includes('SID_INVALID')) {
      invalidateToken();
      const newAuth = await acquireToken();
      const newTimestamp = String(Date.now());
      const newSign = generateSign(newAuth.token, newTimestamp, APP_KEY, dataStr);

      const retryParams = new URLSearchParams({
        jsv: JSV,
        appKey: APP_KEY,
        t: newTimestamp,
        sign: newSign,
        api,
        ecode: '0',
        v: version,
        type: 'originaljson',
        dataType: 'jsonp',
      });

      const retryUrl = `${MTOP_BASE}/${apiPath}/${version}/?${retryParams}`;
      headers['Cookie'] = newAuth.cookies;

      const retryRes = method === 'POST'
        ? await proxiedFetch(retryUrl, { method: 'POST', headers, body: `data=${encodeURIComponent(dataStr)}` })
        : await proxiedFetch(retryUrl, { method: 'GET', headers });

      return retryRes.json() as Promise<T>;
    }
  }

  return result as T;
}

export { callViaProxy, getProxyUrl, proxiedFetch };
