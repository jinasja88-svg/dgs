-- ============================================================
-- Translation pre-warm support
--  1) translation_cache: 코드가 참조하는 영구 번역 캐시(TTL 없음)를
--     fresh 환경에서도 보장 (이미 존재하면 무시).
--  2) translation_api_usage_daily: `source` 차원을 추가해 프리웜(prewarm)
--     예산을 사용자 트래픽(live) 예산과 분리해 집계/제한한다.
-- ============================================================

-- 1) translation_cache (영구 번역 캐시; onConflict 'direction,original' 사용)
CREATE TABLE IF NOT EXISTS translation_cache (
  direction TEXT NOT NULL CHECK (direction IN ('zh2ko', 'ko2zh')),
  original TEXT NOT NULL,
  translated TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (direction, original)
);

ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny all" ON translation_cache;
CREATE POLICY "deny all" ON translation_cache
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- 2) usage 테이블에 source 차원 추가 + PK 재구성
ALTER TABLE translation_api_usage_daily
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'live';

ALTER TABLE translation_api_usage_daily
  DROP CONSTRAINT IF EXISTS translation_api_usage_daily_source_check;
ALTER TABLE translation_api_usage_daily
  ADD CONSTRAINT translation_api_usage_daily_source_check
  CHECK (source IN ('live', 'prewarm'));

ALTER TABLE translation_api_usage_daily
  DROP CONSTRAINT IF EXISTS translation_api_usage_daily_pkey;
ALTER TABLE translation_api_usage_daily
  ADD PRIMARY KEY (usage_date, direction, model, source);
