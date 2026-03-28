'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, FileText, Heart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { label: '아이템검색', href: '/shop', icon: Search },
  { label: '상세페이지 생성', href: '/detail-generator', icon: FileText },
  { label: '내찜목록', href: '/wishlist', icon: Heart },
  { label: '내주문목록', href: '/sourcing-orders', icon: ClipboardList },
];

export default function SourcingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border-light bg-white flex-shrink-0">
        <nav className="flex-1 px-3 pt-6">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-primary-5 text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )}
              >
                <item.icon className={cn('w-4.5 h-4.5', isActive ? 'text-primary' : 'text-text-tertiary')} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-light flex items-center justify-around py-2 px-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-[var(--radius-md)] text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-text-tertiary'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-surface min-w-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
