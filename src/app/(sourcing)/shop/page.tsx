'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Search, ImagePlus, Filter, X, Upload, ArrowUpDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
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

const POPULAR_KEYWORDS = [
  '블루투스 이어폰', '후드티', '텀블러', '무선 마우스', '레깅스',
  '에어팟 케이스', '캠핑 용품', '주방 용품', '반려동물 용품', '운동화',
  '선글라스', '파우치', '충전기', '스티커', '미니 선풍기',
];

type SortOption = 'recommend' | 'sales' | 'price_up' | 'price_down' | 'rating' | 'repurchase';
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommend', label: '추천순' },
  { value: 'sales', label: '판매량순' },
  { value: 'price_up', label: '낮은가격순' },
  { value: 'price_down', label: '높은가격순' },
  { value: 'rating', label: '평점순' },
  { value: 'repurchase', label: '재구매율순' },
];

// 1688 URL 또는 순수 상품 ID에서 product_id 추출
function extract1688Id(input: string): string | null {
  const trimmed = input.trim();
  // 순수 숫자 ID (10자리 이상)
  if (/^\d{10,}$/.test(trimmed)) return trimmed;
  // 1688 URL 패턴: /offer/123.html 또는 detail.1688.com/...
  const match = trimmed.match(/\/offer\/(\d+)|detail\.1688\.com[^/]*\/(\d{10,})|[?&]offerId=(\d+)/);
  if (match) return match[1] || match[2] || match[3];
  return null;
}

