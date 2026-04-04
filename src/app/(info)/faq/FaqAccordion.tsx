'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CSFAQ } from '@/types';

function FaqItem({ faq }: { faq: CSFAQ }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-text-primary pr-4">{faq.question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-text-tertiary flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-text-secondary leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FaqAccordion({ faqs }: { faqs: CSFAQ[] }) {
  if (!faqs.length) {
    return (
      <div className="bg-white border border-border rounded-[var(--radius-lg)] px-6 py-10 text-center text-sm text-text-tertiary">
        등록된 FAQ가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-[var(--radius-lg)] px-6">
      {faqs.map((faq) => (
        <FaqItem key={faq.id} faq={faq} />
      ))}
    </div>
  );
}
