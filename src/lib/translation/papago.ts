/**
 * HuggingFace Inference API 번역 클라이언트
 * 환경변수: HF_API_TOKEN
 * 모델: Qwen/Qwen2.5-7B-Instruct via featherless-ai provider
 */

const HF_ROUTER_URL = 'https://router.huggingface.co/featherless-ai/v1/chat/completions';
const MODEL = 'Qwen/Qwen2.5-7B-Instruct';

async function hfCall(systemPrompt: string, userContent: string, maxTokens = 200): Promise<string | null> {
  const token = process.env.HF_API_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(HF_ROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function translateZhToKo(text: string): Promise<string> {
  if (!text.trim()) return text;
  const result = await hfCall(
    'Translate the following Chinese text to Korean. Reply with only the Korean translation, no explanation.',
    text
  );
  return result ?? text;
}

/**
 * 여러 중국어 텍스트를 단일 API 호출로 번역
 * 빈 문자열이나 중국어가 없는 항목은 원문 반환
 */
export async function translateZhToKoBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) {
    return [await translateZhToKo(texts[0])];
  }

  const token = process.env.HF_API_TOKEN;
  if (!token) return texts;

  // 번호 붙여서 전송, 파싱 실패 시 원문 반환
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const maxTokens = texts.length * 60 + 100;

  const result = await hfCall(
    `Translate each numbered Chinese item to Korean. Output ONLY the numbered translations in the same format, one per line. Example:\n1. 한국어번역\n2. 한국어번역`,
    numbered,
    maxTokens
  );

  if (!result) return texts;

  // "1. xxx" 형식 파싱
  const lines = result.split('\n');
  const parsed: string[] = [...texts]; // fallback to original

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*(.+)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < texts.length && match[2].trim()) {
        parsed[idx] = match[2].trim();
      }
    }
  }

  return parsed;
}

export async function translateKoToZh(text: string): Promise<string> {
  if (!text.trim()) return text;
  const result = await hfCall(
    'Translate the following Korean text to Chinese (Simplified). Reply with only the Chinese translation, no explanation.',
    text
  );
  return result ?? text;
}
