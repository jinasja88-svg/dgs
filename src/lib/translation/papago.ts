/**
 * Papago (Naver) 번역 API 클라이언트
 * 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 */

// NCP Papago Translation API
const PAPAGO_URL = 'https://papago.apigw.ntruss.com/nmt/v1/translation';

async function translate(
  text: string,
  source: 'zh-CN' | 'ko',
  target: 'ko' | 'zh-CN'
): Promise<string> {
  if (!text.trim()) return text;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return text; // fallback: 원문 반환
  }

  try {
    const res = await fetch(PAPAGO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
      body: JSON.stringify({ source, target, text }),
    });

    if (!res.ok) return text;

    const data = await res.json();
    return data?.message?.result?.translatedText ?? text;
  } catch {
    return text;
  }
}

export async function translateZhToKo(text: string): Promise<string> {
  return translate(text, 'zh-CN', 'ko');
}

export async function translateKoToZh(text: string): Promise<string> {
  return translate(text, 'ko', 'zh-CN');
}
