'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { formatPrice } from '@/lib/utils';
import type { SourcingProduct, SourcingCategory, PaginatedResponse } from '@/types';

export default function ShopPage() {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery<SourcingCategory[]>({
    queryKey: ['sourcing-categories'],
    queryFn: () => fetch('/api/sourcing/categories').then((r) => r.json()),
  });

  const { data: result, isLoading } = useQuery<PaginatedResponse<SourcingProduct>>({
    queryKey: ['sourcing-search', keyword, selectedCategory, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('page', String(page));
      return fetch(`/api/sourcing/search?${params}`).then((r) => r.json());
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '소싱하기' }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">1688 상품 검색</h1>
        <p className="text-text-tertiary">중국 1688에서 원하는 상품을 찾아보세요</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="상품명을 검색하세요 (예: 블루투스 이어폰, 후드티)"
            className="w-full pl-11 pr-4 py-3 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <Button type="submit" size="lg">
          검색
        </Button>
      </form>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <button
          onClick={() => { setSelectedCategory(''); setPage(1); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedCategory ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-5'
          }`}
        >
          전체
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat.name
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-primary-5'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-text-tertiary mb-4">
            총 <strong className="text-text-primary">{result?.total || 0}</strong>개 상품
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {result?.data.map((product) => (
              <Link
                key={product.product_id}
                href={`/shop/${product.product_id}`}
                className="group bg-white border border-border-light rounded-[var(--radius-lg)] overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="aspect-square bg-surface flex items-center justify-center">
                  <span className="text-4xl text-text-tertiary">📦</span>
                </div>
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
                    <p className="text-xs text-text-tertiary mt-1">
                      {product.seller.name} · ⭐ {product.seller.rating}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {result && result.total_pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={result.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
