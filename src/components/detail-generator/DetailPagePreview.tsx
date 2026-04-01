'use client';

import { useState } from 'react';
import {
  Check, Star, Shield, Truck, Users, Lightbulb, ChevronDown, ChevronUp,
  AlertCircle, HelpCircle, Target, Zap, ThumbsUp, ThumbsDown, ArrowRight,
  PackageCheck, MessageCircle, TrendingUp,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import EditableText from './EditableText';
import type { SourcingProduct, Generated13SectionContent } from '@/types';

interface DetailPagePreviewProps {
  product: SourcingProduct;
  content: Generated13SectionContent;
  detailHtml: string;
  onContentChange: (updated: Generated13SectionContent) => void;
}

function proxyImg(url: string): string {
  if (!url) return '';
  if (url.startsWith('/api/image-proxy')) return url;
  if (url.includes('alicdn.com') || url.includes('1688.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url.startsWith('//') ? `https:${url}` : url)}`;
  }
  return url;
}

export default function DetailPagePreview({
  product,
  content,
  detailHtml,
  onContentChange,
}: DetailPagePreviewProps) {
  const [mainImage, setMainImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState(0);

  const update = <K extends keyof Generated13SectionContent>(
    key: K,
    value: Generated13SectionContent[K]
  ) => {
    onContentChange({ ...content, [key]: value });
  };

  return (
    <div className="bg-white max-w-[780px] mx-auto">

      {/* ── 01. HERO (어텐션) ── */}
      <section className="relative">
        {/* 배경 이미지 */}
        <div className="aspect-[16/9] bg-gray-900 overflow-hidden relative">
          {product.images[0] ? (
            <img
              src={proxyImg(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-70" />
          )}
          {/* 오버레이 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            {content.hero.urgency_badge && (
              <span className="inline-block px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full mb-4">
                {content.hero.urgency_badge}
              </span>
            )}
            <div className="mb-3">
              {content.hero.headline_options.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedHeadline(i)}
                  className={`mx-1 w-2.5 h-2.5 rounded-full transition-colors ${
                    selectedHeadline === i ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            <EditableText
              value={content.hero.headline_options[selectedHeadline] || product.title}
              onChange={(v) => {
                const updated = [...content.hero.headline_options];
                updated[selectedHeadline] = v;
                update('hero', { ...content.hero, headline_options: updated });
              }}
              as="h1"
              className="text-2xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg"
            />
            <EditableText
              value={content.hero.subheadline}
              onChange={(v) => update('hero', { ...content.hero, subheadline: v })}
              as="p"
              className="text-sm md:text-base text-white/90 mt-3 drop-shadow"
            />
            <div className="mt-6 px-8 py-3 bg-primary text-white font-bold rounded-full text-sm shadow-lg">
              {content.hero.cta_text}
            </div>
          </div>
        </div>
      </section>

      {/* ── 02. PAIN (공감) ── */}
      <section className="px-6 py-10 bg-gray-50">
        <EditableText
          value={content.pain.intro}
          onChange={(v) => update('pain', { ...content.pain, intro: v })}
          as="h2"
          className="text-xl font-bold text-text-primary text-center mb-6"
        />
        <div className="space-y-3 max-w-lg mx-auto">
          {content.pain.pain_points.map((point, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <EditableText
                value={point}
                onChange={(v) => {
                  const updated = [...content.pain.pain_points];
                  updated[i] = v;
                  update('pain', { ...content.pain, pain_points: updated });
                }}
                as="p"
                className="text-sm text-text-secondary"
              />
            </div>
          ))}
        </div>
        <EditableText
          value={content.pain.emotional_hook}
          onChange={(v) => update('pain', { ...content.pain, emotional_hook: v })}
          as="p"
          className="text-center text-sm text-primary font-medium mt-6"
        />
      </section>

      {/* ── 03. PROBLEM (문제 정의) ── */}
      <section className="px-6 py-10">
        <EditableText
          value={content.problem.hook}
          onChange={(v) => update('problem', { ...content.problem, hook: v })}
          as="h2"
          className="text-xl font-bold text-text-primary text-center mb-6"
        />
        <div className="space-y-3 max-w-lg mx-auto">
          {content.problem.reasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <EditableText
                value={reason}
                onChange={(v) => {
                  const updated = [...content.problem.reasons];
                  updated[i] = v;
                  update('problem', { ...content.problem, reasons: updated });
                }}
                as="p"
                className="text-sm text-text-secondary pt-1"
              />
            </div>
          ))}
        </div>
        <EditableText
          value={content.problem.reframe}
          onChange={(v) => update('problem', { ...content.problem, reframe: v })}
          as="p"
          className="text-center text-sm font-medium text-primary mt-6 bg-primary/5 rounded-xl py-3 px-4"
        />
      </section>

      <div className="mx-6 border-t border-border-light" />

      {/* ── 04. SOLUTION (솔루션 소개) ── */}
      <section className="px-6 py-10">
        <div className="text-center mb-6">
          <EditableText
            value={content.solution.intro}
            onChange={(v) => update('solution', { ...content.solution, intro: v })}
            as="p"
            className="text-sm text-text-tertiary mb-2"
          />
          <EditableText
            value={content.solution.one_liner}
            onChange={(v) => update('solution', { ...content.solution, one_liner: v })}
            as="h2"
            className="text-xl font-bold text-text-primary"
          />
        </div>
        {/* 이미지 갤러리 */}
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
          {product.images[mainImage] ? (
            <img
              src={proxyImg(product.images[mainImage])}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageCheck className="w-20 h-20 text-gray-300" />
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.slice(0, 8).map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  mainImage === i ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={proxyImg(img)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <EditableText
          value={content.solution.target_fit}
          onChange={(v) => update('solution', { ...content.solution, target_fit: v })}
          as="p"
          className="text-sm text-text-secondary text-center mt-4"
        />
      </section>

      {/* ── 05. HOW IT WORKS (사용법) ── */}
      <section className="px-6 py-10 bg-gray-50">
        <h2 className="text-lg font-bold text-text-primary text-center mb-8">이렇게 사용하세요</h2>
        <div className="space-y-4 max-w-lg mx-auto">
          {content.how_it_works.steps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
                <EditableText
                  value={step.title}
                  onChange={(v) => {
                    const updated = [...content.how_it_works.steps];
                    updated[i] = { ...updated[i], title: v };
                    update('how_it_works', { steps: updated });
                  }}
                  as="h3"
                  className="text-sm font-bold text-text-primary"
                />
                <EditableText
                  value={step.description}
                  onChange={(v) => {
                    const updated = [...content.how_it_works.steps];
                    updated[i] = { ...updated[i], description: v };
                    update('how_it_works', { steps: updated });
                  }}
                  as="p"
                  className="text-xs text-text-tertiary mt-1"
                />
              </div>
              {i < content.how_it_works.steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300 absolute right-0 hidden" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 06. BENEFITS (핵심 혜택) ── */}
      <section className="px-6 py-10">
        <h2 className="text-lg font-bold text-text-primary text-center mb-6">핵심 혜택</h2>
        <div className="grid grid-cols-2 gap-3">
          {content.benefits.items.map((item, i) => (
            <div key={i} className="bg-primary/5 rounded-xl p-4">
              <Zap className="w-5 h-5 text-primary mb-2" />
              <EditableText
                value={item.title}
                onChange={(v) => {
                  const updated = [...content.benefits.items];
                  updated[i] = { ...updated[i], title: v };
                  update('benefits', { items: updated });
                }}
                as="h3"
                className="text-sm font-bold text-text-primary"
              />
              <EditableText
                value={item.description}
                onChange={(v) => {
                  const updated = [...content.benefits.items];
                  updated[i] = { ...updated[i], description: v };
                  update('benefits', { items: updated });
                }}
                as="p"
                className="text-xs text-text-tertiary mt-1"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 07. SOCIAL PROOF (사회적 증거) ── */}
      <section className="px-6 py-10 bg-gray-50">
        <EditableText
          value={content.social_proof.headline}
          onChange={(v) => update('social_proof', { ...content.social_proof, headline: v })}
          as="h2"
          className="text-lg font-bold text-text-primary text-center mb-6"
        />
        {/* 통계 배지 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {content.social_proof.stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full shadow-sm">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <EditableText
                value={stat}
                onChange={(v) => {
                  const updated = [...content.social_proof.stats];
                  updated[i] = v;
                  update('social_proof', { ...content.social_proof, stats: updated });
                }}
                as="span"
                className="text-xs font-medium text-text-primary"
              />
            </div>
          ))}
          {/* 판매자 실제 데이터 */}
          {product.seller?.rating && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-yellow-50 rounded-full">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <span className="text-xs font-medium text-yellow-700">판매자 평점 {product.seller.rating}</span>
            </div>
          )}
          {product.seller?.years && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 rounded-full">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">{product.seller.years}년 운영</span>
            </div>
          )}
        </div>
        {/* 후기 카드 */}
        <div className="space-y-3 max-w-lg mx-auto">
          {content.social_proof.testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  {t.name[0]}
                </div>
                <span className="text-sm font-medium text-text-primary">{t.name}</span>
                <div className="flex text-yellow-400 ml-auto">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                </div>
              </div>
              <EditableText
                value={t.content}
                onChange={(v) => {
                  const updated = [...content.social_proof.testimonials];
                  updated[i] = { ...updated[i], content: v };
                  update('social_proof', { ...content.social_proof, testimonials: updated });
                }}
                as="p"
                className="text-sm text-text-secondary"
              />
              <p className="text-xs text-primary font-medium mt-2">→ {t.result}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 08. SPECS (상품 스펙) ── */}
      <section className="px-6 py-10">
        <h2 className="text-lg font-bold text-text-primary mb-4">상품 정보</h2>
        {/* 가격 블록 */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 mb-4">
          <p className="text-sm text-text-tertiary mb-1">판매가</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price_krw)}</span>
            <span className="text-sm text-text-tertiary line-through">¥{product.price_cny}</span>
          </div>
          {product.min_order && product.min_order > 1 && (
            <p className="text-xs text-text-tertiary mt-2">
              최소주문 {product.min_order}개 | 개당 {formatPrice(Math.round(product.price_krw / product.min_order))}
            </p>
          )}
        </div>
        {/* SKU 테이블 */}
        {product.skus.length > 0 && (
          <div className="border border-border-light rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-text-tertiary">옵션</th>
                  <th className="text-right py-3 px-4 font-medium text-text-tertiary">가격</th>
                  <th className="text-right py-3 px-4 font-medium text-text-tertiary">재고</th>
                </tr>
              </thead>
              <tbody>
                {product.skus.map((sku) => (
                  <tr key={sku.sku_id} className="border-t border-border-light">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {sku.image && (
                          <img src={proxyImg(sku.image)} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="text-text-primary">{sku.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-primary">{formatPrice(sku.price_krw)}</td>
                    <td className="text-right py-3 px-4 text-text-tertiary">{sku.stock}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 09. TRUST (신뢰 배지) ── */}
      <section className="px-6 py-8 bg-blue-50/50">
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            <Shield className="w-3.5 h-3.5" /> 품질 검수
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <Truck className="w-3.5 h-3.5" /> 직접 소싱
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            <PackageCheck className="w-3.5 h-3.5" /> 안전 포장
          </span>
          {product.seller && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {product.seller.name}
            </span>
          )}
        </div>
        <EditableText
          value={content.trust_text}
          onChange={(v) => update('trust_text', v)}
          as="p"
          className="text-sm text-blue-800/70 text-center"
        />
      </section>

      {/* ── 10. TARGET FILTER (타겟 필터) ── */}
      <section className="px-6 py-10">
        <h2 className="text-lg font-bold text-text-primary text-center mb-6">이런 분께 추천합니다</h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="bg-green-50/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-bold text-green-800">추천</h3>
            </div>
            <div className="space-y-2">
              {content.target_filter.recommended.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <EditableText
                    value={item}
                    onChange={(v) => {
                      const updated = [...content.target_filter.recommended];
                      updated[i] = v;
                      update('target_filter', { ...content.target_filter, recommended: updated });
                    }}
                    as="span"
                    className="text-xs text-green-800"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-red-50/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-red-800">비추천</h3>
            </div>
            <div className="space-y-2">
              {content.target_filter.not_recommended.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-400 flex-shrink-0 mt-0.5 text-xs">✕</span>
                  <EditableText
                    value={item}
                    onChange={(v) => {
                      const updated = [...content.target_filter.not_recommended];
                      updated[i] = v;
                      update('target_filter', { ...content.target_filter, not_recommended: updated });
                    }}
                    as="span"
                    className="text-xs text-red-800"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. DETAIL IMAGES (1688 상세 이미지) ── */}
      {detailHtml && (
        <section className="px-6 py-10 bg-gray-50">
          <h2 className="text-lg font-bold text-text-primary mb-4">상품 상세 이미지</h2>
          <div
            className="detail-html-content [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:mb-2"
            dangerouslySetInnerHTML={{ __html: detailHtml }}
          />
        </section>
      )}

      {/* ── 12. FAQ (자주 묻는 질문) ── */}
      <section className="px-6 py-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text-primary">자주 묻는 질문</h2>
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          {content.faq.map((item, i) => (
            <div key={i} className="border border-border-light rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-text-primary pr-4">Q. {item.question}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <EditableText
                    value={item.answer}
                    onChange={(v) => {
                      const updated = [...content.faq];
                      updated[i] = { ...updated[i], answer: v };
                      update('faq', updated);
                    }}
                    as="p"
                    className="text-sm text-text-secondary bg-gray-50 rounded-lg p-3"
                    multiline
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 13. FINAL CTA (최종 CTA) ── */}
      <section className="px-6 py-12 bg-gradient-to-b from-primary/5 to-primary/15 text-center">
        <EditableText
          value={content.final_cta.headline}
          onChange={(v) => update('final_cta', { ...content.final_cta, headline: v })}
          as="h2"
          className="text-xl font-bold text-text-primary mb-2"
        />
        <EditableText
          value={content.final_cta.urgency}
          onChange={(v) => update('final_cta', { ...content.final_cta, urgency: v })}
          as="p"
          className="text-sm text-red-500 font-medium mb-4"
        />
        <div className="mb-4">
          <span className="text-3xl font-bold text-primary">{formatPrice(product.price_krw)}</span>
        </div>
        <div className="inline-block px-10 py-3.5 bg-primary text-white font-bold rounded-full text-base shadow-lg mb-4">
          {content.final_cta.cta_text}
        </div>
        <EditableText
          value={content.final_cta.closing}
          onChange={(v) => update('final_cta', { ...content.final_cta, closing: v })}
          as="p"
          className="text-xs text-text-tertiary mt-2"
        />
      </section>

      {/* ── 푸터 ── */}
      <div className="px-6 py-6 bg-gray-100 text-center">
        <p className="text-xs text-text-tertiary">
          재고 {product.stock}개{product.min_order && product.min_order > 1 ? ` | 최소주문 ${product.min_order}개` : ''}
        </p>
        <p className="text-sm font-medium text-primary mt-1">딸깍소싱을 통해 안전하게 구매하세요</p>
      </div>
    </div>
  );
}
