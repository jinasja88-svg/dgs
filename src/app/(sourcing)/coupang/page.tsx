'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import { cn, formatPrice } from '@/lib/utils';
import { getScopedJSON, setScopedJSON } from '@/lib/client-scope';
import type { CoupangProduct, CoupangSortKey, CatNode, DeliveryType, RocketSize } from '@/lib/coupang/types';
import { getCommission, getShipFee, calcProfit, calcMargin, calcROAS } from '@/lib/coupang/profitability';
import type { PaginatedResponse } from '@/types';

// ---------------------
// 숫자 포맷 헬퍼
// ---------------------
function fmtNum(n: number | null | undefined): string {
  if (n == null) return '-';
  if (Math.abs(n) >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`;
  if (Math.abs(n) >= 1_0000) return `${(n / 1_0000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
}

function fmtPercent(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toFixed(1)}%`;
}

// ROAS 색상 헬퍼
function roasClass(roas: number | null): string {
  if (roas == null) return '';
  if (roas < 10) return 'text-green-600 font-semibold';
  if (roas < 20) return 'text-orange-500 font-semibold';
  return 'text-red-500 font-semibold';
}

// 전환율 출처별 색상/툴팁
function convMeta(source: string | null | undefined): { cls: string; title: string } {
  if (source === 'cat2') return { cls: 'text-blue-600', title: '중분류 기반' };
  if (source === 'cat1') return { cls: 'text-orange-500', title: '대분류 기반' };
  return { cls: 'text-text-tertiary', title: '전체 평균' };
}

const COUPANG_SEARCH = 'https://www.coupang.com/np/search?component=&q=';

// ---------------------
// 정렬 옵션
// ---------------------
const SORT_OPTIONS: { key: CoupangSortKey; label: string }[] = [
  { key: 'view_count', label: '조회수' },
  { key: 'buy_count', label: '구매수' },
  { key: 'estimated_monthly_sales', label: '추정판매' },
  { key: 'estimated_monthly_revenue', label: '추정매출' },
  { key: 'price', label: '가격' },
  { key: 'review_count', label: '리뷰수' },
  { key: 'conversion_rate', label: '전환율' },
];

const SIZE_OPTIONS: { value: RocketSize; label: string }[] = [
  { value: 'xSmall', label: '극소 (80cm/2kg)' },
  { value: 'small', label: '소 (100cm/5kg)' },
  { value: 'midium', label: '중 (120cm/10kg)' },
  { value: 'large', label: '대 (140cm/15kg)' },
  { value: 'xLarge', label: '특대 (160cm/20kg)' },
  { value: 'xxLarge', label: '초특대 (250cm/30kg)' },
];

// 계정별 localStorage 상태 키 (client-scope가 계정 스코핑 담당)
const STATE_KEY = 'ddalkkak-coupang-state';
const FAVS_KEY = 'ddalkkak-coupang-favs';

interface PersistState {
  searchInput: string;
  keyword: string;
  cat: [string, string, string, string];
  onlyCat: string;
  excludedCats: string[];
  minViews: string;
  maxReviews: string;
  excludeBrands: boolean;
  minPrice: string;
  maxPrice: string;
  minSales: string;
  sortKey: CoupangSortKey;
  sortAsc: boolean;
  deliveryType: DeliveryType;
  rocketSize: RocketSize;
}

export default function CoupangPage() {
  // 필터 상태
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [minViews, setMinViews] = useState('');
  const [maxReviews, setMaxReviews] = useState('');
  const [excludeBrands, setExcludeBrands] = useState(true);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSales, setMinSales] = useState('');

  // 캐스케이드 카테고리 (레벨별 선택 path)
  const [cat, setCat] = useState<[string, string, string, string]>(['', '', '', '']);
  // 카테고리 제외 / 만보기
  const [excludedCats, setExcludedCats] = useState<string[]>([]);
  const [onlyCat, setOnlyCat] = useState(''); // "만 보기" 카테고리 path (l1>l2)

  // 즐겨찾기
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [favOnly, setFavOnly] = useState(false);

  // 정렬
  const [sortKey, setSortKey] = useState<CoupangSortKey>('view_count');
  const [sortAsc, setSortAsc] = useState(false);

  // 배송 옵션
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('rocket_pro');
  const [rocketSize, setRocketSize] = useState<RocketSize>('small');

  // 페이지
  const [page, setPage] = useState(1);
  const perPage = 50;

  // 원가 입력 (로컬)
  const [costMap, setCostMap] = useState<Record<string, number>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // localStorage 복원 완료 플래그 (복원 전 저장 방지)
  const restoredRef = useRef(false);

  // ---- 마운트 시 상태 복원 ----
  useEffect(() => {
    const s = getScopedJSON<Partial<PersistState> | null>(STATE_KEY, null);
    if (s) {
      if (s.searchInput != null) setSearchInput(s.searchInput);
      if (s.keyword != null) setKeyword(s.keyword);
      if (Array.isArray(s.cat) && s.cat.length === 4) setCat(s.cat as [string, string, string, string]);
      if (s.onlyCat != null) setOnlyCat(s.onlyCat);
      if (Array.isArray(s.excludedCats)) setExcludedCats(s.excludedCats);
      if (s.minViews != null) setMinViews(s.minViews);
      if (s.maxReviews != null) setMaxReviews(s.maxReviews);
      if (typeof s.excludeBrands === 'boolean') setExcludeBrands(s.excludeBrands);
      if (s.minPrice != null) setMinPrice(s.minPrice);
      if (s.maxPrice != null) setMaxPrice(s.maxPrice);
      if (s.minSales != null) setMinSales(s.minSales);
      if (s.sortKey) setSortKey(s.sortKey);
      if (typeof s.sortAsc === 'boolean') setSortAsc(s.sortAsc);
      if (s.deliveryType) setDeliveryType(s.deliveryType);
      if (s.rocketSize) setRocketSize(s.rocketSize);
    }
    setFavs(new Set(getScopedJSON<string[]>(FAVS_KEY, [])));
    restoredRef.current = true;
  }, []);

  // ---- 상태 변경 시 저장 ----
  useEffect(() => {
    if (!restoredRef.current) return;
    const s: PersistState = {
      searchInput, keyword, cat, onlyCat, excludedCats,
      minViews, maxReviews, excludeBrands, minPrice, maxPrice, minSales,
      sortKey, sortAsc, deliveryType, rocketSize,
    };
    setScopedJSON(STATE_KEY, s);
  }, [searchInput, keyword, cat, onlyCat, excludedCats, minViews, maxReviews,
      excludeBrands, minPrice, maxPrice, minSales, sortKey, sortAsc, deliveryType, rocketSize]);

  // ---- 카테고리 트리 ----
  const { data: treeData } = useQuery<{ tree: CatNode[] }>({
    queryKey: ['coupang-category-tree'],
    queryFn: () => fetch('/api/coupang/category-tree').then((r) => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const byPath = useMemo(() => {
    const m = new Map<string, CatNode>();
    const walk = (nodes: CatNode[]) => {
      for (const n of nodes) {
        m.set(n.path, n);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(treeData?.tree || []);
    return m;
  }, [treeData]);

  const catOptions = useMemo(() => {
    const lvl1 = treeData?.tree || [];
    const lvl2 = cat[0] ? byPath.get(cat[0])?.children || [] : [];
    const lvl3 = cat[1] ? byPath.get(cat[1])?.children || [] : [];
    const lvl4 = cat[2] ? byPath.get(cat[2])?.children || [] : [];
    return [lvl1, lvl2, lvl3, lvl4];
  }, [treeData, byPath, cat]);

  // 선택된 최심 카테고리 path (만보기가 우선)
  const categoryPath = onlyCat || cat[3] || cat[2] || cat[1] || cat[0] || '';

  const handleCatChange = useCallback((level: number, value: string) => {
    setCat((prev) => {
      const next: [string, string, string, string] = [...prev];
      next[level] = value;
      for (let i = level + 1; i < 4; i++) next[i] = '';
      return next;
    });
    setOnlyCat('');
    setPage(1);
  }, []);

  // 상품 목록
  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<CoupangProduct>>({
    queryKey: ['coupang-products', keyword, categoryPath, excludedCats, onlyCat, minViews, maxReviews, excludeBrands, minPrice, maxPrice, minSales, sortKey, sortAsc, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (categoryPath) params.set('category_path', categoryPath);
      if (!onlyCat && excludedCats.length) params.set('exclude_cats', excludedCats.join(','));
      if (minViews) params.set('min_views', minViews);
      if (maxReviews) params.set('max_reviews', maxReviews);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (minSales) params.set('min_sales', minSales);
      params.set('exclude_brands', String(excludeBrands));
      params.set('sort', sortKey);
      params.set('order', sortAsc ? 'asc' : 'desc');
      params.set('page', String(page));
      params.set('per_page', String(perPage));
      return fetch(`/api/coupang/products?${params}`).then((r) => r.json());
    },
    staleTime: 30 * 1000,
  });

  // 로그인 유저 원가 로드
  useEffect(() => {
    fetch('/api/coupang/user-costs')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.costs) setCostMap((prev) => ({ ...prev, ...d.costs }));
      })
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(() => {
    setKeyword(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleSort = useCallback((key: CoupangSortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortAsc((prev) => !prev);
        return prevKey;
      }
      setSortAsc(false);
      return key;
    });
    setPage(1);
  }, []);

  const handleCostChange = useCallback((productId: string, value: string) => {
    const cost = parseInt(value) || 0;
    setCostMap((prev) => ({ ...prev, [productId]: cost }));

    // debounced 서버 저장
    if (debounceRef.current[productId]) clearTimeout(debounceRef.current[productId]);
    debounceRef.current[productId] = setTimeout(() => {
      fetch('/api/coupang/user-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupang_product_id: productId, import_cost: cost }),
      }).catch(() => {});
    }, 1500);
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      setScopedJSON(FAVS_KEY, [...next]);
      return next;
    });
  }, []);

  // 카테고리 제외 / 만보기
  const addExclude = useCallback((name: string) => {
    if (!name) return;
    setExcludedCats((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setPage(1);
  }, []);
  const removeExclude = useCallback((name: string) => {
    setExcludedCats((prev) => prev.filter((c) => c !== name));
    setPage(1);
  }, []);
  const clearExcludes = useCallback(() => { setExcludedCats([]); setPage(1); }, []);
  const setViewOnly = useCallback((path: string) => {
    setOnlyCat(path);
    setCat(['', '', '', '']);
    setPage(1);
  }, []);
  const clearViewOnly = useCallback(() => { setOnlyCat(''); setPage(1); }, []);

  const resetFilters = useCallback(() => {
    setSearchInput(''); setKeyword('');
    setCat(['', '', '', '']); setOnlyCat(''); setExcludedCats([]);
    setMinViews(''); setMaxReviews(''); setMinPrice(''); setMaxPrice(''); setMinSales('');
    setExcludeBrands(true); setFavOnly(false);
    setPage(1);
  }, []);

  const shipFee = getShipFee(deliveryType, rocketSize);
  const products = data?.data || [];
  const displayProducts = favOnly ? products.filter((p) => favs.has(p.id)) : products;

  const catLabels = ['1차', '2차', '3차', '4차'];

  return (
    <div className="max-w-full px-4 py-6 md:px-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">쿠팡 소싱 분석기</h1>
        <p className="text-sm text-text-secondary mt-1">
          쿠팡에서 잘 팔리는 상품을 찾고, 1688에서 소싱하세요
          {data?.total ? ` · 총 ${fmtNum(data.total)}개` : ''}
        </p>
      </div>

      {/* 필터바 */}
      <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-4 mb-4 space-y-3">
        {/* 검색 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="상품명, 키워드 검색..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border-light rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Button onClick={handleSearch} size="sm">검색</Button>
          <Button onClick={resetFilters} size="sm" variant="secondary">초기화</Button>
        </div>

        {/* 캐스케이드 카테고리 */}
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {[0, 1, 2, 3].map((lvl) => (
            <select
              key={lvl}
              value={cat[lvl]}
              onChange={(e) => handleCatChange(lvl, e.target.value)}
              disabled={lvl > 0 && !cat[lvl - 1]}
              className="px-3 py-1.5 border border-border-light rounded-[var(--radius-md)] text-sm bg-white disabled:opacity-40"
            >
              <option value="">{catLabels[lvl]} 전체</option>
              {catOptions[lvl].map((n) => (
                <option key={n.path} value={n.path}>{n.name}</option>
              ))}
            </select>
          ))}
        </div>

        {/* 필터 옵션 — 행 1 */}
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <input
            type="number"
            value={minViews}
            onChange={(e) => { setMinViews(e.target.value); setPage(1); }}
            placeholder="최소 조회수"
            className="w-28 px-2 py-1.5 border border-border-light rounded-[var(--radius-md)] text-sm"
          />
          <input
            type="number"
            value={maxReviews}
            onChange={(e) => { setMaxReviews(e.target.value); setPage(1); }}
            placeholder="최대 리뷰수"
            className="w-28 px-2 py-1.5 border border-border-light rounded-[var(--radius-md)] text-sm"
          />

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeBrands}
              onChange={(e) => { setExcludeBrands(e.target.checked); setPage(1); }}
              className="rounded"
            />
            <span className="text-text-secondary">대기업 제외</span>
          </label>

          <button
            onClick={() => setFavOnly((v) => !v)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              favOnly ? 'bg-yellow-400 text-white' : 'bg-surface text-text-secondary hover:bg-yellow-50'
            )}
          >
            ★ 즐겨찾기만
          </button>
        </div>

        {/* 필터 옵션 — 행 2: 가격/판매량 범위 */}
        <div className="flex flex-wrap gap-2 items-center text-sm border-t border-border-light pt-3">
          <span className="text-text-tertiary font-medium text-xs">가격:</span>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            placeholder="최소가"
            className="w-24 px-2 py-1.5 border border-border-light rounded-[var(--radius-md)] text-sm"
          />
          <span className="text-text-tertiary text-xs">~</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="최대가"
            className="w-24 px-2 py-1.5 border border-border-light rounded-[var(--radius-md)] text-sm"
          />

          <span className="text-text-tertiary font-medium text-xs ml-3">월판매:</span>
          <input
            type="number"
            value={minSales}
            onChange={(e) => { setMinSales(e.target.value); setPage(1); }}
            placeholder="최소 판매량"
            className="w-28 px-2 py-1.5 border border-border-light rounded-[var(--radius-md)] text-sm"
          />
        </div>

        {/* 배송 옵션 */}
        <div className="flex flex-wrap gap-2 items-center text-sm border-t border-border-light pt-3">
          <span className="text-text-tertiary font-medium">배송:</span>
          {([
            ['rocket_pro', '로켓 프로'],
            ['rocket_normal', '로켓 일반'],
            ['wing', '윙배송'],
          ] as const).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setDeliveryType(type)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                deliveryType === type
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-primary-5'
              )}
            >
              {label}
            </button>
          ))}

          {deliveryType !== 'wing' && (
            <select
              value={rocketSize}
              onChange={(e) => setRocketSize(e.target.value as RocketSize)}
              className="px-2 py-1 border border-border-light rounded-[var(--radius-md)] text-xs bg-white"
            >
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          <span className="text-text-tertiary text-xs ml-auto">
            배송비: {formatPrice(shipFee)}
          </span>
        </div>

        {/* 제외/만보기 칩 */}
        {(onlyCat || excludedCats.length > 0) && (
          <div className="flex flex-wrap gap-1.5 items-center text-xs border-t border-border-light pt-3">
            {onlyCat && (
              <button
                onClick={clearViewOnly}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-white"
              >
                {onlyCat.split('>').slice(-1)[0]} 만 보기 <X className="w-3 h-3" />
              </button>
            )}
            {!onlyCat && excludedCats.map((name) => (
              <button
                key={name}
                onClick={() => removeExclude(name)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-200"
              >
                {name} 제외 <X className="w-3 h-3" />
              </button>
            ))}
            {!onlyCat && excludedCats.length > 1 && (
              <button onClick={clearExcludes} className="px-2 py-1 text-text-tertiary hover:text-red-500">
                전체 해제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-[var(--radius-lg)] border border-border-light overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border-light">
              <th className="px-2 py-2.5 text-center font-medium text-text-tertiary w-8">★</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-tertiary w-12">#</th>
              <th
                className="px-3 py-2.5 text-left font-medium text-text-tertiary min-w-[200px] cursor-pointer hover:text-primary"
                onClick={() => handleSort('product_name')}
              >
                <span className="inline-flex items-center gap-0.5">
                  상품
                  {sortKey === 'product_name' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </span>
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-text-tertiary">주요키워드</th>
              <th className="px-3 py-2.5 text-left font-medium text-text-tertiary">카테고리</th>
              {SORT_OPTIONS.map((opt) => (
                <th
                  key={opt.key}
                  className="px-3 py-2.5 text-right font-medium text-text-tertiary cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                  onClick={() => handleSort(opt.key)}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {opt.label}
                    {sortKey === opt.key ? (
                      sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-medium text-text-tertiary whitespace-nowrap">수수료%</th>
              <th className="px-3 py-2.5 text-center font-medium text-text-tertiary whitespace-nowrap w-24">원가 입력</th>
              <th className="px-3 py-2.5 text-right font-medium text-text-tertiary whitespace-nowrap">수익</th>
              <th className="px-3 py-2.5 text-right font-medium text-text-tertiary whitespace-nowrap">마진%</th>
              <th className="px-3 py-2.5 text-right font-medium text-text-tertiary whitespace-nowrap">ROAS</th>
              <th className="px-3 py-2.5 text-center font-medium text-text-tertiary whitespace-nowrap">소싱</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border-light">
                  <td colSpan={18} className="px-3 py-3">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : displayProducts.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-3 py-12 text-center text-text-tertiary">
                  {favOnly ? '즐겨찾기한 상품이 없습니다' : '조건에 맞는 상품이 없습니다'}
                </td>
              </tr>
            ) : (
              displayProducts.map((p, idx) => {
                const commRate = getCommission(p.category);
                const importCost = costMap[p.id] || 0;
                const profit = importCost > 0 ? calcProfit(p.price, importCost, commRate, shipFee) : null;
                const margin = profit != null ? calcMargin(profit, p.price) : null;
                const roas = margin != null && margin > 0 ? calcROAS(margin) : null;
                const conv = convMeta(p.conversion_source);
                const excludeName = p.category_l2 || p.category_l1;
                const onlyPath = p.category_l2 ? `${p.category_l1}>${p.category_l2}` : p.category_l1;
                const keywords = [p.main_keyword, p.sub_keyword1, p.sub_keyword2].filter(Boolean) as string[];

                return (
                  <tr key={p.id} className="border-b border-border-light hover:bg-surface/50 transition-colors">
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => toggleFav(p.id)}
                        className={cn(
                          'text-lg leading-none transition-colors',
                          favs.has(p.id) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                        )}
                      >
                        ★
                      </button>
                    </td>
                    <td className="px-3 py-2 text-text-tertiary text-xs">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {p.image_url && (
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-10 h-10 rounded-[var(--radius-sm)] object-cover flex-shrink-0 border border-border-light"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <a
                            href={p.coupang_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-text-primary hover:text-primary line-clamp-2 transition-colors"
                          >
                            {p.product_name}
                          </a>
                          {p.item_name && (
                            <p className="text-[10px] text-text-tertiary mt-0.5 truncate">{p.item_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {keywords.map((kw, i) => (
                          <a
                            key={i}
                            href={`${COUPANG_SEARCH}${encodeURIComponent(kw)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors',
                              i === 0
                                ? 'bg-primary-5 text-primary hover:bg-primary hover:text-white'
                                : 'bg-surface text-text-secondary hover:bg-border-light'
                            )}
                          >
                            {kw}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-text-secondary whitespace-nowrap">
                      <span>{[p.category_l1, p.category_l2].filter(Boolean).join(' > ')}</span>
                      <span className="ml-1 inline-flex gap-1">
                        <button
                          onClick={() => addExclude(excludeName)}
                          className="text-[10px] text-red-400 hover:text-red-600"
                          title={`${excludeName} 제외`}
                        >
                          (제외)
                        </button>
                        <button
                          onClick={() => setViewOnly(onlyPath)}
                          className="text-[10px] text-primary hover:underline"
                          title={`${excludeName}만 보기`}
                        >
                          (만보기)
                        </button>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums">{fmtNum(p.view_count)}</td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums">{fmtNum(p.buy_count)}</td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums">
                      {fmtNum(p.estimated_monthly_sales)}
                      {p.buy_count ? <span className="text-[9px] text-green-600 ml-0.5">(실)</span> : null}
                    </td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums text-blue-600">{fmtNum(p.estimated_monthly_revenue)}</td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums">{formatPrice(p.price)}</td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums">{fmtNum(p.review_count)}</td>
                    <td className={cn('px-3 py-2 text-right text-xs tabular-nums', conv.cls)} title={conv.title}>
                      {fmtPercent(p.conversion_rate)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums">{commRate}%</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={costMap[p.id] || ''}
                        onChange={(e) => handleCostChange(p.id, e.target.value)}
                        placeholder="원가"
                        className="w-20 px-1.5 py-1 text-xs text-right border border-border-light rounded-[var(--radius-sm)] focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </td>
                    <td className={cn(
                      'px-3 py-2 text-right text-xs tabular-nums font-medium',
                      profit == null ? '' : profit > 0 ? 'text-green-600' : 'text-red-500'
                    )}>
                      {profit != null ? formatPrice(profit) : '-'}
                    </td>
                    <td className={cn(
                      'px-3 py-2 text-right text-xs tabular-nums font-medium',
                      margin == null ? '' : margin > 0 ? 'text-green-600' : 'text-red-500'
                    )}>
                      {margin != null ? `${margin}%` : '-'}
                    </td>
                    <td className={cn('px-3 py-2 text-right text-xs tabular-nums', roasClass(roas))}>
                      {roas != null ? roas.toFixed(1) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Link
                        href={`/shop?keyword=${encodeURIComponent(p.main_keyword || p.product_name)}`}
                        className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-primary bg-primary-5 rounded-full hover:bg-primary hover:text-white transition-colors"
                        title="1688에서 소싱하기"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        1688
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data && data.total_pages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isFetching && !isLoading && (
        <div className="fixed top-20 right-6 bg-primary text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50">
          로딩 중...
        </div>
      )}
    </div>
  );
}
