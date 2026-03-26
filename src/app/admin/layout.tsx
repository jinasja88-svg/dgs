'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Package, ShoppingBag, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const adminNavItems = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '소싱 주문', href: '/admin/sourcing-orders', icon: Package },
  { label: '일반 주문', href: '/admin/orders', icon: ShoppingBag },
  { label: '사용자', href: '/admin/users', icon: Users },
  { label: 'API 모니터', href: '/admin/api-monitor', icon: Activity },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-56 bg-white border-r border-border hidden lg:block flex-shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-primary">관리자 패널</h2>
        </div>
        <nav className="py-2">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-primary-5 text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 flex">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-xs',
              pathname === item.href ? 'text-primary' : 'text-text-tertiary'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </div>

      <main className="flex-1 bg-surface p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