function saveRecentSearch(keyword: string) {
  if (!keyword.trim()) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    const next = [keyword, ...prev.filter((k) => k !== keyword)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {}
}

export default function ShopPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'image'>('keyword');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imageResults, setImageResults] = useState<SourcingProduct[] | null>(null);
  const [similarSearchSource, setSimilarSearchSource] = useState<string | null>(null);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [popularPage, setPopularPage] = useState(0);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [appliedPriceMin, setAppliedPriceMin] = useState<number | null>(null);
  const [appliedPriceMax, setAppliedPriceMax] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const POPULAR_PAGE_SIZE = 6;
  const popularTotalPages = Math.ceil(POPULAR_KEYWORDS.length / POPULAR_PAGE_SIZE);
  const visibleKeywords = POPULAR_KEYWORDS.slice(
    popularPage * POPULAR_PAGE_SIZE,
    (popularPage + 1) * POPULAR_PAGE_SIZE
  );

  // 사용자명 & 취향 카테고리 로드
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('preferred_categories')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
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
    queryKey: ['sourcing-search', keyword, selectedCategory, sortOption],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('sort', sortOption);
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
    const trimmed = searchInput.trim();

    // 1688 URL 또는 상품 ID 감지
    const extractedId = extract1688Id(trimmed);
    if (extractedId) {
      router.push(`/shop/${extractedId}`);
      return;
    }

    setImageResults(null);
    setSimilarSearchSource(null);
    setKeyword(trimmed);
    if (trimmed) {
      saveRecentSearch(trimmed);
      window.dispatchEvent(new Event('recent-updated'));
      fetch('/api/sourcing/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: trimmed }),
      }).catch(() => {});
    }
  };

  const handlePopularKeywordClick = (kw: string) => {
    setSearchInput(kw);
    setImageResults(null);
    setSimilarSearchSource(null);
    setKeyword(kw);
    saveRecentSearch(kw);
    window.dispatchEvent(new Event('recent-updated'));
    fetch('/api/sourcing/search-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: kw }),
    }).catch(() => {});
  };

  const applyPriceFilter = () => {
    setAppliedPriceMin(priceMin ? Number(priceMin) : null);
    setAppliedPriceMax(priceMax ? Number(priceMax) : null);
  };

  const clearPriceFilter = () => {
    setPriceMin('');
    setPriceMax('');
    setAppliedPriceMin(null);
    setAppliedPriceMax(null);
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

  const rawProducts = imageResults || infiniteData?.pages.flatMap((p) => p.data) || [];

  // 가격 범위 필터 (클라이언트 사이드)
  const displayProducts = rawProducts.filter((p) => {
    if (appliedPriceMin !== null && p.price_krw < appliedPriceMin) return false;
    if (appliedPriceMax !== null && p.price_krw > appliedPriceMax) return false;
    return true;
  });

  const totalCount = infiniteData?.pages[0]?.total ?? 0;

  // 취향 카테고리를 앞으로 정렬
  const sortedCategories = categories
    ? [
        ...(categories.filter((c) => preferredCategories.includes(c.name))),
        ...(categories.filter((c) => !preferredCategories.includes(c.name))),
      ]
    : [];

  return (
    <div className="p-6 lg:p-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">아이템 검색</h1>
        <p className="text-sm text-text-tertiary mt-1">1688에서 원하는 상품을 키워드, URL 또는 이미지로 검색하세요</p>
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
          <>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="상품명, 1688 URL 또는 상품 ID를 입력하세요"
                  className="w-full pl-11 pr-4 py-3 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                />
              </div>
              <Button type="submit" size="lg">
                검색
              </Button>
            </form>

            {/* 인기 검색어 슬라이더 */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-text-tertiary flex-shrink-0 font-medium">🔥 인기</span>
              <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                {visibleKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => handlePopularKeywordClick(kw)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs bg-surface text-text-secondary hover:bg-primary-5 hover:text-primary transition-colors border border-border"
                  >
                    {kw}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setPopularPage((p) => (p - 1 + popularTotalPages) % popularTotalPages)}
                  className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-primary hover:bg-primary-5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPopularPage((p) => (p + 1) % popularTotalPages)}
                  className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-primary hover:bg-primary-5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
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
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
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

      {/* Sort + Price Filter Row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {!imageResults && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <ArrowUpDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortOption(opt.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  sortOption === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-text-secondary hover:bg-primary-5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* 가격 범위 필터 */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <span className="text-xs text-text-tertiary">₩</span>
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="최소"
            className="w-20 px-2 py-1.5 border border-border rounded-[var(--radius-sm)] text-xs focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-text-tertiary">~</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="최대"
            className="w-20 px-2 py-1.5 border border-border rounded-[var(--radius-sm)] text-xs focus:outline-none focus:border-primary"
          />
          <button
            onClick={applyPriceFilter}
            className="px-2.5 py-1.5 bg-primary text-white text-xs rounded-[var(--radius-sm)] hover:bg-primary/90 transition-colors"
          >
            적용
          </button>
          {(appliedPriceMin !== null || appliedPriceMax !== null) && (
            <button
              onClick={clearPriceFilter}
              className="w-6 h-6 flex items-center justify-center text-text-tertiary hover:text-danger transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

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
                  <>이미지 검색 결과 <strong className="text-text-primary">{displayProducts.length}</strong>개</>
                ) : (
                  <>총 <strong className="text-text-primary">{totalCount}</strong>개 상품
                    {(appliedPriceMin !== null || appliedPriceMax !== null) && (
                      <span className="ml-1 text-primary">(필터 적용: {displayProducts.length}개)</span>
                    )}
                  </>
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

                  {/* 유사 상품 검색 버튼 */}
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
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <span className="text-xs text-text-tertiary truncate">{product.seller.name}</span>
                          {product.seller.is_super_factory && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-medium">실력공장</span>
                          )}
                          {product.seller.rating && <span className="text-xs text-warning">★ {product.seller.rating}</span>}
                          {product.seller.repurchase_rate != null && product.seller.repurchase_rate > 0 && (
                            <span className="text-[10px] text-green-600">재구매 {product.seller.repurchase_rate}%</span>
                          )}
                        </div>
                      )}
                      {product.seller?.sales_90d != null && product.seller.sales_90d > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3 text-text-tertiary" />
                          <span className="text-[11px] text-text-secondary">
                            월 판매량 ~{Math.round(product.seller.sales_90d / 3).toLocaleString()}개
                          </span>
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
