'use client';

import { useState, use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Minus, Plus, ShoppingCart, ArrowLeft, Heart, ExternalLink, Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, cn } from '@/lib/utils';
import { addToCart } from '@/lib/cart';
import { addRecentlyViewed } from '@/lib/recently-viewed';
import { createClient } from '@/lib/supabase';
import type { SourcingProduct } from '@/types';

const WISHLIST_KEY = 'ddalkkak-wishlist';

function proxyImg(url: string): string {
  if (!url) return '';
  if (url.includes('alicdn.com') || url.includes('1688.com/img')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // URL 파라미터에서 검색 결과 기본 정보 추출 (상세 API 실패 시 폴백)
  const fallbackProduct: SourcingProduct | null = (() => {
    const title = searchParams.get('title');
    const image = searchParams.get('image');
    const price_krw = searchParams.get('price_krw');
    const price_cny = searchParams.get('price_cny');
    const seller = searchParams.get('seller');
    if (!title) return null;
    return {
      product_id: productId,
      title,
      title_zh: title,
      price_krw: Number(price_krw) || 0,
      price_cny: Number(price_cny) || 0,
      images: image ? [decodeURIComponent(image)] : [],
      skus: [],
      seller: seller ? { name: decodeURIComponent(seller) } : null,
      stock: 0,
    };
  })();

  const { data: product, isLoading, error } = useQuery<SourcingProduct>({
    queryKey: ['sourcing-product', productId],
    queryFn: async () => {
      const r = await fetch(`/api/sourcing/product/${productId}`);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || '상품을 불러오지 못했습니다');
      return json;
    },
    retry: false,
  });

  // 상세 API 실패 시 검색 결과 fallback 사용 (hooks 이후, 조건부 렌더링 이전에 선언)
  const displayProduct = product || fallbackProduct || null;

  const selectedSkuData = displayProduct?.skus?.find((s) => s.sku_id === selectedSku);
  const currentPrice = selectedSkuData?.price_krw || displayProduct?.price_krw || 0;
  const currentPriceCny = selectedSkuData?.price_cny || displayProduct?.price_cny || 0;
  const serviceFee = Math.round(currentPrice * quantity * 0.12);
  const shippingFee = 3000;
  const totalPrice = currentPrice * quantity + serviceFee + shippingFee;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        fetch('/api/sourcing/wishlist')
          .then((r) => r.json())
          .then((dbItems: { product_id: string }[]) => {
            if (Array.isArray(dbItems)) {
              setIsWishlisted(dbItems.some((i) => i.product_id === productId));
            }
          })
          .catch(() => {});
      } else {
        setIsLoggedIn(false);
        try {
          const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
          setIsWishlisted(wishlist.some((item: { product_id: string }) => item.product_id === productId));
        } catch {}
      }
    });
  }, [productId]);

  // 상품 로드 완료 시 min_order로 초기 수량 설정
  useEffect(() => {
    if (displayProduct?.min_order && displayProduct.min_order > 1) {
      setQuantity(displayProduct.min_order);
    }
  }, [displayProduct?.product_id, displayProduct?.min_order]);

  // 상품 로드 완료 시 최근 본 상품 저장
  useEffect(() => {
    if (displayProduct) {
      addRecentlyViewed({
        product_id: displayProduct.product_id,
        title: displayProduct.title,
        image: displayProduct.images[0] || '',
        price_krw: displayProduct.price_krw,
      });
    }
  }, [displayProduct?.product_id]);

  const toggleWishlist = async () => {
    if (!displayProduct) return;

    if (isLoggedIn) {
      if (isWishlisted) {
        await fetch(`/api/sourcing/wishlist?product_id=${productId}`, { method: 'DELETE' });
        setIsWishlisted(false);
        toast.success('찜목록에서 제거했습니다');
      } else {
        await fetch('/api/sourcing/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: displayProduct.product_id,
            title: displayProduct.title,
            title_zh: displayProduct.title_zh,
            image: displayProduct.images[0] || '',
            price_krw: displayProduct.price_krw,
            price_cny: displayProduct.price_cny,
            seller_name: displayProduct.seller?.name,
          }),
        });
        setIsWishlisted(true);
        toast.success('찜목록에 추가했습니다');
      }
    } else {
      try {
        const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        if (isWishlisted) {
          const updated = wishlist.filter((item: { product_id: string }) => item.product_id !== productId);
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
          setIsWishlisted(false);
          toast.success('찜목록에서 제거했습니다');
        } else {
          wishlist.push({
            product_id: displayProduct.product_id,
            title: displayProduct.title,
            title_zh: displayProduct.title_zh,
            image: displayProduct.images[0] || '',
            price_krw: displayProduct.price_krw,
            price_cny: displayProduct.price_cny,
            seller_name: displayProduct.seller?.name,
            added_at: new Date().toISOString(),
          });
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
          setIsWishlisted(true);
          toast.success('찜목록에 추가했습니다');
        }
      } catch {}
    }
  };

  const handleAddToCart = () => {
    if (displayProduct?.skus?.length && !selectedSku) {
      toast.error('옵션을 선택해주세요.');
      return;
    }
    addToCart({
      product_id: displayProduct!.product_id,
      title: displayProduct!.title,
      image: displayProduct!.images[0] || '',
      sku_id: selectedSkuData?.sku_id,
      sku_name: selectedSkuData?.name,
      quantity,
      price_cny: currentPriceCny,
      price_krw: currentPrice,
      min_order: displayProduct!.min_order || 1,
    });
    toast.success('장바구니에 담았습니다!');
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleOrder = async () => {
    if (displayProduct?.skus?.length && !selectedSku) {
      toast.error('옵션을 선택해주세요.');
      return;
    }

    setIsOrdering(true);
    try {
      const res = await fetch('/api/sourcing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              product_id: displayProduct!.product_id,
              title: displayProduct!.title,
              image: displayProduct!.images[0] || '',
              sku_name: selectedSkuData?.name,
              quantity,
              price_cny: currentPriceCny,
              price_krw: currentPrice,
            },
          ],
          total_cny: currentPriceCny * quantity,
          total_krw: currentPrice * quantity,
          service_fee: serviceFee,
          shipping_fee: shippingFee,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '주문 실패');
      }

      toast.success('주문이 접수되었습니다!');
      router.push('/sourcing-orders');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '주문 중 오류가 발생했습니다.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (!isLoading && !displayProduct) {
    return (
      <div className="p-6 lg:p-8 text-center py-20">
        <p className="text-text-tertiary mb-4">상품 정보를 불러올 수 없습니다.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/shop" className="text-primary hover:underline">목록으로 돌아가기</Link>
          <a
            href={`https://detail.1688.com/offer/${productId}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            1688에서 보기 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  if (isLoading && !fallbackProduct) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 검색 결과로
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-white rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center border border-border-light">
            {displayProduct!.images[selectedImageIndex] ? (
              <img
                src={proxyImg(displayProduct!.images[selectedImageIndex])}
                alt={displayProduct!.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-6xl">📦</span>
            )}
          </div>
          {displayProduct!.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {displayProduct!.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === i ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={proxyImg(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="bg-white rounded-[var(--radius-lg)] border border-border-light p-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">{displayProduct!.title}</h1>
            {displayProduct!.title_zh && (
              <p className="text-sm text-text-tertiary mb-4">{displayProduct!.title_zh}</p>
            )}

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</span>
              <span className="text-sm text-text-tertiary">¥{currentPriceCny}</span>
            </div>

            {displayProduct!.seller && (
              <div className="flex items-center gap-4 p-3 bg-surface rounded-[var(--radius-md)] mb-6 text-sm">
                <span className="font-medium">{displayProduct!.seller.name}</span>
                {displayProduct!.seller.rating && <span className="text-warning">★ {displayProduct!.seller.rating}</span>}
                {displayProduct!.seller.years && <span className="text-text-tertiary">{displayProduct!.seller.years}년</span>}
                {displayProduct!.seller.location && <span className="text-text-tertiary">{displayProduct!.seller.location}</span>}
              </div>
            )}

            {/* SKU Selection */}
            {displayProduct!.skus?.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-text-primary mb-2 block">옵션 선택</label>
                <div className="flex flex-wrap gap-2">
                  {displayProduct!.skus?.map((sku) => (
                    <button
                      key={sku.sku_id}
                      onClick={() => setSelectedSku(sku.sku_id)}
                      className={cn(
                        'px-4 py-2 border rounded-[var(--radius-md)] text-sm transition-colors',
                        selectedSku === sku.sku_id
                          ? 'border-primary bg-primary-5 text-primary font-medium'
                          : 'border-border text-text-secondary hover:border-primary'
                      )}
                    >
                      {sku.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-sm font-medium text-text-primary mb-2 block">수량</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { const minOrder = displayProduct!.min_order || 1; if (quantity > minOrder) setQuantity(quantity - 1); }}
                  disabled={quantity <= (displayProduct!.min_order || 1)}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded-[var(--radius-sm)] hover:bg-surface"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded-[var(--radius-sm)] hover:bg-surface"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {displayProduct!.min_order && displayProduct!.min_order > 1 && (
                  <span className="text-xs text-text-tertiary">최소 주문: {displayProduct!.min_order}개</span>
                )}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-surface rounded-[var(--radius-lg)] p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">상품 금액</span>
                <span>{formatPrice(currentPrice * quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">서비스 수수료 (12%)</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">국내 배송비</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>총 결제 금액</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <Button
                variant="secondary"
                onClick={handleAddToCart}
                size="lg"
                className="flex-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addedToCart ? '담겼습니다!' : '장바구니'}
              </Button>
              <button
                onClick={toggleWishlist}
                className={cn(
                  'w-12 h-12 flex items-center justify-center border rounded-[var(--radius-md)] transition-colors flex-shrink-0',
                  isWishlisted
                    ? 'border-danger bg-danger-5 text-danger'
                    : 'border-border text-text-tertiary hover:border-danger hover:text-danger'
                )}
              >
                <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
              </button>
            </div>
            <Button
              onClick={handleOrder}
              isLoading={isOrdering}
              size="lg"
              className="w-full"
            >
              소싱 주문하기
            </Button>
          </div>
        </div>
      </div>

      {/* 1688 구매자 리뷰 */}
      <RatingsSection productId={productId} />

      {/* 1688 상세 페이지 */}
      <DetailSection productId={productId} />
    </div>
  );
}

interface TranslatedRating {
  content: string;
  content_zh: string;
  time: string;
  star: number;
  sku_info?: string;
  images?: string[];
  user_name?: string;
}

interface SiteReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function RatingsSection({ productId }: { productId: string }) {
  const [activeTab, setActiveTab] = useState<'1688' | 'site'>('1688');
  const [showAll1688, setShowAll1688] = useState(false);
  const [showAllSite, setShowAllSite] = useState(false);

  const { data: ratingsData, isLoading: isLoading1688 } = useQuery<{ ratings: TranslatedRating[] }>({
    queryKey: ['product-ratings', productId],
    queryFn: async () => {
      const r = await fetch(`/api/sourcing/product/${productId}/ratings`);
      return r.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  const { data: siteData, isLoading: isLoadingSite } = useQuery<{ reviews: SiteReview[] }>({
    queryKey: ['product-site-reviews', productId],
    queryFn: async () => {
      const r = await fetch(`/api/sourcing/product/${productId}/site-reviews`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const ratings = ratingsData?.ratings || [];
  const siteReviews = siteData?.reviews || [];

  const isLoading = activeTab === '1688' ? isLoading1688 : isLoadingSite;

  if (!isLoading1688 && !isLoadingSite && ratings.length === 0 && siteReviews.length === 0) return null;

  const avg1688 = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.star, 0) / ratings.length).toFixed(1)
    : null;
  const avgSite = siteReviews.length
    ? (siteReviews.reduce((sum, r) => sum + r.rating, 0) / siteReviews.length).toFixed(1)
    : null;

  const displayed1688 = showAll1688 ? ratings : ratings.slice(0, 3);
  const displayedSite = showAllSite ? siteReviews : siteReviews.slice(0, 3);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-text-secondary" />
        <h2 className="text-base font-semibold text-text-primary">구매자 리뷰</h2>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-border-light mb-0">
        <button
          onClick={() => setActiveTab('1688')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === '1688'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          <span>🇨🇳</span>
          <span>1688 리뷰</span>
          {!isLoading1688 && ratings.length > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === '1688' ? 'bg-primary/10 text-primary' : 'bg-surface text-text-tertiary'
            )}>
              {ratings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('site')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'site'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          <span>🇰🇷</span>
          <span>딸깍소싱 리뷰</span>
          {!isLoadingSite && siteReviews.length > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === 'site' ? 'bg-primary/10 text-primary' : 'bg-surface text-text-tertiary'
            )}>
              {siteReviews.length}
            </span>
          )}
        </button>
      </div>

      <div className="border border-t-0 border-border-light rounded-b-[var(--radius-lg)] overflow-hidden bg-white">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : activeTab === '1688' ? (
          ratings.length === 0 ? (
            <p className="p-6 text-sm text-text-tertiary text-center">1688 리뷰가 없습니다.</p>
          ) : (
            <div className="divide-y divide-border-light">
              {avg1688 && (
                <div className="px-4 py-3 flex items-center gap-1.5 bg-surface/50">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold text-text-primary">{avg1688}</span>
                  <span className="text-xs text-text-tertiary">/ 5.0 · {ratings.length}건</span>
                </div>
              )}
              {displayed1688.map((rating, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={cn(
                            'w-3.5 h-3.5',
                            si < rating.star ? 'text-warning fill-warning' : 'text-border'
                          )}
                        />
                      ))}
                    </div>
                    {rating.user_name && (
                      <span className="text-xs text-text-tertiary">{rating.user_name}</span>
                    )}
                    {rating.time && (
                      <span className="text-xs text-text-tertiary">{rating.time.slice(0, 10)}</span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">{rating.content}</p>
                  {rating.content_zh && rating.content !== rating.content_zh && (
                    <p className="text-xs text-text-tertiary mt-1">{rating.content_zh}</p>
                  )}
                  {rating.sku_info && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-surface text-xs text-text-tertiary rounded-[var(--radius-sm)]">
                      {rating.sku_info}
                    </span>
                  )}
                  {rating.images && rating.images.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {rating.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={proxyImg(img)}
                          alt=""
                          className="w-16 h-16 rounded-[var(--radius-sm)] object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {ratings.length > 3 && (
                <button
                  onClick={() => setShowAll1688(!showAll1688)}
                  className="w-full py-3 text-sm text-primary hover:bg-surface transition-colors"
                >
                  {showAll1688 ? '접기' : `리뷰 ${ratings.length}건 전체 보기`}
                </button>
              )}
            </div>
          )
        ) : (
          siteReviews.length === 0 ? (
            <p className="p-6 text-sm text-text-tertiary text-center">딸깍소싱 리뷰가 없습니다.</p>
          ) : (
            <div className="divide-y divide-border-light">
              {avgSite && (
                <div className="px-4 py-3 flex items-center gap-1.5 bg-surface/50">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold text-text-primary">{avgSite}</span>
                  <span className="text-xs text-text-tertiary">/ 5.0 · {siteReviews.length}건</span>
                </div>
              )}
              {displayedSite.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={cn(
                            'w-3.5 h-3.5',
                            si < review.rating ? 'text-warning fill-warning' : 'text-border'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-text-primary leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
              {siteReviews.length > 3 && (
                <button
                  onClick={() => setShowAllSite(!showAllSite)}
                  className="w-full py-3 text-sm text-primary hover:bg-surface transition-colors"
                >
                  {showAllSite ? '접기' : `리뷰 ${siteReviews.length}건 전체 보기`}
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DetailSection({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery<{ html: string }>({
    queryKey: ['product-desc', productId],
    queryFn: async () => {
      const r = await fetch(`/api/sourcing/product-desc/${productId}`);
      return r.json();
    },
    staleTime: 15 * 60 * 1000,
  });

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-text-primary mb-3">상세 정보</h2>
      <div className="border border-border-light rounded-[var(--radius-lg)] overflow-hidden bg-white">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : data?.html ? (
          <div
            className="p-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:mx-auto"
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        ) : (
          <div className="p-8 text-center text-text-tertiary">
            상세 설명을 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
