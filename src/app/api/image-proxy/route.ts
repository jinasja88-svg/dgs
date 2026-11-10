import { type NextRequest, NextResponse } from 'next/server';

// alicdn.com 및 그 하위 도메인만 허용 (product-desc가 모든 *.alicdn.com 이미지를 이 프록시로 돌림)
const ALLOWED_DOMAINS = ['alicdn.com'];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  const hostAllowed = ALLOWED_DOMAINS.some(
    (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
  );
  if (!['https:', 'http:'].includes(parsed.protocol) || !hostAllowed) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(parsed, {
      // 리다이렉트로 허용 도메인 밖을 가져오지 않도록 차단
      redirect: 'manual',
      headers: {
        'Referer': 'https://detail.1688.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return new NextResponse(null, { status: res.status });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return new NextResponse(null, { status: 415 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
