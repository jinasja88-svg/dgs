'use client';

import Link from 'next/link';
import { Heart, Search, Star } from 'lucide-react';
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
  return `/shop/${product.product_id}?${params.toString()}`;
}

function formatSalesPerMonth(sales90d?: number): string | null {
  if (!sales90d || sales90d <= 0) return null;
  const monthly = Math.round(sales90d / 3);
  return monthly.toLocaleString('ko-KR');
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onSimilarSearch,
}: ProductCardProps) {
  const href = buildHref(product);
  const monthlySales = formatSalesPerMonth(product.seller?.sales_90d);
  const repurchasePct = product.seller?.repurchase_rate;
  const showRepurchase = typeof repurchasePct === 'number' && repurchasePct >= 30;
  const rating = product.seller?.rating;

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

        {(product.seller?.name || (product.min_order && product.min_order > 1)) && (
          <p className="text-sm text-muted truncate">
            {product.seller?.name}
            {product.min_order && product.min_order > 1 && ` · MOQ ${product.min_order}`}
          </p>
        )}

        {/* Star color is INK per DESIGN.md §2 — no yellow rating stars */}
        {(rating != null || monthlySales) && (
          <p className="text-sm flex items-center gap-1 text-ink">
            {rating != null && (
              <>
                <Star className="w-3.5 h-3.5 fill-ink stroke-ink" strokeWidth={1.5} />
                <span className="font-medium">{rating.toFixed(2)}</span>
              </>
            )}
            {monthlySales && (
              <span className="text-muted">
                {rating != null && '· '}월 {monthlySales}개 판매
              </span>
            )}
          </p>
        )}

        {/* Price — single Ddalkkak unit price (margin baked in by mapper) */}
        <p className="text-base text-ink flex items-baseline gap-1.5">
          <span className="font-semibold">¥{product.price_cny}</span>
          <span className="text-muted text-sm">≈</span>
          <span className="font-semibold">{formatPrice(product.price_krw)}</span>
        </p>

        {/* Trust signals — sellochomes-style strip */}
        {(product.ships_in_24h || showRepurchase) && (
          <p className="text-xs text-muted flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
            {product.ships_in_24h && <span>24h 발송</span>}
            {showRepurchase && <span>재구매 {Math.round(repurchasePct!)}%</span>}
          </p>
        )}
      </div>
    </article>
  );
}
