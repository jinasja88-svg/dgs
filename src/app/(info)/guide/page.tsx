import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ShoppingCart, CreditCard, Ship, Wallet, Headphones, Percent, RotateCcw, Info } from 'lucide-react';
import { SHIPPING_FEE_TABLE, SHIPPING_POLICY_LABELS } from '@/lib/shipping';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: '이용안내 (해외 구매대행)',
  description: '딸깍소싱 해외 구매대행 이용안내 — 구매대행 수수료, 배송·통관 소요기간, 청약철회·환불 규정 안내',
};

const steps = [
  {
    id: 'search',
    icon: Search,
    title: '1. 상품 검색',
    body: [
      '상단 검색창에 상품명(한글), 1688 상품 URL, 또는 상품 ID를 입력해 검색합니다.',
      '이미지 검색을 사용하면 가지고 있는 상품 사진과 유사한 1688 상품을 찾을 수 있습니다.',
      '가격·평점·재구매율·배송 속도 등 필터로 신뢰할 수 있는 공장/판매자를 선별하세요.',
    ],
  },
  {
    id: 'order',
    icon: ShoppingCart,
    title: '2. 주문 담기',
    body: [
      '상품 상세에서 옵션(SKU)과 수량을 선택합니다. 최소 주문 수량(MOQ)을 확인하세요.',
      '표시 단가에는 상품가(실시간 환율 적용)와 구매대행 수수료가 반영되어 있습니다.',
      '장바구니에 담아 여러 상품을 한 번에 주문할 수 있습니다.',
    ],
  },
  {
    id: 'checkout',
    icon: CreditCard,
    title: '3. 결제',
    body: [
      '배송지 정보를 입력하고 결제를 진행합니다. 결제 금액에는 상품가 + 구매대행 수수료 + 국내배송비가 포함됩니다.',
      '이용약관·개인정보 처리방침에 동의 후 주문이 확정됩니다.',
      '관세·부가세는 통관 시 별도로 부과될 수 있습니다(물품가 미화 $150 초과 시).',
    ],
  },
  {
    id: 'shipping',
    icon: Ship,
    title: '4. 통관 · 배송',
    body: [
      '주문이 확정되면 1688에서 상품을 대신 구매하고 중국 현지 검수 후 국제 운송을 진행합니다.',
      '통관 완료 후 국내 택배로 입력하신 배송지로 발송됩니다.',
      '진행 상황은 마이페이지 > 주문목록에서 단계별로 확인할 수 있습니다.',
    ],
  },
  {
    id: 'settle',
    icon: Wallet,
    title: '5. 수령 · 사후 관리',
    body: [
      '배송 완료 후 주문 상세에서 리뷰를 남길 수 있습니다.',
      '교환·반품이 필요하면 마이페이지 > 문의/반품에서 접수해 주세요.',
      '실시간 상담이 필요하면 우측 하단 고객센터 채팅을 이용하세요.',
    ],
  },
];

