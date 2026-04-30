import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { SourcingBadgeTone } from '@/types';

interface CardBadgeProps {
  tone: SourcingBadgeTone;
  children: ReactNode;
  className?: string;
}

/* DESIGN.md §6.4 — floating product card badge.
 * Voltage-protected: only `primary` and `ink` are filled. The rest are
 * white-faced + ink text + hairline border, so multiple badges can stack
 * without crowding the photo. */
const toneStyles: Record<SourcingBadgeTone, string> = {
  primary: 'bg-primary text-on-primary',
  ink: 'bg-ink text-on-primary',
  success: 'bg-canvas text-ink border border-hairline',
  muted: 'bg-canvas text-ink border border-hairline',
};

export default function CardBadge({ tone, children, className }: CardBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[11px] font-semibold leading-[1.18] whitespace-nowrap',
        'shadow-float',
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
