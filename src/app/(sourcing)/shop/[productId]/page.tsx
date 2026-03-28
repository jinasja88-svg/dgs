'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Minus, Plus, ShoppingCart, ArrowLeft, Heart, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(800);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
                <span className="text-warning">★ {displayProduct!.seller.rating}</span>
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
                  onClick={() => setQuantity(Math.max(displayProduct!.min_order || 1, quantity - 1))}
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

      {/* 1688 상세 페이지 섹션 */}
      <div className="mt-8">
        <button
          onClick={() => setShowDetailPage((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 bg-white border border-border-light rounded-[var(--radius-lg)] hover:bg-surface transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-text-primary">1688 상세 페이지</span>
            <a
              href={`https://detail.1688.com/offer/${productId}.html`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-primary"
            >
              새 탭에서 열기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {showDetailPage ? <ChevronUp className="w-5 h-5 text-text-tertiary" /> : <ChevronDown className="w-5 h-5 text-text-tertiary" />}
        </button>

        {showDetailPage && (
          <div className="mt-2 border border-border-light rounded-[var(--radius-lg)] overflow-hidden bg-white">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border-light text-xs text-text-tertiary">
              <span>detail.1688.com/offer/{productId}.html</span>
            </div>
            <iframe
              ref={iframeRef}
              src={`/api/sourcing/product-page/${productId}`}
              style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', display: 'block' }}
              title="1688 상세 페이지"
              onLoad={() => {
                // 로드 완료 후 높이를 자동 조정 (같은 origin이므로 가능)
                try {
                  const body = iframeRef.current?.contentDocument?.body;
                  if (body) {
                    const h = body.scrollHeight;
                    if (h > 400) setIframeHeight(Math.min(h + 40, 6000));
                  }
                } catch {
                  // cross-origin 에러 무시
                }
              }}
            />
            <div className="flex justify-center gap-3 p-3 bg-surface border-t border-border-light">
              <button
                onClick={() => setIframeHeight((h) => Math.max(400, h - 400))}
                className="text-xs text-text-tertiary hover:text-primary px-3 py-1 border border-border rounded"
              >
                높이 줄이기
              </button>
              <button
                onClick={() => setIframeHeight((h) => h + 400)}
                className="text-xs text-text-tertiary hover:text-primary px-3 py-1 border border-border rounded"
              >
                높이 늘리기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
