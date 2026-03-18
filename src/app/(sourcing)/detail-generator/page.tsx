'use client';

import { useState } from 'react';
import { Search, FileText, ExternalLink, Loader2, Copy, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import type { SourcingProduct } from '@/types';

export default function DetailGeneratorPage() {
  const [productUrl, setProductUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState<SourcingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const extractProductId = (input: string): string => {
    // Extract numeric ID from 1688 URL or direct ID input
    const match = input.match(/offer\/(\d+)/);
    if (match) return match[1];
    const numMatch = input.match(/^(\d+)$/);
    if (numMatch) return numMatch[1];
    return input.trim();
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractProductId(productUrl);
    if (!id) {
      setError('유효한 1688 상품 URL 또는 상품 ID를 입력하세요');
      return;
    }

    setProductId(id);
    setIsLoading(true);
    setError('');
    setProduct(null);

    try {
      const res = await fetch(`/api/sourcing/product/${id}`);
      if (!res.ok) throw new Error('상품 정보를 가져올 수 없습니다');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="p-1.5 text-text-tertiary hover:text-primary transition-colors"
      title="복사"
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">상세페이지 생성</h1>
        <p className="text-sm text-text-tertiary mt-1">1688 상품 URL을 입력하면 상세 정보를 자동으로 가져옵니다</p>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-5 mb-6">
        <form onSubmit={handleFetch} className="flex gap-3">
          <div className="relative flex-1">
            <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="1688 상품 URL 또는 상품 ID를 입력하세요"
              className="w-full pl-11 pr-4 py-3 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
          </div>
          <Button type="submit" size="lg" isLoading={isLoading}>
            <Search className="w-4 h-4 mr-1.5" />
            가져오기
          </Button>
        </form>
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-[var(--radius-lg)] border border-border-light py-20 text-center">
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-text-secondary">상품 정보를 가져오는 중...</p>
        </div>
      )}

      {/* Product Detail Preview */}
      {product && (
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-text-primary">상품 기본 정보</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Images */}
              <div>
                <div className="aspect-square bg-surface rounded-[var(--radius-lg)] overflow-hidden mb-3">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                  )}
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.slice(0, 6).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded-[var(--radius-sm)] border border-border-light flex-shrink-0" />
                    ))}
                    {product.images.length > 6 && (
                      <div className="w-16 h-16 bg-surface rounded-[var(--radius-sm)] flex items-center justify-center text-xs text-text-tertiary flex-shrink-0">
                        +{product.images.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-tertiary uppercase">상품명 (한국어)</label>
                    <CopyButton text={product.title} field="title" />
                  </div>
                  <p className="text-sm text-text-primary mt-1">{product.title}</p>
                </div>

                {product.title_zh && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-tertiary uppercase">상품명 (중국어)</label>
                      <CopyButton text={product.title_zh} field="title_zh" />
                    </div>
                    <p className="text-sm text-text-primary mt-1">{product.title_zh}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-tertiary uppercase">판매가 (KRW)</label>
                    <p className="text-lg font-bold text-primary mt-1">{formatPrice(product.price_krw)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-tertiary uppercase">원가 (CNY)</label>
                    <p className="text-lg font-bold text-text-primary mt-1">¥{product.price_cny}</p>
                  </div>
                </div>

                {product.seller && (
                  <div className="p-3 bg-surface rounded-[var(--radius-md)]">
                    <label className="text-xs font-medium text-text-tertiary uppercase mb-2 block">판매자 정보</label>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{product.seller.name}</span>
                      <span className="text-warning">★ {product.seller.rating}</span>
                      {product.seller.years && <span className="text-text-tertiary">{product.seller.years}년</span>}
                      {product.seller.location && <span className="text-text-tertiary">{product.seller.location}</span>}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 text-sm">
                  {product.stock !== undefined && (
                    <div className="px-3 py-1.5 bg-surface rounded-full text-text-secondary">
                      재고: {product.stock}개
                    </div>
                  )}
                  {product.min_order && product.min_order > 1 && (
                    <div className="px-3 py-1.5 bg-surface rounded-full text-text-secondary">
                      최소주문: {product.min_order}개
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SKU Options */}
          {product.skus.length > 0 && (
            <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4">옵션/SKU 정보</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-text-tertiary">옵션명</th>
                      <th className="text-right py-2 pr-4 font-medium text-text-tertiary">가격 (CNY)</th>
                      <th className="text-right py-2 pr-4 font-medium text-text-tertiary">가격 (KRW)</th>
                      <th className="text-right py-2 font-medium text-text-tertiary">재고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.skus.map((sku) => (
                      <tr key={sku.sku_id} className="border-b border-border-light">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            {sku.image && (
                              <img src={sku.image} alt="" className="w-8 h-8 object-cover rounded-[var(--radius-xs)]" />
                            )}
                            <span>{sku.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-2.5 pr-4">¥{sku.price_cny}</td>
                        <td className="text-right py-2.5 pr-4 font-medium text-primary">{formatPrice(sku.price_krw)}</td>
                        <td className="text-right py-2.5">{sku.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.open(`/shop/${productId}`, '_blank')}
            >
              소싱 주문하기
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const text = `${product.title}\n가격: ${formatPrice(product.price_krw)} (¥${product.price_cny})\n이미지: ${product.images[0] || '없음'}`;
                copyToClipboard(text, 'all');
              }}
            >
              {copiedField === 'all' ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              정보 복사
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!product && !isLoading && !error && (
        <div className="bg-white rounded-[var(--radius-lg)] border border-border-light py-20 text-center">
          <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">상품 URL을 입력해주세요</p>
          <p className="text-sm text-text-tertiary">1688.com 상품 페이지 URL 또는 상품 ID를 입력하면<br />상세 정보를 자동으로 불러옵니다</p>
        </div>
      )}
    </div>
  );
}
