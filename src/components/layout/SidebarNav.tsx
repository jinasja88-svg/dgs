'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headphones, BookOpen } from 'lucide-react';
import { navItems, isActivePath } from '@/lib/navigation';
import { openSupportChat } from '@/lib/support-chat';
import { cn } from '@/lib/utils';

/**
 * 데스크톱(≥md) 좌측 세로 네비게이션. 모바일에서는 숨김(하단 탭이 대체).
 */
export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-[224px] flex-shrink-0 pl-4 lg:pl-6 pt-6">
      <nav className="sticky top-[80px] flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                active
                  ? 'text-primary bg-primary-5'
                  : 'text-text-secondary hover:text-primary hover:bg-surface'
              )}
            >
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] flex-shrink-0',
                  active ? 'text-primary' : 'text-text-tertiary'
                )}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="my-2 border-t border-border-light" />

        <Link
          href="/guide"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
            isActivePath(pathname, '/guide')
              ? 'text-primary bg-primary-5'
              : 'text-text-secondary hover:text-primary hover:bg-surface'
          )}
        >
          <BookOpen className="w-[18px] h-[18px] flex-shrink-0 text-text-tertiary" />
          사용자 매뉴얼
        </Link>

        <button
          type="button"
          onClick={openSupportChat}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-text-secondary hover:text-primary hover:bg-surface transition-colors text-left"
        >
          <Headphones className="w-[18px] h-[18px] flex-shrink-0 text-text-tertiary" />
          고객센터
        </button>
      </nav>
    </aside>
  );
}
