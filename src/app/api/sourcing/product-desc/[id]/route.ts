import { type NextRequest, NextResponse } from 'next/server';
import { getTmapiClient, tmapiCache, CACHE_TTL } from '@/lib/tmapi';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cacheKey = `desc:${id}`;
  const cached = tmapiCache.get<{ html: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = getTmapiClient();
    const detail = await client.getItemDetail(id, 'zh');

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

    const result = { html };
    tmapiCache.set(cacheKey, result, CACHE_TTL.DETAIL);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Product desc error:', err);
    return NextResponse.json({ html: '' });
  }
}