// 구매대행 수수료 (이용약관 제5조와 동일)
const FEE_TABLE = [
  { range: '~ 50,000원', rate: '10%', note: '최소 수수료 3,000원' },
  { range: '50,001 ~ 200,000원', rate: '8%', note: '' },
  { range: '200,001 ~ 500,000원', rate: '7%', note: '' },
  { range: '500,001원 이상', rate: '5%', note: '' },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '이용안내' }]} />

      <h1 className="text-3xl font-bold text-text-primary mt-6 mb-2">이용안내</h1>
      <p className="text-text-tertiary mb-6">
        상품 검색부터 통관·배송·환불까지, 해외 구매대행 이용 전 과정을 안내합니다.
      </p>

      {/* 구매대행 서비스 고지 */}
      <div className="bg-primary-5 border border-primary/20 rounded-[var(--radius-lg)] p-5 mb-8">
        <div className="flex items-start gap-2.5">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary mb-1.5">해외 구매대행 서비스 안내</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              딸깍소싱(주식회사네이처발란스)은 이용자를 대신하여 중국 1688 플랫폼의 상품을 구매·결제·배송해 드리는{' '}
              <strong>해외 구매대행 서비스</strong>입니다. 회사는 상품을 직접 제조·판매하지 않으며,
              매매계약의 당사자는 이용자와 해외 판매자입니다. 자세한 내용은{' '}
              <Link href="/terms" className="text-primary underline">이용약관</Link> 및{' '}
              <Link href="/privacy" className="text-primary underline">개인정보 처리방침</Link>을 확인해 주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 목차 */}
      <nav className="bg-surface rounded-[var(--radius-lg)] p-5 mb-10">
        <p className="text-sm font-semibold text-text-secondary mb-3">목차</p>
        <ol className="grid sm:grid-cols-2 gap-y-1.5 gap-x-4">
          {steps.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-sm text-text-secondary hover:text-primary transition-colors">
                {s.title}
              </a>
            </li>
          ))}
          <li><a href="#fee" className="text-sm text-text-secondary hover:text-primary transition-colors">구매대행 수수료 안내</a></li>
          <li><a href="#timeline" className="text-sm text-text-secondary hover:text-primary transition-colors">배송·통관 소요기간</a></li>
          <li><a href="#shipping-fee" className="text-sm text-text-secondary hover:text-primary transition-colors">국내 배송비 안내</a></li>
          <li><a href="#refund" className="text-sm text-text-secondary hover:text-primary transition-colors">청약철회·교환·환불 규정</a></li>
        </ol>
      </nav>

      {/* 단계 섹션 */}
      <div className="space-y-10">
        {steps.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-5 rounded-xl flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">{s.title}</h2>
            </div>
            <ul className="space-y-2 pl-1">
              {s.body.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-secondary leading-relaxed">
                  <span className="text-primary mt-0.5 flex-shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* 구매대행 수수료 */}
        <section id="fee" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-5 rounded-xl flex items-center justify-center flex-shrink-0">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">구매대행 수수료 안내</h2>
          </div>
          <p className="text-sm text-text-secondary mb-3 leading-relaxed">
            상품 결제 금액(원화 기준)에 따라 아래 구간별 구매대행 수수료가 적용되며, 상품 표시 단가에 포함되어 안내됩니다.
          </p>
          <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-text-secondary">
                  <th className="px-4 py-2.5 text-left font-semibold">상품 금액(원화)</th>
                  <th className="px-4 py-2.5 text-left font-semibold">대행 수수료</th>
                  <th className="px-4 py-2.5 text-left font-semibold">비고</th>
                </tr>
              </thead>
              <tbody>
                {FEE_TABLE.map((r, i) => (
                  <tr key={i} className="border-t border-border-light">
                    <td className="px-4 py-2.5 text-text-secondary">{r.range}</td>
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{r.rate}</td>
                    <td className="px-4 py-2.5 text-text-tertiary">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-tertiary mt-3 leading-relaxed">
            ※ 결제 금액 = 상품가(실시간 CNY/KRW 환율 적용) + 구매대행 수수료 + 국내배송비. 환율 마진은 부과하지 않습니다.
            관세·부가세는 물품가 미화 $150 초과 시 통관 단계에서 별도 부과되며 이용자가 부담합니다.
          </p>
        </section>

        {/* 배송·통관 소요기간 */}
        <section id="timeline" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-5 rounded-xl flex items-center justify-center flex-shrink-0">
              <Ship className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">배송 · 통관 소요기간</h2>
          </div>
          <p className="text-sm text-text-secondary mb-3 leading-relaxed">
            주문 확정일로부터 배송 완료까지 <strong>통상 7~15 영업일</strong>이 소요됩니다. 배송은 아래 3단계로 진행됩니다.
          </p>
          <ol className="space-y-2 mb-3">
            {[
              '1단계 (중국 국내배송): 1688 판매자 → 중국 내 배송대행지(배대지)',
              '2단계 (국제배송): 중국 배대지 → 한국 (통관 포함)',
              '3단계 (국내배송): 통관 완료 후 이용자 배송지까지 국내 택배',
            ].map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary leading-relaxed">
                <span className="text-primary mt-0.5 flex-shrink-0">·</span><span>{t}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-text-tertiary leading-relaxed">
            ※ 통관 지연(세관 검사·서류 보완), 중국 연휴(춘절·국경절), 판매자 재고 부족, 천재지변·국제 물류 혼잡 등
            불가항력 사유로 지연될 수 있으며, 지연 시 즉시 안내드립니다. 통관을 위해 개인통관고유부호가 필요합니다.
          </p>
        </section>

        {/* 국내 배송비 */}
        <section id="shipping-fee" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-5 rounded-xl flex items-center justify-center flex-shrink-0">
              <Ship className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">국내 배송비 안내</h2>
          </div>
          <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden bg-white">
            <table className="w-full text-sm">
              <tbody>
                {SHIPPING_FEE_TABLE.map((row, i) => (
                  <tr key={i} className="border-b border-border-light last:border-b-0">
                    <td className="px-4 py-3 text-text-secondary">{row.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary whitespace-nowrap">{row.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-tertiary mt-3 leading-relaxed">{SHIPPING_POLICY_LABELS.note}</p>
        </section>

        {/* 청약철회·교환·환불 */}
        <section id="refund" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-5 rounded-xl flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">청약철회 · 교환 · 환불 규정</h2>
          </div>
          <ul className="space-y-2 mb-3">
            {[
              ['결제 전 / 결제 완료(구매 진행 전)', '자유롭게 취소 가능하며 전액 환불됩니다.'],
              ['1688 구매 진행 이후', '이용자의 주문에 의해 해외에서 개별 구매가 이루어지므로, 단순 변심에 의한 청약철회가 제한됩니다(전자상거래법 제17조 제2항 해외 구매대행).'],
              ['불량·파손·오배송', '상품 수령일로부터 7일 이내 신고 시 교환 또는 환불 처리하며, 반품 배송비는 회사가 부담합니다.'],
              ['단순 변심 반품', '반품은 가능하나 왕복 국제배송비를 이용자가 부담합니다.'],
              ['환불 처리', '취소일로부터 3~7 영업일 이내 원래 결제수단으로 환불됩니다(카드사 사정에 따라 상이).'],
            ].map(([k, v], i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span className="font-semibold text-text-primary">· {k}: </span>
                <span className="text-text-secondary">{v}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-tertiary leading-relaxed">
            자세한 규정은 <Link href="/terms" className="text-primary underline">이용약관 제7조(청약철회)·제8조(환불)·제9조(반품·교환)</Link>를 확인해 주세요.
          </p>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center bg-primary-5 rounded-[var(--radius-xl)] p-8">
        <Headphones className="w-8 h-8 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">더 궁금한 점이 있으신가요?</h2>
        <p className="text-sm text-text-secondary mb-5">
          자주 묻는 질문을 확인하거나 실시간 상담으로 문의해 주세요.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/faq"
            className="inline-flex items-center px-5 py-2.5 bg-white border border-border text-text-primary text-sm font-medium rounded-[var(--radius-md)] hover:border-primary transition-colors"
          >
            자주 묻는 질문
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
          >
            문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
