'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';

const faqs = [
  {
    q: '딸깍소싱은 어떤 서비스인가요?',
    a: '딸깍소싱은 중국 1688(알리바바) 플랫폼의 상품을 한국으로 소싱해주는 대행 서비스입니다. 상품 검색부터 주문, 결제, 배송까지 원스톱으로 처리해드립니다.',
  },
  {
    q: '수수료는 얼마인가요?',
    a: '상품 금액의 12%를 서비스 수수료로 책정하고 있습니다. 국내 배송비 3,000원이 추가됩니다. 숨겨진 수수료 없이 투명하게 운영합니다.',
  },
  {
    q: '환율은 어떻게 적용되나요?',
    a: '실시간 CNY-KRW 환율을 적용합니다. 주문 시점의 환율이 고정되어 적용됩니다.',
  },
  {
    q: '배송 기간은 얼마나 걸리나요?',
    a: '일반적으로 주문 접수 후 7-14일 정도 소요됩니다. 중국 내 물류 상황에 따라 변동될 수 있으며, 실시간으로 배송 상태를 확인하실 수 있습니다.',
  },
  {
    q: '최소 주문 수량이 있나요?',
    a: '상품마다 최소 주문 수량이 다릅니다. 상품 상세 페이지에서 확인하실 수 있습니다.',
  },
  {
    q: '반품/환불이 가능한가요?',
    a: '상품 수령 후 불량이나 오배송의 경우 반품 및 환불이 가능합니다. 단순 변심에 의한 반품은 국제 배송 특성상 제한될 수 있습니다.',
  },
  {
    q: '결제 방법은 무엇이 있나요?',
    a: '토스페이먼츠를 통한 카드 결제, 가상계좌, 간편결제 등을 지원합니다.',
  },
  {
    q: '문의는 어떻게 하나요?',
    a: '문의하기 페이지를 통해 양식을 작성하시거나, 카카오톡 채널로 문의하실 수 있습니다.',
  },
];

function FaqItem({ faq }: { faq: { q: string; a: string } }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-text-primary pr-4">{faq.q}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-text-tertiary flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-text-secondary leading-relaxed animate-fade-in">
          {faq.a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: 'FAQ' }]} />

      <h1 className="font-heading text-3xl font-bold text-text-primary mt-6 mb-2">자주 묻는 질문</h1>
      <p className="text-text-tertiary mb-8">딸깍소싱에 대해 궁금한 점을 확인해보세요.</p>

      <div className="bg-white border border-border rounded-[var(--radius-lg)] px-6">
        {faqs.map((faq, i) => (
          <FaqItem key={i} faq={faq} />
        ))}
      </div>
    </div>
  );
}
