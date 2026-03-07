import { Globe, Shield, Zap, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '서비스 소개' };

const values = [
  { icon: Shield, title: '투명성', desc: '모든 비용을 명확하게 공개합니다. 숨겨진 수수료가 없습니다.' },
  { icon: Zap, title: '신속성', desc: '주문 접수부터 배송까지 빠르고 정확하게 처리합니다.' },
  { icon: Globe, title: '접근성', desc: '누구나 쉽게 중국 소싱을 할 수 있도록 도와드립니다.' },
  { icon: Users, title: '신뢰성', desc: '고객과의 소통을 최우선으로 생각합니다.' },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          딸깍소싱을 소개합니다
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          1688 중국 소싱의 복잡함을 해결하고, 누구나 원클릭으로
          쉽고 투명하게 소싱할 수 있는 플랫폼입니다.
        </p>
      </div>

      <div className="bg-surface rounded-[var(--radius-xl)] p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">우리의 미션</h2>
        <p className="text-text-secondary leading-relaxed">
          중국 1688 플랫폼에서 상품을 소싱하는 과정은 언어 장벽, 복잡한 결제, 불투명한 수수료 등
          많은 어려움이 있습니다. 딸깍소싱은 이러한 문제를 해결하여 소상공인과 셀러들이
          쉽고 안전하게 중국 상품을 소싱할 수 있도록 돕습니다.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {values.map((v) => (
          <div key={v.title} className="bg-white border border-border rounded-[var(--radius-lg)] p-6">
            <div className="w-12 h-12 bg-primary-5 rounded-xl flex items-center justify-center mb-4">
              <v.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
            <p className="text-sm text-text-tertiary">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center bg-primary-5 rounded-[var(--radius-xl)] p-8">
        <h2 className="text-2xl font-bold mb-4">함께하세요</h2>
        <p className="text-text-secondary mb-6">
          궁금한 점이 있으시면 언제든지 문의해주세요.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
        >
          문의하기
        </a>
      </div>
    </div>
  );
}
