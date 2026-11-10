/**
 * Claude API 번역 클라이언트
 * 환경변수: CLAUDE123 (우선), CLAUDE321 (예비), ANTHROPIC_API_KEY (선택)
 * 모델: TRANSLATION_MODEL (claude-* 일 때만) 또는 claude-sonnet-5-5
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEcommerceGlossaryPrompt } from './lookup';

const DEFAULT_MODEL = 'claude-sonnet-5-5';
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
  // 이전 Groq/HF 모델명이 환경변수에 남아 있어도 무시하도록 claude-* 만 허용
  const configured = process.env.TRANSLATION_MODEL?.trim();
  return configured?.startsWith('claude-') ? configured : DEFAULT_MODEL;
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

type KeyState = { key: string; label: string; disabledUntil: number };

let keyStates: KeyState[] | null = null;
const clients = new Map<string, Anthropic>();

/**
 * 사용 순서: CLAUDE123 → CLAUDE321 → ANTHROPIC_API_KEY.
 * 앞 키가 한도/크레딧 소진으로 막히면 쿨다운 동안 다음 키로 넘어가고, 쿨다운이 끝나면 다시 앞 키부터 사용한다.
 */
function getKeyStates(): KeyState[] {
  if (keyStates) return keyStates;
  const candidates: Array<[string, string | undefined]> = [
    ['CLAUDE123', process.env.CLAUDE123],
    ['CLAUDE321', process.env.CLAUDE321],
    ['ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY],
  ];
  const seen = new Set<string>();
  keyStates = [];
  for (const [label, key] of candidates) {
    const trimmed = key?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    keyStates.push({ key: trimmed, label, disabledUntil: 0 });
  }
  return keyStates;
}

function getClient(key: string): Anthropic {
  let client = clients.get(key);
  if (!client) {
    // 429는 SDK 내부 재시도 대신 즉시 다음 키로 넘기기 위해 재시도 0
    client = new Anthropic({ apiKey: key, maxRetries: 0, timeout: 30_000 });
    clients.set(key, client);
  }
  return client;
}

const RATE_LIMIT_COOLDOWN_MS = 60_000;
const EXHAUSTED_COOLDOWN_MS = 60 * 60_000;

/** 키를 바꿔서 재시도할 가치가 있는 에러면 쿨다운(ms)을, 아니면 null을 반환 */
function keyCooldownFor(error: unknown): number | null {
  if (error instanceof Anthropic.RateLimitError) {
    const retryAfter = Number(error.headers?.get('retry-after'));
    return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_COOLDOWN_MS;
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return EXHAUSTED_COOLDOWN_MS;
  }
  if (error instanceof Anthropic.APIError) {
    if (error.status === 402 || error.type === 'billing_error') return EXHAUSTED_COOLDOWN_MS;
    // 크레딧 부족은 400 invalid_request_error로 오는 경우가 있어 메시지로 보조 판별
    if (error.status === 400 && /credit balance/i.test(error.message)) return EXHAUSTED_COOLDOWN_MS;
  }
  return null;
}

async function claudeCall(
  systemPrompt: string,
  userContent: string,
  maxTokens = 200,
  options: { direction: TranslationDirection; textItems?: number }
): Promise<string | null> {
  const states = getKeyStates();
  if (states.length === 0) return null;

  const model = getModel();
  const source = currentSource();
  const allowed = await reserveTranslationBudget(options.direction, model, options.textItems || 1, source);
  if (!allowed) return null;

  const now = Date.now();
  const available = states.filter((s) => s.disabledUntil <= now);
  if (available.length === 0) return null;

  for (const state of available) {
    try {
      const response = await getClient(state.key).beta.messages.create({
        model,
        // 적응형 thinking을 쓰므로 thinking 토큰 여유분 포함
        max_tokens: maxTokens + 1024,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      });

      if (response.stop_reason === 'refusal') return null;
      const text = response.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim();
      return text || null;
    } catch (error) {
      const cooldown = keyCooldownFor(error);
      if (cooldown === null) {
        console.error('[translation] Claude call failed:', error instanceof Error ? error.message : error);
        return null;
      }
      state.disabledUntil = Date.now() + cooldown;
      console.warn(`[translation] ${state.label} unavailable, switching key (cooldown ${Math.round(cooldown / 1000)}s)`);
    }
  }
  return null;
}

export async function translateZhToKo(text: string): Promise<string> {
  if (!text.trim()) return text;
  const result = await claudeCall(
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
  const maxTokens = texts.length * 80 + 100;

  const result = await claudeCall(
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
  const result = await claudeCall(
    KO_TO_ZH_SYSTEM_PROMPT,
    text,
    80,
    { direction: 'ko2zh', textItems: 1 }
  );
  return result ?? text;
}
