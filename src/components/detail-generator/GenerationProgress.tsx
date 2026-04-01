'use client';

import { Loader2, Check, Sparkles, Database } from 'lucide-react';

export type GenerationStep = 'idle' | 'fetching' | 'generating' | 'done';

interface GenerationProgressProps {
  step: GenerationStep;
}

const steps = [
  { key: 'fetching' as const, label: '상품 데이터 불러오는 중...', icon: Database },
  { key: 'generating' as const, label: 'AI가 상세페이지를 생성하고 있습니다...', icon: Sparkles },
];

export default function GenerationProgress({ step }: GenerationProgressProps) {
  if (step === 'idle' || step === 'done') return null;

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-8">
      <div className="max-w-md mx-auto space-y-4">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          const isDone =
            (s.key === 'fetching' && step === 'generating');

          return (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDone
                    ? 'bg-success/10 text-success'
                    : isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isDone
                    ? 'text-success font-medium'
                    : isActive
                      ? 'text-text-primary font-medium'
                      : 'text-text-tertiary'
                }`}
              >
                {isDone ? s.label.replace('...', ' 완료') : s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
