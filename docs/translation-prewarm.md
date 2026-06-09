# 번역 품질 + 프리웜(예열) 구조

1688 상품명을 셀로코 같은 사이트 수준으로 자연스럽게 보여주기 위한 번역 파이프라인과,
인기 검색을 미리 번역해 두는 **프리웜(pre-warm)** 메커니즘을 정리한다.

## 1. 번역 파이프라인 (품질 레이어)

`src/lib/translation/` — 호출 순서:

1. **정적 용어집 (`lookup.ts`)** — 사람이 등록한 결정론적 사전. API 호출 0, 일관성 100%.
   - `ZH_TO_KO` (444+ 항목): SKU 속성/색상/사이즈/소재/카테고리/상품군/마케팅·시즌 용어를 직접 치환.
     완전일치 → 구분자 분할(`黑色/XL`) → 부분 치환(전체가 한국어로 떨어질 때만 채택, 아니면 LLM에 위임)
   - `PROMPT_GLOSSARY`: 고빈도 용어를 **LLM 시스템 프롬프트에 주입**해 긴 상품명도 일관 용어로 번역.
2. **Supabase 영구 캐시 (`cache.ts`, `translation_cache`)** — TTL 없음. 한 번 번역하면 영구 재사용.
3. **HF 기계번역 (`translator.ts`)** — `TRANSLATION_MODEL`(기본 `Qwen/Qwen2.5-7B-Instruct`), featherless-ai 라우터.
   `temperature 0.1`, 도메인 인식 프롬프트 + 용어집 주입.

> 품질을 더 올리려면: ① 용어집(`lookup.ts`) 항목 추가가 가성비 최고, ② `TRANSLATION_MODEL`을
> `Qwen/Qwen2.5-72B-Instruct` 로 상향. 중→한 번역은 원문(중국어) 이해력이 중요해 Qwen 계열이 유리하다.

## 2. 일일 예산 (소스 분리)

번역 API 호출은 `translation_api_usage_daily` 테이블 + 프로세스 메모리로 일일 한도를 건다.
호출 출처(`source`)를 **`AsyncLocalStorage`**(`runWithTranslationSource`)로 전파해 분리 집계한다.

| source | 한도 env | 기본값 | 용도 |
|--------|---------|-------|------|
| `live` | `TRANSLATION_DAILY_LIMIT` | 200 | 사용자 요청 경로 |
| `prewarm` | `TRANSLATION_PREWARM_DAILY_LIMIT` | 1000 | 예열 작업 경로 |

`0` = 비활성화, `-1` = 무제한. 두 예산은 서로 영향을 주지 않는다.

## 3. 프리웜 (예열)

검색은 한국어 키워드를 TMAPI에 그대로 전달하고 **결과 상품명(중→한)** 을 번역한다. 따라서 예열 가치는
"인기 상품명의 영구 번역을 미리 쌓아두는 것"에 있다 — `translation_cache`는 TTL이 없어 한 번 쌓이면 계속 재사용된다.

`src/lib/sourcing/search.ts`의 `runKeywordSearch()`를 라이브 검색 라우트와 프리웜이 **공유**하므로,
프리웜은 라이브와 동일한 캐시 키/번역 결과를 그대로 예열한다(드리프트 없음).

### 예열 대상
- 기본 검색(키워드 없음, `热销产品`) — 모든 방문자의 첫 화면
- 카테고리 10종 첫 페이지
- `search_history` 기준 인기 검색어 상위 N개

### 엔드포인트
`/api/admin/translation-prewarm`

- 인증: 크론 `Authorization: Bearer <CRON_SECRET>` (또는 `x-cron-secret`) **또는** 로그인 관리자
- `GET ?top=30&days=30&per_page=10&sort=rating&concurrency=4&default=true&categories=true`
- `POST { topKeywords, days, perPage, sort, concurrency, includeDefault, includeCategories }`
- 응답: `{ ok, targets, processed, remaining, stoppedForTime, warmed[], failed[], elapsedMs }`
- 단일 실행은 `SOFT_LIMIT_MS`(50s)에서 멈추고 부분 결과를 반환한다. 남으면 다음 실행이 이어서 채운다.

### 수동 실행 예시
```bash
curl -X POST https://<host>/api/admin/translation-prewarm \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"topKeywords": 50, "concurrency": 4}'
```

### 자동 스케줄
`vercel.json`에 **주 2회**(월·목 18:00 UTC = 03:00 KST) 크론이 등록돼 있다 — 카테고리 위주 경량 설정.
Vercel은 `CRON_SECRET`이 설정돼 있으면 GET 요청에 `Authorization: Bearer <CRON_SECRET>`를 자동 첨부한다.

```json
{ "crons": [ { "path": "/api/admin/translation-prewarm?top=5", "schedule": "0 18 * * 1,4" } ] }
```

Vercel이 아니면(예: 자체 서버) OS 크론/Supabase pg_cron 등으로 위 curl을 주기 실행하면 된다.
> ⚠️ TMAPI 호출량: 1회 = 기본 1 + 카테고리 10 + 인기검색어 N건의 검색. 위 경량 설정(주2회·top=5)은 1회 ≈ **16건 → 월 ~140건**.
> TMAPI 무제한 플랜이면 추가비용 없음, 쿼터제면 그만큼만 소비(초과 시에만 과금). `top`/`categories`/스케줄로 조절.
> 수동 실행(관리자/POST)은 기본값이 더 thorough(top=30)하니 필요 시 파라미터로 조절. Vercel `maxDuration=60`은 Pro 기준.

## 4. 필요 환경변수
```
HF_API_TOKEN                     # 번역용 HF Inference Providers 토큰
TRANSLATION_MODEL                # 선택, 기본 Qwen/Qwen2.5-7B-Instruct
TRANSLATION_DAILY_LIMIT          # 선택, live 기본 200
TRANSLATION_PREWARM_DAILY_LIMIT  # 선택, prewarm 기본 1000
CRON_SECRET                      # 프리웜 크론/외부 트리거 인증 시크릿
```

## 5. 적용 절차
```bash
supabase db push      # 20260609010000_translation_prewarm.sql (source 컬럼 + translation_cache)
# 이후 타입 재생성 (createAdminClient는 untyped라 빌드엔 영향 없지만 정합성 위해 권장)
supabase gen types typescript --project-id bvntczzdjirqtpudfpae 2>/dev/null > src/types/supabase.ts
```
