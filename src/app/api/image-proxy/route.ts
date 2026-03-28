import { type NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = ['cbu01.alicdn.com', 'sc01.alicdn.com', 'img.alicdn.com', 'ae01.alicdn.com'];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => parsed.hostname.endsWith(h))) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://detail.1688.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return new NextResponse(null, { status: res.status });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

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
