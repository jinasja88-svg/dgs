/**
 * HuggingFace Inference API 번역 클라이언트
 * 환경변수: HF_API_TOKEN
 * 모델: Helsinki-NLP/opus-mt-zh-ko (ZH→KO), Helsinki-NLP/opus-mt-ko-zh (KO→ZH)
 */

const HF_BASE = 'https://api-inference.huggingface.co/models';
const ZH_KO_MODEL = 'Helsinki-NLP/opus-mt-zh-ko';
const KO_ZH_MODEL = 'Helsinki-NLP/opus-mt-ko-zh';

async function hfTranslate(model: string, text: string): Promise<string> {
  if (!text.trim()) return text;

  const token = process.env.HF_API_TOKEN;
  if (!token) return text; // 폴백: 원문 반환

  // cold start 시 503 반환 → 대기 후 재시도 (최대 2회)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${HF_BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (res.status === 503) {
        const json = await res.json().catch(() => ({}));
        const wait = Math.min((json.estimated_time ?? 10) * 1000, 15000);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) return text;

      const json = await res.json();
      return json?.[0]?.translation_text ?? text;
    } catch {
      return text;
    }
  }

  return text;
}

export async function translateZhToKo(text: string): Promise<string> {
  return hfTranslate(ZH_KO_MODEL, text);
}

export async function translateKoToZh(text: string): Promise<string> {
  return hfTranslate(KO_ZH_MODEL, text);
}
