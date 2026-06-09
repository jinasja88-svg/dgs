import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ShoppingCart, CreditCard, Ship, Wallet, Headphones } from 'lucide-react';
import { SHIPPING_FEE_TABLE, SHIPPING_POLICY_LABELS } from '@/lib/shipping';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: '사용자 매뉴얼',
  description: '딸깍소싱 이용 가이드 — 소싱 검색부터 주문·결제·통관·배송·정산까지 단계별 안내',
};

const steps = [
  {
    id: 'search',
    icon: Search,
    title: '1. 소싱 검색',
    body: [
      '상단 검색창에 상품명(한글), 1688 상품 URL, 또는 상품 ID를 입력해 검색합니다.',
      '이미지 검색을 사용하면 가지고 있는 상품 사진과 유사한 1688 상품을 찾을 수 있습니다.',
      '가격·평점·재구매율·배송 속도 등 필터로 신뢰할 수 있는 공장/판매자를 선별하세요.',
      '관심 상품은 찜(♡)해두면 마이페이지·찜목록에서 다시 볼 수 있습니다.',
    ],
  },
  {
    id: 'order',
    icon: ShoppingCart,
    title: '2. 주문 담기',
    body: [
      '상품 상세에서 옵션(SKU)과 수량을 선택합니다. 최소 주문 수량(MOQ)을 확인하세요.',
      '표시 단가는 환율·수입 예상 비용이 반영된 "수입시 예상 단가"입니다.',
      '장바구니에 담아 여러 상품을 한 번에 주문할 수 있습니다.',
    ],
  },
  {
    id: 'checkout',
    icon: CreditCard,
    title: '3. 결제 (사업자 정보 입력)',
    body: [
      '본 서비스는 사업자(쿠팡 셀러 등) 대상 B2B 소싱 대행입니다. 결제 단계에서 배송지와 사업자 정보(상호·사업자등록번호·대표자·업태/종목)를 입력합니다.',
      '이용약관·개인정보 처리방침, 쿠팡 로켓그로스 관련 안내에 동의 후 주문이 확정됩니다.',
      '세금계산서가 필요한 경우 입력하신 사업자 정보로 발행됩니다.',
    ],
  },
  {
    id: 'shipping',
    icon: Ship,
    title: '4. 통관 · 배송',
    body: [
      '주문이 확정되면 1688에서 상품을 매입하고 중국 현지 검수 후 국제 운송을 진행합니다.',
      '통관 완료 후 국내 택배로 입력하신 배송지로 발송됩니다.',
      '진행 상황은 마이페이지 > 주문목록에서 단계별로 확인할 수 있습니다.',
    ],
  },
  {
    id: 'settle',
    icon: Wallet,
    title: '5. 정산 · 사후 관리',
    body: [
      '배송 완료 후 주문 상세에서 리뷰를 남길 수 있습니다.',
      '교환·반품이 필요하면 마이페이지 > 문의/반품에서 접수해 주세요.',
      '실시간 상담이 필요하면 우측 하단 고객센터 채팅을 이용하세요.',
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '사용자 매뉴얼' }]} />

      <h1 className="text-3xl font-bold text-text-primary mt-6 mb-2">사용자 매뉴얼</h1>
      <p className="text-text-tertiary mb-8">
        딸깍소싱을 처음 사용하시나요? 소싱 검색부터 정산까지 전체 흐름을 단계별로 안내합니다.
      </p>

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
          <li>
            <a href="#shipping-fee" className="text-sm text-text-secondary hover:text-primary transition-colors">
              국내 배송비 안내
            </a>
          </li>
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
