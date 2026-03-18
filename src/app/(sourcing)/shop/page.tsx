'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ImagePlus, Filter, X, Upload } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import { formatPrice } from '@/lib/utils';
import type { SourcingProduct, SourcingCategory, PaginatedResponse } from '@/types';

export default function ShopPage() {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [searchMode, setSearchMode] = useState<'keyword' | 'image'>('keyword');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imageResults, setImageResults] = useState<SourcingProduct[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    enabled: !imageResults,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setImageResults(null);
    setKeyword(searchInput);
    setPage(1);
  };

  const handleImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsImageSearching(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/sourcing/image-search', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.data) {
        setImageResults(data.data);
      }
    } catch {
      // silently fail
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
    setSearchMode('keyword');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayProducts = imageResults || result?.data || [];
  const showPagination = !imageResults && result && result.total_pages > 1;

  return (
    <div className="p-6 lg:p-8">
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

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <button
          onClick={() => { setSelectedCategory(''); setPage(1); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedCategory ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-primary-5'
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
                : 'bg-white border border-border text-text-secondary hover:bg-primary-5'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-tertiary">
              {imageResults ? (
                <>이미지 검색 결과 <strong className="text-text-primary">{imageResults.length}</strong>개</>
              ) : (
                <>총 <strong className="text-text-primary">{result?.total || 0}</strong>개 상품</>
              )}
            </p>
            {imageResults && (
              <button onClick={clearImageSearch} className="text-xs text-primary hover:underline">
                검색 초기화
              </button>
            )}
          </div>

          {displayProducts.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-lg)] border border-border-light py-20 text-center">
              <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary font-medium mb-1">검색 결과가 없습니다</p>
              <p className="text-sm text-text-tertiary">다른 키워드로 검색해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <Link
                  key={product.product_id}
                  href={`/shop/${product.product_id}`}
                  className="group bg-white border border-border-light rounded-[var(--radius-lg)] overflow-hidden hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl text-text-tertiary">📦</span>
                    )}
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
              ))}
            </div>
          )}

          {showPagination && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={result!.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
