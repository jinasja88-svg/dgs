import type { Metadata } from 'next';

export const metadata: Metadata = { title: '이용약관' };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-8">이용약관</h1>
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-8 text-sm text-text-secondary leading-relaxed space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제1조 (목적)</h2>
          <p>본 약관은 딸깍소싱(이하 &quot;회사&quot;)이 제공하는 소싱 대행 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정합니다.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제2조 (서비스의 내용)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>중국 1688 플랫폼 상품 검색 및 소싱 대행</li>
            <li>주문 접수, 결제, 배송 추적 서비스</li>
            <li>실시간 환율 정보 제공</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제3조 (수수료)</h2>
          <p>서비스 이용 시 상품 금액의 12%를 서비스 수수료로 부과하며, 국내 배송비 3,000원이 추가됩니다.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제4조 (면책)</h2>
          <p>회사는 1688 플랫폼의 상품 품질, 판매자의 행위에 대해 직접적인 책임을 지지 않습니다. 다만, 소싱 대행 과정에서 발생하는 문제에 대해서는 성실히 중재합니다.</p>
        </section>
      </div>
    </div>
  );
}
