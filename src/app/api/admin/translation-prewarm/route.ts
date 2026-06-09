/**
 * 번역 캐시 프리웜(예열) 엔드포인트.
 *
 * 인기 검색어 + 기본 검색 + 카테고리 첫 페이지를 미리 검색·번역하여
 * 영구 번역 캐시(translation_cache)와 검색 캐시(api_cache)를 채운다.
 * 모든 번역 호출은 'prewarm' 소스로 실행되어 사용자(live) 일일 한도와
 * 분리된 TRANSLATION_PREWARM_DAILY_LIMIT 예산을 사용한다.
 *
 * 인증:
 *  - 크론: `Authorization: Bearer <CRON_SECRET>` 또는 `x-cron-secret: <CRON_SECRET>`
 *  - 수동: 로그인한 관리자(profiles.role = 'admin')
 *
 * 호출:
 *  - GET  /api/admin/translation-prewarm?top=30&days=30   (크론/관리자)
 *  - POST /api/admin/translation-prewarm  { topKeywords, days, ... }  (관리자/크론)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/auth';
import { runWithTranslationSource } from '@/lib/translation';
import { runKeywordSearch, CATEGORY_KEYWORD_MAP, type SortOption } from '@/lib/sourcing/search';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface PrewarmOptions {
  days: number;          // search_history 조회 기간(일)
  topKeywords: number;   // 인기 검색어 상위 N개
  perPage: number;       // 페이지 크기(shop 기본값 10에 맞춤)
  sort: SortOption;      // 정렬(shop 기본값 'rating'에 맞춤)
  concurrency: number;   // 동시 처리 수
  includeDefault: boolean;
  includeCategories: boolean;
}

const DEFAULTS: PrewarmOptions = {
  days: 30,
  topKeywords: 30,
  perPage: 10,
  sort: 'rating',
  concurrency: 4,
  includeDefault: true,
  includeCategories: true,
};

// 단일 요청이 maxDuration을 넘기지 않도록 soft 시간 한도(처리 중단 후 부분 결과 반환)
const SOFT_LIMIT_MS = 50_000;

function hasCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') ?? '';
  const headerSecret = request.headers.get('x-cron-secret') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return bearer === secret || headerSecret === secret;
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (hasCronSecret(request)) return true;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && (await isAdmin(user.id))) return true;
  } catch {
    // 세션 조회 실패 → 비인가
  }
  return false;
}

async function getTopKeywords(days: number, topN: number): Promise<string[]> {
  if (topN <= 0) return [];
  const admin = createAdminClient();
  const sinceIso = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await admin
    .from('search_history')
    .select('keyword')
    .gte('searched_at', sinceIso)
    .limit(5000);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const k = ((row as { keyword?: string }).keyword ?? '').trim();
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k);
}

interface Target {
  label: string;
  keyword?: string;
  category?: string;
}

async function runPrewarm(opts: PrewarmOptions) {
  const targets: Target[] = [];
  if (opts.includeDefault) targets.push({ label: '(default)' });
  if (opts.includeCategories) {
    for (const cat of Object.keys(CATEGORY_KEYWORD_MAP)) {
      targets.push({ label: `category:${cat}`, category: cat });
    }
  }
  const keywords = await getTopKeywords(opts.days, opts.topKeywords);
  for (const kw of keywords) targets.push({ label: `keyword:${kw}`, keyword: kw });

  const warmed: { label: string; count: number }[] = [];
  const failed: { label: string; error: string }[] = [];
  const startedAt = Date.now();
  let stoppedForTime = false;

  await runWithTranslationSource('prewarm', async () => {
    let idx = 0;
    const worker = async () => {
      while (idx < targets.length) {
        if (Date.now() - startedAt > SOFT_LIMIT_MS) {
          stoppedForTime = true;
          return;
        }
        const t = targets[idx++];
        try {
          const res = await runKeywordSearch({
            keyword: t.keyword,
            category: t.category,
            page: 1,
            perPage: opts.perPage,
            sort: opts.sort,
          });
          warmed.push({ label: t.label, count: res.data.length });
        } catch (e) {
          failed.push({ label: t.label, error: e instanceof Error ? e.message : String(e) });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, opts.concurrency) }, worker));
  });

  const processed = warmed.length + failed.length;
  return {
    ok: true,
    source: 'prewarm' as const,
    targets: targets.length,
    processed,
    remaining: targets.length - processed,
    stoppedForTime,
    keywordsConsidered: keywords.length,
    warmed,
    failed,
    elapsedMs: Date.now() - startedAt,
  };
}

function parseNum(v: string | null | undefined, fallback: number): number {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(v: string | null | undefined, fallback: boolean): boolean {
  if (v == null || v === '') return fallback;
  return v === '1' || v.toLowerCase() === 'true';
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  const opts: PrewarmOptions = {
    days: parseNum(sp.get('days'), DEFAULTS.days),
    topKeywords: parseNum(sp.get('top'), DEFAULTS.topKeywords),
    perPage: Math.min(parseNum(sp.get('per_page'), DEFAULTS.perPage), 20),
    sort: (sp.get('sort') as SortOption) || DEFAULTS.sort,
    concurrency: Math.min(parseNum(sp.get('concurrency'), DEFAULTS.concurrency), 8),
    includeDefault: parseBool(sp.get('default'), DEFAULTS.includeDefault),
    includeCategories: parseBool(sp.get('categories'), DEFAULTS.includeCategories),
  };
  const result = await runPrewarm(opts);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let body: Partial<PrewarmOptions> = {};
  try {
    body = (await request.json()) as Partial<PrewarmOptions>;
  } catch {
    // 본문 없음 → 기본값
  }
  const opts: PrewarmOptions = {
    days: typeof body.days === 'number' ? body.days : DEFAULTS.days,
    topKeywords: typeof body.topKeywords === 'number' ? body.topKeywords : DEFAULTS.topKeywords,
    perPage: Math.min(typeof body.perPage === 'number' ? body.perPage : DEFAULTS.perPage, 20),
    sort: body.sort ?? DEFAULTS.sort,
    concurrency: Math.min(typeof body.concurrency === 'number' ? body.concurrency : DEFAULTS.concurrency, 8),
    includeDefault: typeof body.includeDefault === 'boolean' ? body.includeDefault : DEFAULTS.includeDefault,
    includeCategories: typeof body.includeCategories === 'boolean' ? body.includeCategories : DEFAULTS.includeCategories,
  };
  const result = await runPrewarm(opts);
  return NextResponse.json(result);
}
