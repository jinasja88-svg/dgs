-- CS 문의 테이블
CREATE TABLE IF NOT EXISTS cs_inquiries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  order_id         uuid REFERENCES sourcing_orders(id) ON DELETE SET NULL,
  category         text NOT NULL CHECK (category IN ('order','shipping','return','product','payment','other')),
  title            text NOT NULL,
  content          text NOT NULL,
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','answered','closed')),
  admin_reply      text,
  admin_replied_at timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE cs_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_inquiries_user_own" ON cs_inquiries
  FOR ALL USING (user_id = auth.uid());

-- CS 반품/교환 요청 테이블
CREATE TABLE IF NOT EXISTS cs_returns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  order_id      uuid NOT NULL REFERENCES sourcing_orders(id) ON DELETE RESTRICT,
  return_type   text NOT NULL CHECK (return_type IN ('return','exchange')),
  reason        text NOT NULL CHECK (reason IN ('defective','wrong_item','not_as_described','changed_mind','other')),
  detail        text NOT NULL,
  status        text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','reviewing','approved','rejected','completed')),
  refund_amount integer,
  admin_note    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE cs_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_returns_user_own" ON cs_returns
  FOR ALL USING (user_id = auth.uid());

-- FAQ 테이블 (기존 하드코딩 대체)
CREATE TABLE IF NOT EXISTS cs_faqs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category     text NOT NULL DEFAULT 'general',
  question     text NOT NULL,
  answer       text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE cs_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_faqs_public_read" ON cs_faqs
  FOR SELECT USING (is_published = true);

-- 초기 FAQ 데이터 시드
INSERT INTO cs_faqs (category, question, answer, sort_order) VALUES
  ('order', '주문은 어떻게 하나요?', '상품 검색 후 장바구니에 담고 결제를 진행하시면 됩니다. 결제 완료 후 소싱 주문 페이지에서 진행 상황을 확인하실 수 있습니다.', 1),
  ('order', '주문 취소는 언제까지 가능한가요?', '주문 접수(pending) 상태에서만 취소가 가능합니다. 결제 완료 이후에는 취소가 불가하오니 주문 전 신중하게 확인해 주세요.', 2),
  ('shipping', '배송은 얼마나 걸리나요?', '중국에서 한국까지 통상 7~15 영업일이 소요됩니다. 상품 종류 및 통관 상황에 따라 달라질 수 있습니다.', 3),
  ('shipping', '배송 조회는 어떻게 하나요?', '마이페이지 > 소싱 주문 > 해당 주문 상세 페이지에서 운송장 번호와 배송 현황을 확인하실 수 있습니다.', 4),
  ('return', '반품/교환 신청은 어떻게 하나요?', '배송 완료 후 마이페이지 > 반품/교환 메뉴에서 신청하실 수 있습니다. 상품 수령 후 7일 이내에 신청해 주세요.', 5),
  ('return', '불량품을 받았어요. 어떻게 하나요?', '마이페이지 > 반품/교환 신청 시 사유를 "불량/파손"으로 선택하시고 사진을 첨부해 주시면 신속하게 처리해 드립니다.', 6),
  ('payment', '어떤 결제 수단을 사용할 수 있나요?', '신용카드, 체크카드, 계좌이체, 가상계좌를 지원합니다. 토스페이먼츠를 통해 안전하게 결제됩니다.', 7),
  ('general', '서비스 수수료는 얼마인가요?', '소싱 서비스 수수료는 상품 금액의 12%입니다. 이 수수료에는 현지 구매 대행, 품질 확인, 국내 배송 등의 서비스가 포함됩니다.', 8);
