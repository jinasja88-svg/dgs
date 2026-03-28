'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Search, ImagePlus, Filter, X, Upload, Clock, Zap, History } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import { getRecentlyViewed } from '@/lib/recently-viewed';
import type { RecentlyViewedItem } from '@/lib/recently-viewed';
import type { SourcingProduct, SourcingCategory, PaginatedResponse } from '@/types';

function proxyImg(url: string): string {
  if (!url) return '';
  if (url.includes('alicdn.com') || url.includes('1688.com/img')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const RECENT_SEARCHES_KEY = 'ddalkkak-recent-searches';
const MAX_RECENT = 8;

function saveRecentSearch(keyword: string) {
  if (!keyword.trim()) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    const next = [keyword, ...prev.filter((k) => k !== keyword)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {}
}

export default function ShopPage() {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'image'>('keyword');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imageResults, setImageResults] = useState<SourcingProduct[] | null>(null);
  const [similarSearchSource, setSimilarSearchSource] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 최근 검색어 & 사용자명 & 최근 본 상품 & 취향 카테고리 로드
  useEffect(() => {
    try {
      setRecentSearches(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'));
    } catch {}
    setRecentlyViewed(getRecentlyViewed());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('name, preferred_categories')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.name) setUserName(profile.name);
            if (profile?.preferred_categories?.length) {
              setPreferredCategories(profile.preferred_categories);
            }
          });
      }
    });
  }, []);

  const { data: categories } = useQuery<SourcingCategory[]>({
    queryKey: ['sourcing-categories'],
    queryFn: () => fetch('/api/sourcing/categories').then((r) => r.json()),
  });

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PaginatedResponse<SourcingProduct>>({
    queryKey: ['sourcing-search', keyword, selectedCategory],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('page', String(pageParam));
      params.set('per_page', '20');
      return fetch(`/api/sourcing/search?${params}`).then((r) => r.json());
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: !imageResults,
    staleTime: 5 * 60 * 1000,
  });

  // 무한 스크롤: sentinel이 뷰포트에 들어오면 다음 페이지 로드
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setImageResults(null);
    setSimilarSearchSource(null);
    setKeyword(searchInput);
    if (searchInput.trim()) {
      saveRecentSearch(searchInput.trim());
      setRecentSearches(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'));
      // DB 동기화 (fire and forget)
      fetch('/api/sourcing/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchInput.trim() }),
      }).catch(() => {});
    }
  };

  const handleRecentClick = (term: string) => {
    setSearchInput(term);
    setImageResults(null);
    setSimilarSearchSource(null);
    setKeyword(term);
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

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    setImageResults(null);
    setSimilarSearchSource(null);
    setKeyword('');
    setSearchInput('');
  };

  // Image URL 기반 검색 (돋보기 버튼 / URL 직접 입력)
  const searchByImageUrl = async (imageUrl: string, showAsSource?: boolean) => {
    setIsImageSearching(true);
    setImagePreview(imageUrl);
    setSearchMode('image');
    if (showAsSource) setSimilarSearchSource(imageUrl);
    try {
      const res = await fetch('/api/sourcing/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.data) {
        setImageResults(data.data);
      }
    } catch {
      toast.error('이미지 검색에 실패했습니다');
    } finally {
      setIsImageSearching(false);
    }
  };

  // 파일 업로드 기반 검색 (이미지 업로드 영역)
  const handleImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsImageSearching(true);
    setSimilarSearchSource(null);
    try {
      // 파일을 base64 data URL로 변환하여 API에 전달
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });

      const res = await fetch('/api/sourcing/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: base64 }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.data) {
        setImageResults(data.data);
      }
    } catch {
      toast.error('이미지 검색에 실패했습니다');
    } finally {
      setIsImageSearching(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  };

  const clearImageSearch = () => {
    setImagePreview(null);
    setImageResults(null);
    setSimilarSearchSource(null);
    setSearchMode('keyword');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayProducts = imageResults || infiniteData?.pages.flatMap((p) => p.data) || [];
  const totalCount = infiniteData?.pages[0]?.total ?? 0;

  const hasResults = !!(keyword || selectedCategory || imageResults);

  // 취향 카테고리를 앞으로 정렬
  const sortedCategories = categories
    ? [
        ...(categories.filter((c) => preferredCategories.includes(c.name))),
        ...(categories.filter((c) => !preferredCategories.includes(c.name))),
      ]
    : [];

  return (
    <div className="p-6 lg:p-8">
      {/* 환영 배너 */}
      {!hasResults && (
        <div className="bg-primary-5 border border-primary/20 rounded-[var(--radius-lg)] px-6 py-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-primary">
              {userName ? `${userName}님, 오늘도 소싱 시작해볼까요?` : '1688 소싱, 딸깍 한 번으로'}
            </p>
            <p className="text-sm text-primary/70 mt-0.5">키워드 또는 이미지로 중국 도매 상품을 검색하세요</p>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">아이템 검색</h1>
        <p className="text-sm text-text-tertiary mt-1">1688에서 원하는 상품을 키워드 또는 이미지로 검색하세요</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-5 mb-6">
        {/* Search Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => { setSearchMode('keyword'); clearImageSearch(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              searchMode === 'keyword' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-5'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            키워드 검색
          </button>
          <button
            onClick={() => setSearchMode('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              searchMode === 'image' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-5'
            }`}
          >
            <ImagePlus className="w-3.5 h-3.5" />
            이미지 검색
          </button>
        </div>

        {searchMode === 'keyword' ? (
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="상품명을 입력하세요 (예: 블루투스 이어폰, 후드티, 텀블러)"
                className="w-full pl-11 pr-4 py-3 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              />
            </div>
            <Button type="submit" size="lg">
              검색
            </Button>
          </form>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-border rounded-[var(--radius-lg)] p-8 text-center"
          >
            {imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img src={imagePreview} alt="검색 이미지" className="w-32 h-32 object-cover rounded-[var(--radius-md)]" />
                  <button
                    onClick={clearImageSearch}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isImageSearching && (
                  <p className="text-sm text-primary animate-pulse-soft">이미지로 상품 검색 중...</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-secondary">이미지를 드래그하거나 클릭하여 업로드</p>
                  <p className="text-xs text-text-tertiary mt-1">JPG, PNG 형식 지원</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  이미지 선택
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />
          </div>
        )}
      </div>

      {/* 인기 카테고리 빠른 진입 */}
      {!hasResults && sortedCategories.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-text-tertiary mb-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> 인기 카테고리
          </p>
          <div className="flex gap-2 flex-wrap">
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-xs font-medium transition-colors hover:bg-primary-5 hover:border-primary hover:text-primary ${
                  preferredCategories.includes(cat.name)
                    ? 'border-primary text-primary'
                    : 'border-border text-text-secondary'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 최근 검색어 */}
      {!hasResults && recentSearches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-text-tertiary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 최근 검색어
            </p>
            <button onClick={clearAllRecent} className="text-xs text-text-tertiary hover:text-danger transition-colors">
              전체 삭제
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((term) => (
              <span key={term} className="flex items-center gap-1 pl-3 pr-1.5 py-1 bg-white border border-border rounded-full text-xs text-text-secondary">
                <button onClick={() => handleRecentClick(term)} className="hover:text-primary transition-colors">
                  {term}
                </button>
                <button onClick={() => removeRecent(term)} className="w-4 h-4 flex items-center justify-center hover:text-danger transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 최근 본 상품 */}
      {!hasResults && recentlyViewed.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-text-tertiary mb-2 flex items-center gap-1">
            <History className="w-3.5 h-3.5" /> 최근 본 상품
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentlyViewed.map((item) => (
              <Link
                key={item.product_id}
                href={`/shop/${item.product_id}`}
                className="flex-shrink-0 w-28 group"
              >
                <div className="w-28 h-28 bg-white border border-border-light rounded-[var(--radius-md)] overflow-hidden mb-1.5">
                  {item.image ? (
                    <img
                      src={proxyImg(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-xs font-semibold text-primary mt-0.5">{formatPrice(item.price_krw)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar Search Source Banner */}
      {similarSearchSource && imageResults && (
        <div className="flex items-center gap-3 bg-white border border-border-light rounded-[var(--radius-lg)] p-3 mb-6">
          <img src={similarSearchSource} alt="" className="w-12 h-12 object-cover rounded-[var(--radius-md)] flex-shrink-0" referrerPolicy="no-referrer" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">유사 상품 검색 결과</p>
            <p className="text-xs text-text-tertiary">이 이미지와 비슷한 상품 {imageResults.length}개를 찾았습니다</p>
          </div>
          <button onClick={clearImageSearch} className="text-xs text-primary hover:underline flex-shrink-0">
            검색 초기화
          </button>
        </div>
      )}

      {/* Category Filter */}
      {!imageResults && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <button
            onClick={() => { setSelectedCategory(''); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-primary-5'
            }`}
          >
            전체
          </button>
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-primary-5'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading || isImageSearching ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[var(--radius-lg)] overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {!similarSearchSource && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-tertiary">
                {imageResults ? (
                  <>이미지 검색 결과 <strong className="text-text-primary">{imageResults.length}</strong>개</>
                ) : (
                  <>총 <strong className="text-text-primary">{totalCount}</strong>개 상품</>

                )}
              </p>
              {imageResults && (
                <button onClick={clearImageSearch} className="text-xs text-primary hover:underline">
                  검색 초기화
                </button>
              )}
            </div>
          )}

          {displayProducts.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-lg)] border border-border-light py-20 text-center">
              <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary font-medium mb-1">검색 결과가 없습니다</p>
              <p className="text-sm text-text-tertiary">다른 키워드로 검색해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="group relative bg-white border border-border-light rounded-[var(--radius-lg)] overflow-hidden hover:shadow-card-hover transition-all duration-200"
                >
                  <Link href={`/shop/${product.product_id}?title=${encodeURIComponent(product.title)}&image=${encodeURIComponent(product.images[0]||'')}&price_krw=${product.price_krw}&price_cny=${product.price_cny}&seller=${encodeURIComponent(product.seller?.name||'')}`}>
                    <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden relative">
                      {product.images[0] ? (
                        <img
                          src={proxyImg(product.images[0])}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl text-text-tertiary">📦</span>
                      )}
                    </div>
                  </Link>

                  {/* Magnifying glass - similar image search button */}
                  {product.images[0] && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        searchByImageUrl(product.images[0], true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 backdrop-blur-sm"
                      title="유사 상품 검색"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}

                  <Link href={`/shop/${product.product_id}?title=${encodeURIComponent(product.title)}&image=${encodeURIComponent(product.images[0]||'')}&price_krw=${product.price_krw}&price_cny=${product.price_cny}&seller=${encodeURIComponent(product.seller?.name||'')}`}>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-text-primary line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      {product.title_zh && (
                        <p className="text-xs text-text-tertiary line-clamp-1 mb-2">{product.title_zh}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-primary">{formatPrice(product.price_krw)}</span>
                        <span className="text-xs text-text-tertiary">¥{product.price_cny}</span>
                      </div>
                      {product.seller && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-xs text-text-tertiary truncate">{product.seller.name}</span>
                          <span className="text-xs text-warning">★ {product.seller.rating}</span>
                        </div>
                      )}
                      {product.min_order && product.min_order > 1 && (
                        <p className="text-[11px] text-text-tertiary mt-1">최소 {product.min_order}개</p>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* 무한 스크롤 sentinel */}
          {!imageResults && (
            <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-6">
              {isFetchingNextPage && (
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
              {!hasNextPage && displayProducts.length > 0 && (
                <p className="text-xs text-text-tertiary">모든 상품을 불러왔습니다</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
