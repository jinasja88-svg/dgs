import { Check } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '요금 안내' };

const features = [
  '1688 상품 검색 및 소싱 대행',
  '실시간 CNY-KRW 환율 적용',
  '주문 상태 실시간 추적',
  '전담 고객 지원',
  '품질 검수 서비스',
  '국내 배송 추적',
];

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
          투명한 요금 안내
        </h1>
        <p className="text-lg text-text-secondary">
          숨겨진 비용 없이, 명확한 요금 체계
        </p>
      </div>

      <div className="max-w-lg mx-auto bg-white border-2 border-primary rounded-[var(--radius-xl)] overflow-hidden shadow-lg">
        <div className="bg-primary px-8 py-6 text-center">
          <h2 className="font-heading text-xl font-bold text-white mb-1">소싱 대행 서비스</h2>
          <p className="text-white/80 text-sm">누구나 이용 가능</p>
        </div>
        <div className="px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-primary font-heading">12</span>
              <span className="text-2xl font-bold text-primary">%</span>
            </div>
            <p className="text-sm text-text-tertiary mt-2">상품 금액 기준 서비스 수수료</p>
          </div>

          <div className="bg-surface rounded-[var(--radius-lg)] p-4 mb-8 text-center">
            <p className="text-sm text-text-secondary">
              국내 배송비 <span className="font-bold text-text-primary">3,000원</span> (건당)
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-bg flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-text-secondary">{feature}</span>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            className="block w-full text-center py-3.5 bg-primary text-white font-semibold rounded-[var(--radius-md)] hover:bg-primary-hover transition-colors"
          >
            소싱 시작하기
          </Link>
        </div>
      </div>

      <div className="mt-12 bg-surface rounded-[var(--radius-xl)] p-8">
        <h3 className="font-heading text-lg font-semibold mb-4 text-center">요금 계산 예시</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left font-medium text-text-tertiary">항목</th>
                <th className="py-3 px-4 text-right font-medium text-text-tertiary">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-light">
                <td className="py-3 px-4 text-text-secondary">상품 금액 (¥100 x 185원)</td>
                <td className="py-3 px-4 text-right">₩18,500</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-3 px-4 text-text-secondary">서비스 수수료 (12%)</td>
                <td className="py-3 px-4 text-right">₩2,220</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-3 px-4 text-text-secondary">국내 배송비</td>
                <td className="py-3 px-4 text-right">₩3,000</td>
              </tr>
              <tr className="font-bold">
                <td className="py-3 px-4">총 결제 금액</td>
                <td className="py-3 px-4 text-right text-primary">₩23,720</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
