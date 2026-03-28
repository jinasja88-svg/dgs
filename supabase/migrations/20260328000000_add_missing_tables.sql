-- ============================================================
-- 딸깍소싱 DB 완성 마이그레이션
-- 2026-03-28
-- ============================================================

-- ============================
-- 1. api_call_logs
--    (기존 수동 생성 → 공식 마이그레이션)
-- ============================
CREATE TABLE IF NOT EXISTS api_call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,  -- 'search' | 'image-search' | 'product'
  duration_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;

-- 서비스 롤만 읽기/쓰기 가능 (deny-all → admin client만 접근)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_call_logs' AND policyname = 'service role only'
  ) THEN
    CREATE POLICY "service role only" ON api_call_logs USING (false);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_api_call_logs_endpoint ON api_call_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created ON api_call_logs(created_at DESC);


-- ============================
-- 2. profiles.role 컬럼 추가
--    (유저 역할 구분: user / admin)
-- ============================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 신규 유저 생성 트리거 업데이트 (role 포함)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================
-- 3. sourcing_wishlist_items
--    (1688 찜 목록 DB 저장)
--    기존 wishlist_items는 일반 products(UUID FK)용이라 별도 테이블 필요
-- ============================
CREATE TABLE IF NOT EXISTS sourcing_wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,    -- 1688 offer ID (숫자 문자열)
  title TEXT NOT NULL,
  title_zh TEXT,
  image TEXT,
  price_krw INTEGER,
  price_cny NUMERIC,
  seller_name TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE sourcing_wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sourcing wishlist"
  ON sourcing_wishlist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sourcing_wishlist_user
  ON sourcing_wishlist_items(user_id, added_at DESC);


-- ============================
-- 4. sourcing_orders 결제 필드 추가
--    (Toss Payments 연동 준비)
-- ============================
ALTER TABLE sourcing_orders
  ADD COLUMN IF NOT EXISTS payment_key TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;


-- ============================
-- 5. search_history
--    (최근 검색어 DB 저장, localStorage 대체)
-- ============================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own search history"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user
  ON search_history(user_id, searched_at DESC);
