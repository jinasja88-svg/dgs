-- ============================================================
-- Translation API daily usage guard
-- Tracks paid/free-quota translation calls made through HF providers.
-- ============================================================

CREATE TABLE IF NOT EXISTS translation_api_usage_daily (
  usage_date DATE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('zh2ko', 'ko2zh')),
  model TEXT NOT NULL,
  api_calls INTEGER NOT NULL DEFAULT 0,
  text_items INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usage_date, direction, model)
);

ALTER TABLE translation_api_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny all" ON translation_api_usage_daily;
CREATE POLICY "deny all" ON translation_api_usage_daily
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_translation_usage_daily_date
  ON translation_api_usage_daily (usage_date DESC);
