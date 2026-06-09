'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { adminNavItems, adminSidebarOnlyItems } from '@/lib/navigation';
import type { ReactNode } from 'react';

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
          <div className="my-2 mx-4 border-t border-border-light" />
          {adminSidebarOnlyItems.map((item) => (
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

      <main className="flex-1 bg-surface p-4 sm:p-6 lg:p-8 pb-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom)+1rem)] lg:pb-8">
        {children}
      </main>
    </div>
  );
}
