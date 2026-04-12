'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, FileText, Heart, ClipboardList, Clock, History, X, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { getRecentlyViewed, clearRecentlyViewed } from '@/lib/recently-viewed';
import type { RecentlyViewedItem } from '@/lib/recently-viewed';

const RECENT_SEARCHES_KEY = 'ddalkkak-recent-searches';

function proxyImg(url: string): string {
  if (!url) return '';
  if (url.includes('alicdn.com') || url.includes('1688.com/img')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const bottomNavItems = [
  { label: '아이템검색', href: '/shop', icon: Search },
  { label: '쿠팡분석', href: '/coupang', icon: TrendingUp },
  { label: '상세페이지', href: '/detail-generator', icon: FileText },
  { label: '내찜목록', href: '/wishlist', icon: Heart },
  { label: '내주문목록', href: '/sourcing-orders', icon: ClipboardList },
];

export default function SourcingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  useEffect(() => {
    setMobileHistoryOpen(false);
    try {
      setRecentSearches(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'));
    } catch {}
    setRecentlyViewed(getRecentlyViewed());

    const onStorage = () => {
      try {
        setRecentSearches(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'));
      } catch {}
      setRecentlyViewed(getRecentlyViewed());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('recent-updated', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('recent-updated', onStorage);
    };
  }, [pathname]);

  const handleSearchClick = (term: string) => {
    setMobileHistoryOpen(false);
    router.push(`/shop?keyword=${encodeURIComponent(term)}`);
  };

  const removeRecent = (term: string) => {
    const next = recentSearches.filter((k) => k !== term);
    setRecentSearches(next);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Mobile History Bottom Sheet */}
      {mobileHistoryOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileHistoryOpen(false)}
          />
          <div className="md:hidden fixed left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg max-h-[60vh] overflow-y-auto" style={{ bottom: 'calc(56px + var(--safe-area-bottom))' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
              <span className="text-sm font-semibold text-text-primary">히스토리</span>
              <button onClick={() => setMobileHistoryOpen(false)}>
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-5">
              {recentSearches.length === 0 && recentlyViewed.length === 0 ? (
                <p className="text-sm text-text-tertiary text-center py-4">히스토리가 없습니다.</p>
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 최근 검색어
                        </p>
                        <button onClick={clearAllRecent} className="text-[10px] text-text-tertiary hover:text-danger transition-colors">
                          삭제
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.slice(0, 6).map((term) => (
                          <span
                            key={term}
                            className="inline-flex items-center gap-0.5 pl-2 pr-1 py-0.5 bg-surface border border-border-light rounded-full text-[11px] text-text-secondary"
                          >
                            <button
                              onClick={() => handleSearchClick(term)}
                              className="hover:text-primary transition-colors truncate max-w-[100px]"
                            >
                              {term}
                            </button>
                            <button
                              onClick={() => removeRecent(term)}
                              className="w-3.5 h-3.5 flex items-center justify-center hover:text-danger transition-colors flex-shrink-0"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recentlyViewed.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide flex items-center gap-1">
                          <History className="w-3 h-3" /> 최근 본 상품
                        </p>
                        <button
                          onClick={() => { clearRecentlyViewed(); setRecentlyViewed([]); }}
                          className="text-[10px] text-text-tertiary hover:text-danger transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentlyViewed.map((item) => (
                          <Link
                            key={item.product_id}
                            href={`/shop/${item.product_id}`}
                            onClick={() => setMobileHistoryOpen(false)}
                            className="flex items-center gap-2 group"
                          >
                            <div className="w-10 h-10 bg-surface border border-border-light rounded-[var(--radius-sm)] overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <img
                                  src={proxyImg(item.image)}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-text-secondary line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
                              <p className="text-[11px] font-semibold text-primary">{formatPrice(item.price_krw)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-light flex items-center justify-around py-2 px-1" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
        {bottomNavItems.map((item) => {
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
        <button
          onClick={() => setMobileHistoryOpen((v) => !v)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2 py-1 rounded-[var(--radius-md)] text-[11px] font-medium transition-colors',
            mobileHistoryOpen ? 'text-primary' : 'text-text-tertiary'
          )}
        >
          <History className="w-5 h-5" />
          히스토리
        </button>
      </nav>

      {/* Main Content */}
      <main className="bg-surface min-h-[calc(100vh-64px)] pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
