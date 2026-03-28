import { type NextRequest, NextResponse } from 'next/server';
import { proxiedFetch } from '@/lib/ali1688/mtop';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await proxiedFetch(`https://detail.1688.com/offer/${id}.html`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Referer: 'https://www.1688.com/',
      },
    });

    if (!res.ok) {
      return new NextResponse(errorHtml('상품 페이지를 불러올 수 없습니다. (HTTP ' + res.status + ')'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: res.status,
      });
    }

    let html = await res.text();

    // Fix relative URLs so resources load from 1688.com
    if (!html.includes('<base ')) {
      html = html.replace('<head>', '<head>\n<base href="https://detail.1688.com/">');
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Explicitly omit X-Frame-Options so our iframe can render this page
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류';
    return new NextResponse(errorHtml(msg), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 502,
    });
  }
}

function errorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>오류</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9f9f9;}
.box{text-align:center;color:#666;padding:2rem;}</style>
</head>
<body><div class="box">
<p>⚠️ ${message}</p>
<p style="font-size:12px;margin-top:8px;">중국 프록시가 설정된 경우 상세 페이지를 확인할 수 있습니다.</p>
</div></body>
</html>`;
}
