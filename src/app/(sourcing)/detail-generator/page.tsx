'use client';

import { useState, useRef } from 'react';
import { ExternalLink, Sparkles, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import GenerationProgress, { type GenerationStep } from '@/components/detail-generator/GenerationProgress';
import DetailPagePreview from '@/components/detail-generator/DetailPagePreview';
import ExportToolbar from '@/components/detail-generator/ExportToolbar';
import type { SourcingProduct, Generated13SectionContent } from '@/types';

export default function DetailGeneratorPage() {
  const [productUrl, setProductUrl] = useState('');
  const [step, setStep] = useState<GenerationStep>('idle');
  const [error, setError] = useState('');

  const [product, setProduct] = useState<SourcingProduct | null>(null);
  const [content, setContent] = useState<Generated13SectionContent | null>(null);
  const [detailHtml, setDetailHtml] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  const extractProductId = (input: string): string => {
    const match = input.match(/offer\/(\d+)/);
    if (match) return match[1];
    const numMatch = input.match(/^(\d+)$/);
    if (numMatch) return numMatch[1];
    return input.trim();
  };

  const buildGenerateBody = (p: SourcingProduct) => ({
    title: p.title,
    title_zh: p.title_zh,
    price_krw: p.price_krw,
    price_cny: p.price_cny,
    skus: p.skus.slice(0, 10).map((s) => ({ name: s.name, price_cny: s.price_cny })),
    seller: p.seller,
    category: p.category,
    stock: p.stock,
    min_order: p.min_order,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractProductId(productUrl);
    if (!id) {
      setError('유효한 1688 상품 URL 또는 상품 ID를 입력하세요');
      return;
    }

    setError('');
    setProduct(null);
    setContent(null);
    setDetailHtml('');

    // Phase 1: Fetch product data
    setStep('fetching');
    try {
      const [productRes, descRes] = await Promise.all([
        fetch(`/api/sourcing/product/${id}`),
        fetch(`/api/sourcing/product-desc/${id}`),
      ]);

      if (!productRes.ok) throw new Error('상품 정보를 가져올 수 없습니다');
      const productData: SourcingProduct = await productRes.json();
      if (!productData.product_id) throw new Error('상품 정보를 가져올 수 없습니다');
      setProduct(productData);

      let html = '';
      if (descRes.ok) {
        const descData = await descRes.json();
        html = descData.html || '';
      }
      setDetailHtml(html);

      // Phase 2: Generate 13-section copy
      setStep('generating');
      const genRes = await fetch('/api/detail-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGenerateBody(productData)),
      });

      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}));
        throw new Error(errData.error || 'AI 생성에 실패했습니다');
      }

      const sectionData: Generated13SectionContent = await genRes.json();
      setContent(sectionData);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setStep('idle');
    }
  };

  const handleRegenerate = async () => {
    if (!product) return;

    setStep('generating');
    setError('');
    try {
      const genRes = await fetch('/api/detail-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGenerateBody(product)),
      });

      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}));
        throw new Error(errData.error || 'AI 재생성에 실패했습니다');
      }

      const sectionData: Generated13SectionContent = await genRes.json();
      setContent(sectionData);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setStep('done');
    }
  };

  const isGenerating = step === 'fetching' || step === 'generating';

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">상세페이지 생성</h1>
        <p className="text-sm text-text-tertiary mt-1">
          1688 상품 URL을 입력하면 AI가 13섹션 고전환 상세페이지를 자동 생성합니다
        </p>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-5 mb-6">
        <form onSubmit={handleGenerate} className="flex gap-3">
          <div className="relative flex-1">
            <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="1688 상품 URL 또는 상품 ID를 입력하세요"
              className="w-full pl-11 pr-4 py-3 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              disabled={isGenerating}
            />
          </div>
          <Button type="submit" size="lg" isLoading={isGenerating} disabled={isGenerating}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            생성하기
          </Button>
        </form>
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
      </div>

      {/* Progress */}
      <GenerationProgress step={step} />

      {/* Preview */}
      {product && content && step === 'done' && (
        <div className="space-y-6 mt-6">
          {/* Export Toolbar + Regenerate */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <ExportToolbar
              previewRef={previewRef}
              productTitle={content.hero.headline_options[0] || product.title}
            />
            <Button variant="ghost" size="sm" onClick={handleRegenerate}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              다시 생성
            </Button>
          </div>

          {/* Preview Container */}
          <div
            ref={previewRef}
            className="bg-white rounded-[var(--radius-lg)] border border-border-light overflow-hidden shadow-sm"
          >
            <DetailPagePreview
              product={product}
              content={content}
              detailHtml={detailHtml}
              onContentChange={setContent}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {step === 'idle' && !product && !error && (
        <div className="bg-white rounded-[var(--radius-lg)] border border-border-light py-20 text-center">
          <Sparkles className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">상품 URL을 입력해주세요</p>
          <p className="text-sm text-text-tertiary">
            1688.com 상품 페이지 URL 또는 상품 ID를 입력하면
            <br />
            AI가 13섹션 고전환 상세페이지를 자동으로 생성합니다
          </p>
        </div>
      )}
    </div>
  );
}
