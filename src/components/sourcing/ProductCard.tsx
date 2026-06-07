'use client';

import Link from 'next/link';
import { Factory, Heart, Search, Star, Truck } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import CardBadge from './CardBadge';
import type { SourcingProduct } from '@/types';

interface ProductCardProps {
  product: SourcingProduct;
  isWishlisted: boolean;
  onToggleWishlist: (product: SourcingProduct) => void;
  onSimilarSearch?: (imageUrl: string) => void;
}

function proxyImg(url: string): string {
  if (!url) return '';
  if (url.includes('alicdn.com') || url.includes('1688.com/img')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function buildHref(product: SourcingProduct): string {
  const params = new URLSearchParams({
    title: product.title,
    image: product.images[0] || '',
    price_krw: String(product.price_krw),
    price_cny: String(product.price_cny),
    seller: product.seller?.name || '',
  });
  if (product.min_order && product.min_order > 1) {
    params.set('min_order', String(product.min_order));
  }
  if (product.sales_monthly) params.set('sales_monthly', String(product.sales_monthly));
  if (product.repurchase_rate) params.set('repurchase_rate', String(product.repurchase_rate));
  if (product.rating) params.set('rating', String(product.rating));
  return `/shop/${product.product_id}?${params.toString()}`;
}

function formatNumber(value?: number): string | null {
  if (!value || value <= 0) return null;
  return value.toLocaleString('ko-KR');
}

function formatCny(value?: number): string | null {
  if (!value || value <= 0) return null;
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onSimilarSearch,
}: ProductCardProps) {
  const href = buildHref(product);
  const monthlySales = formatNumber(product.sales_monthly || (product.seller?.sales_90d ? Math.round(product.seller.sales_90d / 3) : undefined));
  const repurchasePct = product.repurchase_rate ?? product.seller?.repurchase_rate;
  const rating = product.rating ?? product.seller?.rating;
  const primaryCny = formatCny(product.price_cny);
  const maxCny = formatCny(product.price_cny_max);
  const originCny = formatCny(product.origin_price_cny);
  const signals = [
    product.ships_in_24h ? '24h 발송' : null,
    product.ships_in_48h && !product.ships_in_24h ? '48h 발송' : null,
    product.free_shipping ? '무료배송' : null,
    product.return_in_7d ? '7일 반품' : null,
    product.is_super_factory ? '인증 공장' : null,
  ].filter((signal): signal is string => Boolean(signal));

  return (
    <article className="group block">
      {/* DESIGN.md §6.4 — 1:1 photo plate with 14px corner clip */}
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface-soft">
        <Link href={href} className="block w-full h-full">
          {product.images[0] ? (
            <img
              src={proxyImg(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-4xl text-muted-soft">📦</span>
          )}
        </Link>

        {/* Top-left badge stack — voltage-protected (max 2 from mapper) */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
            {product.badges.map((b) => (
              <CardBadge key={b.type} tone={b.tone}>
                {b.label}
              </CardBadge>
            ))}
          </div>
        )}

        {/* Top-right wishlist heart — always visible (DESIGN.md §6.4) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full bg-canvas/90 backdrop-blur-sm',
            'flex items-center justify-center transition shadow-float',
            'hover:scale-110'
          )}
          aria-label={isWishlisted ? '찜 해제' : '찜하기'}
        >
          <Heart
            className={cn(
              'w-[18px] h-[18px]',
              isWishlisted ? 'fill-primary text-primary' : 'text-ink'
            )}
          />
        </button>

        {/* Bottom-right "유사 검색" pill — desktop hover only */}
        {product.images[0] && onSimilarSearch && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSimilarSearch(product.images[0]);
            }}
            className={cn(
              'absolute bottom-3 right-3 hidden md:inline-flex items-center gap-1',
              'px-2.5 py-1 rounded-full bg-canvas/90 backdrop-blur-sm shadow-float',
              'text-[11px] font-medium text-ink',
              'opacity-0 group-hover:opacity-100 transition'
            )}
            title="유사 상품 검색"
          >
            <Search className="w-3 h-3" />
            유사 검색
          </button>
        )}
      </div>

      {/* Meta — DESIGN.md §6.4 4-line stack */}
      <div className="mt-3 space-y-1">
        <Link href={href} className="block">
          <h3 className="text-[15px] font-semibold text-ink leading-[1.3] line-clamp-2 group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </Link>

        {product.title_zh && product.title_zh !== product.title && (
          <p className="text-xs text-muted line-clamp-1">{product.title_zh}</p>
        )}

        {(product.seller?.name || (product.min_order && product.min_order > 1)) && (
          <p className="text-xs text-muted truncate">
            {product.seller?.name}
            {product.min_order && product.min_order > 1 && ` · MOQ ${product.min_order}`}
          </p>
        )}

        {(monthlySales || repurchasePct != null) && (
          <div className="grid grid-cols-2 gap-1.5">
            {monthlySales && (
              <div className="rounded-[var(--radius-sm)] bg-surface-soft px-2 py-1">
                <p className="text-[10px] text-muted leading-none">월 판매량</p>
                <p className="mt-1 text-xs font-semibold text-ink">{monthlySales}개</p>
              </div>
            )}
            {repurchasePct != null && (
              <div className="rounded-[var(--radius-sm)] bg-surface-soft px-2 py-1">
                <p className="text-[10px] text-muted leading-none">재구매율</p>
                <p className="mt-1 text-xs font-semibold text-ink">{Math.round(repurchasePct)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Price — single Ddalkkak unit price (margin baked in by mapper) */}
        <div className="pt-0.5">
          <p className="text-[11px] text-muted">{product.import_unit_label || '* 수입시 예상 단가'}</p>
          <p className="text-base text-ink flex items-baseline gap-1.5">
            <span className="font-semibold">{formatPrice(product.price_krw)}</span>
            <span className="text-muted text-xs">/</span>
            <span className="text-sm text-muted">
              ¥{primaryCny}{maxCny ? `~${maxCny}` : ''}
            </span>
            {originCny && originCny !== primaryCny && (
              <span className="text-xs text-muted-soft line-through">¥{originCny}</span>
            )}
          </p>
        </div>

        {(rating != null || product.seller?.is_super_factory || product.seller?.years) && (
          <p className="text-xs flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted pt-0.5">
            {rating != null && (
              <span className="inline-flex items-center gap-0.5 text-ink">
                <Star className="w-3 h-3 fill-ink stroke-ink" strokeWidth={1.5} />
                {rating.toFixed(1)}
              </span>
            )}
            {product.seller?.years ? <span>{product.seller.years}년 거래</span> : null}
            {product.seller?.is_super_factory && (
              <span className="inline-flex items-center gap-0.5">
                <Factory className="w-3 h-3" />
                공장
              </span>
            )}
          </p>
        )}

        {/* Trust signals — sellochomes-style strip */}
        {signals.length > 0 && (
          <p className="text-[11px] text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
            <Truck className="w-3 h-3 text-muted-soft" />
            {signals.slice(0, 3).map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
