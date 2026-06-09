/**
 * HuggingFace Inference API 번역 클라이언트
 * 환경변수: HF_API_TOKEN
 * 모델: TRANSLATION_MODEL 또는 Qwen/Qwen2.5-7B-Instruct via featherless-ai provider
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEcommerceGlossaryPrompt } from './lookup';

const HF_ROUTER_URL = 'https://router.huggingface.co/featherless-ai/v1/chat/completions';
const DEFAULT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';
const DEFAULT_DAILY_LIMIT = 200;
const DEFAULT_PREWARM_DAILY_LIMIT = 1000;

type TranslationDirection = 'zh2ko' | 'ko2zh';
type TranslationSource = 'live' | 'prewarm';

/**
 * 번역 호출의 출처를 async 컨텍스트로 전파한다.
 * - live: 사용자 요청 경로
 * - prewarm: 예열(프리웜) 작업 경로 → 별도 일일 한도를 사용해 사용자 예산과 분리
 * 컨텍스트가 없으면 기본 'live'.
 */
const sourceStore = new AsyncLocalStorage<TranslationSource>();

export function runWithTranslationSource<T>(
  source: TranslationSource,
  fn: () => Promise<T>
): Promise<T> {
  return sourceStore.run(source, fn);
}

function currentSource(): TranslationSource {
  return sourceStore.getStore() ?? 'live';
}

const memoryUsage: Record<TranslationSource, { date: string; calls: number; textItems: number }> = {
  live: { date: '', calls: 0, textItems: 0 },
  prewarm: { date: '', calls: 0, textItems: 0 },
};

function getModel(): string {
  return process.env.TRANSLATION_MODEL || DEFAULT_MODEL;
}

function getDailyLimit(source: TranslationSource): number {
  const raw = source === 'prewarm'
    ? process.env.TRANSLATION_PREWARM_DAILY_LIMIT
    : process.env.TRANSLATION_DAILY_LIMIT;
  const fallback = source === 'prewarm' ? DEFAULT_PREWARM_DAILY_LIMIT : DEFAULT_DAILY_LIMIT;
  if (raw == null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return -1;
  return Math.floor(parsed);
}

function getKstDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function reserveTranslationBudget(
  direction: TranslationDirection,
  model: string,
  textItems: number,
  source: TranslationSource
): Promise<boolean> {
  const dailyLimit = getDailyLimit(source);
  if (dailyLimit === 0) return false;
  if (dailyLimit < 0) return true;

  const today = getKstDate();
  const mem = memoryUsage[source];
  if (mem.date !== today) {
    mem.date = today;
    mem.calls = 0;
    mem.textItems = 0;
  }
  if (mem.calls >= dailyLimit) return false;

  mem.calls += 1;
  mem.textItems += textItems;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('translation_api_usage_daily')
      .select('api_calls,text_items')
      .eq('usage_date', today)
      .eq('direction', direction)
      .eq('model', model)
      .eq('source', source)
      .maybeSingle();

    const currentCalls = data?.api_calls ?? 0;
    const currentItems = data?.text_items ?? 0;
    if (currentCalls >= dailyLimit) return false;

    await supabase
      .from('translation_api_usage_daily')
      .upsert(
        {
          usage_date: today,
          direction,
          model,
          source,
          api_calls: currentCalls + 1,
          text_items: currentItems + textItems,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'usage_date,direction,model,source' }
      );
  } catch {
    // 테이블 미적용/일시 오류 시에도 프로세스 메모리 카운터로 최소 방어
  }

  return true;
}

const ZH_TO_KO_SYSTEM_PROMPT = `You are a Korean e-commerce product title translator for 1688/Alibaba sourcing.
Translate Simplified Chinese product titles/options into natural Korean product-listing text.
Rules:
- Reply only with the Korean translation.
- Keep brand names, model numbers, sizes, quantities, and material codes unchanged.
- Prefer concise Korean shopping terms over literal sentence translation.
- Do not add claims that are not in the source.
- Normalize common 1688 marketing terms using this glossary: ${getEcommerceGlossaryPrompt()}`;

const KO_TO_ZH_SYSTEM_PROMPT = `Translate Korean shopping search keywords into concise Simplified Chinese keywords for 1688 product search.
Reply only with the Chinese keywords, no explanation.`;

async function hfCall(
  systemPrompt: string,
  userContent: string,
  maxTokens = 200,
  options: { direction: TranslationDirection; textItems?: number }
): Promise<string | null> {
  const token = process.env.HF_API_TOKEN;
  if (!token) return null;

  const model = getModel();
  const source = currentSource();
  const allowed = await reserveTranslationBudget(options.direction, model, options.textItems || 1, source);
  if (!allowed) return null;

  try {
    const res = await fetch(HF_ROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
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
    ZH_TO_KO_SYSTEM_PROMPT,
    text,
    200,
    { direction: 'zh2ko', textItems: 1 }
  );
  return result ?? text;
}

/**
 * 여러 중국어 텍스트를 단일 API 호출로 배치 번역
 */
export async function translateZhToKoBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) {
    return [await translateZhToKo(texts[0])];
  }

  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const maxTokens = texts.length * 60 + 100;

  const result = await hfCall(
    `${ZH_TO_KO_SYSTEM_PROMPT}
For this batch, output ONLY the numbered translations in the same format, one per line. Example:
1. 한국어번역
2. 한국어번역`,
    numbered,
    maxTokens,
    { direction: 'zh2ko', textItems: texts.length }
  );

  if (!result) return texts;

  const lines = result.split('\n');
  const parsed: string[] = [...texts];

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
    KO_TO_ZH_SYSTEM_PROMPT,
    text,
    80,
    { direction: 'ko2zh', textItems: 1 }
  );
  return result ?? text;
}
