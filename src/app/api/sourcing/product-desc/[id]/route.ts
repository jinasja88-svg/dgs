import { type NextRequest, NextResponse } from 'next/server';
import { CACHE_TTL, getCachedItemDetail } from '@/lib/tmapi';
import { getCached, setCached } from '@/lib/persistent-cache';
import sanitizeHtml from 'sanitize-html';

// 판매자가 작성한 HTML을 우리 도메인에서 렌더하므로 스크립트/이벤트 핸들러/iframe 등을 제거한다
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'div', 'span', 'br', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'strong', 'b', 'em', 'i', 'u', 'font', 'center', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
  ],
  allowedAttributes: {
    '*': ['style', 'align', 'width', 'height'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    td: ['colspan', 'rowspan', 'style', 'width', 'align'],
    font: ['color', 'size'],
  },
  allowedSchemes: ['https'],
  allowProtocolRelative: false,
  // 이미지 프록시 경로(상대 URL)는 허용
  allowedSchemesAppliedToAttributes: ['src', 'href'],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // v2: sanitize 적용 이전에 저장된 캐시를 재사용하지 않도록 키 변경
  const cacheKey = `tmapi:desc:v2:${id}`;
  const cached = await getCached<{ html: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // detail-raw 캐시는 /api/sourcing/product/[id] 와 공유 — 동시 호출 시 dedupe로 1콜
    const detail = await getCachedItemDetail(id, 'ko');

    if (!detail.detail_url) {
      return NextResponse.json({ html: '' });
    }

    // detail_url returns JS: var offer_details={"content":"<html>..."};
    const res = await fetch(detail.detail_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://detail.1688.com/',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ html: '' });
    }

    const text = await res.text();

    // Parse: var offer_details={"content":"<html>..."};
    const match = text.match(/var\s+offer_details\s*=\s*(\{[\s\S]+\})\s*;?\s*$/);
    if (!match) {
      return NextResponse.json({ html: '' });
    }

    let html: string;
    try {
      const parsed = JSON.parse(match[1]);
      html = parsed.content || '';
    } catch {
      return NextResponse.json({ html: '' });
    }

    // Fix protocol-relative image URLs
    html = html.replace(/src="\/\//g, 'src="https://');
    html = html.replace(/src='\/\//g, "src='https://");

    // Proxy alicdn images through our image proxy
    html = html.replace(
      /src="(https?:\/\/[^"]*alicdn\.com[^"]*)"/g,
      (_match, url) => `src="/api/image-proxy?url=${encodeURIComponent(url)}"`
    );
    html = html.replace(
      /src='(https?:\/\/[^']*alicdn\.com[^']*)'/g,
      (_match, url) => `src='/api/image-proxy?url=${encodeURIComponent(url)}'`
    );

    const result = { html: sanitizeHtml(html, SANITIZE_OPTIONS) };
    await setCached(cacheKey, result, CACHE_TTL.DETAIL);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Product desc error:', err);
    return NextResponse.json({ html: '' });
  }
}
