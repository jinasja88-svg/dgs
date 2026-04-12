'use client';

import { useState, useEffect } from 'react';
import { Heart, Trash2, ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface WishlistItem {
  product_id: string;
  title: string;
  title_zh?: string;
  image: string;
  price_krw: number;
  price_cny: number;
  seller_name?: string;
  added_at: string;
}

const WISHLIST_KEY = 'ddalkkak-wishlist';

function getLocalWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: WishlistItem[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function proxyImg(url: string): string {
  if (!url) return '';
  if (url.includes('alicdn.com') || url.includes('1688.com/img')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setItems(getLocalWishlist());
        setIsLoggedIn(false);
        setIsLoaded(true);
        return;
      }

      setIsLoggedIn(true);

      // DB에서 찜 목록 로드
      const res = await fetch('/api/sourcing/wishlist');
      const dbItems: WishlistItem[] = res.ok ? await res.json() : [];

      // localStorage → DB 마이그레이션 (1회)
      const localItems = getLocalWishlist();
      const dbProductIds = new Set(dbItems.map((i) => i.product_id));
      const toMigrate = localItems.filter((i) => !dbProductIds.has(i.product_id));

      if (toMigrate.length > 0) {
        const results = await Promise.allSettled(
          toMigrate.map((item) =>
            fetch('/api/sourcing/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            }).then((r) => { if (!r.ok) throw new Error('failed'); return r; })
          )
        );

        const failedCount = results.filter((r) => r.status === 'rejected').length;

        if (failedCount === 0) {
          // 모든 항목 성공 시에만 localStorage 삭제
          localStorage.removeItem(WISHLIST_KEY);
        } else {
          // 실패한 항목만 localStorage에 유지
          const failedItems = toMigrate.filter((_, i) => results[i].status === 'rejected');
          saveLocalWishlist(failedItems);
          toast?.error?.(`${failedCount}개 항목 동기화에 실패했습니다. 다시 시도해주세요.`);
        }

        // 마이그레이션 후 DB 재조회
        const res2 = await fetch('/api/sourcing/wishlist');
        const merged: WishlistItem[] = res2.ok ? await res2.json() : dbItems;
        setItems(merged);
      } else {
        if (localItems.length > 0) localStorage.removeItem(WISHLIST_KEY);
        setItems(dbItems);
      }

      setIsLoaded(true);
    }

    load();
  }, []);

  const removeItem = async (productId: string) => {
    if (isLoggedIn) {
      await fetch(`/api/sourcing/wishlist?product_id=${productId}`, { method: 'DELETE' });
    } else {
      const updated = items.filter((item) => item.product_id !== productId);
      saveLocalWishlist(updated);
    }
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearAll = async () => {
    if (isLoggedIn) {
      await Promise.allSettled(
        items.map((item) =>
          fetch(`/api/sourcing/wishlist?product_id=${item.product_id}`, { method: 'DELETE' })
        )
      );
    } else {
      saveLocalWishlist([]);
    }
    setItems([]);
  };

  if (!isLoaded) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-40" />
          <div className="h-4 bg-surface rounded w-60" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface rounded-[var(--radius-lg)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">내찜목록</h1>
          <p className="text-sm text-text-tertiary mt-1">관심 상품을 모아보세요</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-text-tertiary hover:text-danger transition-colors"
          >
            전체 삭제
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-[var(--radius-lg)] border border-border-light py-20 text-center">
          <Heart className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">찜한 상품이 없습니다</p>
          <p className="text-sm text-text-tertiary mb-6">마음에 드는 상품을 찜해보세요</p>
          <Link href="/shop">
            <Button variant="primary">
              <Search className="w-4 h-4 mr-1.5" />
              상품 검색하기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="bg-white border border-border-light rounded-[var(--radius-lg)] p-4 flex items-center gap-4 hover:shadow-card transition-shadow"
            >
              <Link href={`/shop/${item.product_id}`} className="flex-shrink-0">
                <div className="w-20 h-20 bg-surface rounded-[var(--radius-md)] overflow-hidden">
                  {item.image ? (
                    <img
                      src={proxyImg(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.product_id}`} className="hover:text-primary transition-colors">
                  <h3 className="text-sm font-medium text-text-primary line-clamp-1">{item.title}</h3>
                </Link>
                {item.title_zh && (
                  <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5">{item.title_zh}</p>
                )}
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-base font-bold text-primary">{formatPrice(item.price_krw)}</span>
                  <span className="text-xs text-text-tertiary">¥{item.price_cny}</span>
                </div>
                {item.seller_name && (
                  <p className="text-xs text-text-tertiary mt-0.5">{item.seller_name}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/shop/${item.product_id}`}>
                  <Button variant="secondary" size="sm">
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    주문
                  </Button>
                </Link>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="p-2 text-text-tertiary hover:text-danger transition-colors rounded-[var(--radius-sm)] hover:bg-danger-5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
