-- B2B 체크아웃: 사업자정보 / 약관동의 컬럼 추가 + 초기 공지 시드
-- (CLAUDE.md 규약: supabase db push 로 적용 후 `supabase gen types` 재생성)

-- 1. sourcing_orders 에 사업자정보 / 약관동의 저장
alter table public.sourcing_orders
  add column if not exists business_info jsonb,
  add column if not exists terms_agreed  jsonb;

comment on column public.sourcing_orders.business_info is '주문자 사업자정보(상호/사업자등록번호/대표자/업태/종목/사업장주소)';
comment on column public.sourcing_orders.terms_agreed  is '약관 동의 스냅샷(이용약관/개인정보/쿠팡 로켓그로스 안내, 동의 시각)';

-- 2. 초기 공지 시드 (중복 방지: 동일 title 없을 때만 삽입)
insert into public.notices (title, content, is_pinned)
select v.title, v.content, v.is_pinned
from (values
  (
    '딸깍소싱 서비스 이용 안내',
    E'딸깍소싱은 1688(알리바바) 도매 마켓 상품을 한국어로 검색하고, 사업자(쿠팡 셀러 등)를 위해 매입·통관·국내배송까지 대행하는 B2B 소싱 플랫폼입니다.\n\n· 키워드/이미지/URL 로 상품을 검색하고 예상 수입 단가를 KRW로 확인하세요.\n· 결제 시 사업자 정보 입력이 필요합니다(세금계산서 발행 가능).\n· 처음이시라면 [사용자 매뉴얼]을 먼저 확인해 주세요.',
    true
  ),
  (
    '수수료 및 비용 안내',
    E'상품 단가에는 환율과 수입 예상 비용이 반영되어 "수입시 예상 단가"로 표시됩니다.\n국내 배송비는 기본 3,000원(5kg 이하 표준 택배 기준)이며, 제주·도서산간 지역은 +3,000원이 부과됩니다.\n해외 국제운송비·통관비는 상품/물량에 따라 견적 단계에서 별도 안내됩니다.',
    false
  ),
  (
    '배송 및 통관 정책 안내',
    E'주문 확정 후 1688 매입 → 중국 현지 검수 → 국제 운송 → 통관 → 국내 택배 순으로 진행됩니다.\n진행 상황은 마이페이지 > 주문목록에서 단계별로 확인할 수 있습니다.\n통관 절차상 일정은 변동될 수 있으며, 지연 시 고객센터를 통해 안내드립니다.',
    false
  ),
  (
    '실시간 고객센터 오픈',
    E'우측 하단 채팅 버튼으로 실시간 1:1 상담이 가능합니다.\nCS 운영시간은 평일 10:00~18:00 이며, 운영시간 외 문의는 순차적으로 답변드립니다.',
    false
  )
) as v(title, content, is_pinned)
where not exists (
  select 1 from public.notices n where n.title = v.title
);
