'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, cn } from '@/lib/utils';
import type { SourcingProduct } from '@/types';

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);

  const { data: product, isLoading } = useQuery<SourcingProduct>({
    queryKey: ['sourcing-product', productId],
    queryFn: () => fetch(`/api/sourcing/product/${productId}`).then((r) => r.json()),
  });

  const selectedSkuData = product?.skus.find((s) => s.sku_id === selectedSku);
  const currentPrice = selectedSkuData?.price_krw || product?.price_krw || 0;
  const currentPriceCny = selectedSkuData?.price_cny || product?.price_cny || 0;
  const serviceFee = Math.round(currentPrice * quantity * 0.12);
  const shippingFee = 3000;
  const totalPrice = currentPrice * quantity + serviceFee + shippingFee;

  const handleOrder = async () => {
    if (product?.skus.length && !selectedSku) {
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
              product_id: product!.product_id,
              title: product!.title,
              image: product!.images[0] || '',
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (!product || 'error' in product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-text-tertiary mb-4">상품을 찾을 수 없습니다.</p>
        <Link href="/shop" className="text-primary hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: '홈', href: '/' },
          { label: '소싱하기', href: '/shop' },
          { label: product.title },
        ]}
      />

      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-primary mt-4 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 목록으로
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-surface rounded-[var(--radius-lg)] flex items-center justify-center">
          <span className="text-6xl">📦</span>
        </div>

        {/* Info */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">{product.title}</h1>
          {product.title_zh && (
            <p className="text-sm text-text-tertiary mb-4">{product.title_zh}</p>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</span>
            <span className="text-sm text-text-tertiary">¥{currentPriceCny}</span>
          </div>

          {product.seller && (
            <div className="flex items-center gap-4 p-3 bg-surface rounded-[var(--radius-md)] mb-6 text-sm">
              <span className="font-medium">{product.seller.name}</span>
              <span className="text-text-tertiary">⭐ {product.seller.rating}</span>
              <span className="text-text-tertiary">{product.seller.years}년</span>
              <span className="text-text-tertiary">{product.seller.location}</span>
            </div>
          )}

          {/* SKU Selection */}
          {product.skus.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-text-primary mb-2 block">옵션 선택</label>
              <div className="flex flex-wrap gap-2">
                {product.skus.map((sku) => (
                  <button
                    key={sku.sku_id}
                    onClick={() => setSelectedSku(sku.sku_id)}
                    className={cn(
                      'px-4 py-2 border rounded-[var(--radius-md)] text-sm transition-colors',
                      selectedSku === sku.sku_id
                        ? 'border-primary bg-primary-bg text-primary font-medium'
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
                onClick={() => setQuantity(Math.max(product.min_order || 1, quantity - 1))}
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
              {product.min_order && product.min_order > 1 && (
                <span className="text-xs text-text-tertiary">최소 주문: {product.min_order}개</span>
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

          <Button
            onClick={handleOrder}
            isLoading={isOrdering}
            size="lg"
            className="w-full"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            소싱 주문하기
          </Button>
        </div>
      </div>
    </div>
  );
}
