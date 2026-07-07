// ============================================================
// coupang_data.js → Supabase coupang_products 임포트 스크립트
//
// 스탠드얼론 "딸깍쇼핑 - 쿠팡 소싱 분석기"의 coupang_data.js(압축키 형식)를
// dgs Supabase `coupang_products` 테이블로 업서트한다.
//
// 사용법:
//   node scripts/import-coupang-data.mjs ["소스폴더경로"]
//   (기본 소스폴더: D:\Google Drive\코딩_VSCODE\dist\coupang_honey list)
//
// 필요 환경변수 (.env.local 또는 .env 또는 셸 env):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// 사전조건: coupang_products.coupang_url 에 UNIQUE 인덱스 존재
//   (supabase/migrations/20260706000000_coupang_url_unique.sql)
// ============================================================

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SRC = 'D:\\Google Drive\\코딩_VSCODE\\dist\\coupang_honey list';
const BATCH = 500;

// ---- .env 로더 (dotenv 미사용) -----------------------------
function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    const txt = readFileSync(f, 'utf-8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

// ---- coupang_data.js 로드 ("const DATA=...;" 형식) ---------
function loadDataFromJs(srcDir) {
  const p = join(srcDir, 'coupang_data.js');
  const txt = readFileSync(p, 'utf-8');
  const prefix = 'const DATA=';
  const start = txt.indexOf(prefix);
  if (start === -1) throw new Error(`coupang_data.js 형식이 예상과 다릅니다 (const DATA= 없음): ${p}`);
  let body = txt.slice(start + prefix.length).trim();
  if (body.endsWith(';')) body = body.slice(0, -1);
  return JSON.parse(body);
}

// ---- filtered_brands_list.txt → 브랜드명 집합 --------------
// 예: "코멧 (369건), 탐사 (206건), 쿠팡 (5건)"
function loadBrandSet(srcDir) {
  const p = join(srcDir, 'filtered_brands_list.txt');
  const set = new Set();
  if (!existsSync(p)) {
    console.warn(`[WARN] ${p} 없음 → is_excluded_brand 전부 false 처리`);
    return set;
  }
  const txt = readFileSync(p, 'utf-8');
  const re = /([가-힣A-Za-z0-9][가-힣A-Za-z0-9&.\- ]*?)\s*\(\s*[\d,]+\s*건\s*\)/g;
  let m;
  while ((m = re.exec(txt)) !== null) {
    const name = m[1].trim();
    if (name) set.add(name.toLowerCase());
  }
  return set;
}

function isExcludedBrand(d, brandSet) {
  if (brandSet.size === 0) return false;
  const candidates = [];
  if (d.sk1) candidates.push(String(d.sk1).trim().toLowerCase());
  if (d.n) candidates.push(String(d.n).trim().split(/\s+/)[0].toLowerCase());
  return candidates.some((c) => c && brandSet.has(c));
}

// ---- DATA 아이템 → coupang_products 행 ---------------------
function mapRow(d, brandSet, crawledAt) {
  const cat = d.c || '';
  const parts = cat.split('>').map((s) => s.trim());
  return {
    product_name: d.n || '',
    item_name: d.i || null,
    category: cat,
    category_l1: parts[0] || '',
    category_l2: parts[1] || null,
    price: Math.round(Number(d.p) || 0),
    rating: null,
    review_count: Math.round(Number(d.rv) || 0),
    view_count: Math.round(Number(d.v) || 0),
    image_url: d.img || null,
    coupang_url: d.u,
    main_keyword: d.mk || null,
    sub_keyword1: d.sk1 || null,
    sub_keyword2: d.sk2 || null,
    buy_count: d.bc == null ? null : Math.round(Number(d.bc)),
    conversion_rate: d.cr == null ? null : Number(d.cr),
    conversion_source: d.crs || null,
    estimated_monthly_sales: d.ebc == null ? null : Math.round(Number(d.ebc)),
    estimated_monthly_revenue: d.erev == null ? null : Math.round(Number(d.erev)),
    is_excluded_brand: isExcludedBrand(d, brandSet),
    crawled_at: crawledAt,
  };
}

async function main() {
  const srcDir = process.argv[2] || DEFAULT_SRC;
  console.log(`[INFO] 소스 폴더: ${srcDir}`);

  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[ERROR] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
    console.error('        dgs 루트에 .env.local 을 두거나 셸에서 export 후 다시 실행하세요.');
    process.exit(1);
  }

  const data = loadDataFromJs(srcDir);
  const brandSet = loadBrandSet(srcDir);
  const crawledAt = new Date().toISOString();
  console.log(`[INFO] DATA ${data.length}개 로드, 브랜드 필터 ${brandSet.size}개`);

  // URL 없는 행 스킵 + URL 기준 중복 제거(뒤엣것 우선)
  const byUrl = new Map();
  let skipped = 0;
  for (const d of data) {
    if (!d.u) { skipped++; continue; }
    byUrl.set(d.u, mapRow(d, brandSet, crawledAt));
  }
  const rows = [...byUrl.values()];
  console.log(`[INFO] 업서트 대상 ${rows.length}개 (URL 없음 스킵 ${skipped}, 중복 병합 ${data.length - skipped - rows.length})`);
  const excludedCount = rows.filter((r) => r.is_excluded_brand).length;
  console.log(`[INFO] 대기업 제외 표시 ${excludedCount}개`);

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('coupang_products')
      .upsert(batch, { onConflict: 'coupang_url', ignoreDuplicates: false });
    if (error) {
      console.error(`[ERROR] 배치 ${i}~${i + batch.length} 실패:`, error.message);
      process.exit(1);
    }
    done += batch.length;
    console.log(`  [UPSERT] ${done}/${rows.length}`);
  }

  console.log(`[DONE] ${done}개 업서트 완료`);
}

main().catch((e) => {
  console.error('[FATAL]', e);
  process.exit(1);
});
