'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getCart, updateCartQty, removeFromCart, clearCart } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import type { SourcingCartItem } from '@/types';

const SERVICE_FEE_RATE = 0.12;
const SHIPPING_FEE = 3000;

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<SourcingCartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  const reload = useCallback(() => setItems(getCart()), []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleQty = (item: SourcingCartItem, delta: number) => {
    const min = item.min_order || 1;
    const next = item.quantity + delta;
    if (next < min) return;
    updateCartQty(item.product_id, item.sku_id, next);
    reload();
  };

  const handleRemove = (item: SourcingCartItem) => {
    removeFromCart(item.product_id, item.sku_id);
    reload();
  };

  const handleClear = () => {
    clearCart();
    reload();
  };

  const subtotal = items.reduce((s, i) => s + i.price_krw * i.quantity, 0);
  const subtotalCny = items.reduce((s, i) => s + i.price_cny * i.quantity, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee + SHIPPING_FEE;

  const handleOrder = async () => {
    if (items.length === 0) return;
    setIsOrdering(true);
    try {
      const res = await fetch('/api/sourcing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            title: i.title,
            image: i.image,
            sku_name: i.sku_name,
            quantity: i.quantity,
            price_cny: i.price_cny,
            price_krw: i.price_krw,
          })),
          total_cny: subtotalCny,
          total_krw: subtotal,
          service_fee: serviceFee,
          shipping_fee: SHIPPING_FEE,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '주문 생성에 실패했습니다.' }));
        toast.error(err.error || '주문 생성에 실패했습니다.');
        return;
      }

      const order = await res.json();
      clearCart();
      reload();
      // 결제 페이지로 이동 (Toss 연동 시 결제 진행, 미연동 시 안내 표시)
      router.push(`/checkout?orderId=${order.order_number}`);
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">장바구니가 비어있습니다</h2>
        <p className="text-sm text-text-tertiary mb-6">마음에 드는 상품을 담아보세요</p>
        <Link href="/shop">
          <Button>쇼핑 계속하기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/shop" className="text-text-tertiary hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">
            장바구니 <span className="text-primary">{items.length}</span>
          </h1>
        </div>
        <button
          onClick={handleClear}
          className="text-sm text-text-tertiary hover:text-danger transition-colors"
        >
          전체 삭제
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* 상품 목록 */}
        <div className="lg:col-span-2 space-y-3 mb-6 lg:mb-0">
          {items.map((item) => {
            const key = item.product_id + (item.sku_id || '');
            return (
              <div key={key} className="bg-white border border-border rounded-[var(--radius-lg)] p-4 flex gap-4">
                <div className="w-16 h-16 bg-surface rounded-[var(--radius-md)] flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <Image
                      src={`/api/image-proxy?url=${encodeURIComponent(item.image)}`}
                      alt={item.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary line-clamp-2 mb-1">{item.title}</p>
                  {item.sku_name && (
                    <p className="text-xs text-text-tertiary">{item.sku_name}</p>
                  )}
                  {item.min_order && item.min_order > 1 && (
                    <p className="text-xs text-warning mb-2">최소 주문 {item.min_order}개</p>
                  )}
                  <div className="flex items-center justify-between">
                    {/* 수량 조절 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQty(item, -1)}
                        disabled={item.quantity <= (item.min_order || 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-surface disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQty(item, 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-surface transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 가격 + 삭제 */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">
                          {formatPrice(item.price_krw * item.quantity)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          ¥{(item.price_cny * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-text-tertiary hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 결제 요약 */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-[var(--radius-lg)] p-5 sticky top-4">
            <h2 className="text-sm font-semibold mb-4">결제 요약</h2>
            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">상품 금액</span>
                <div className="text-right">
                  <p>{formatPrice(subtotal)}</p>
                  <p className="text-xs text-text-tertiary">¥{subtotalCny.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">서비스 수수료 (12%)</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">배송비</span>
                <span>{formatPrice(SHIPPING_FEE)}</span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between font-bold text-base">
                <span>총 결제 금액</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleOrder}
              isLoading={isOrdering}
            >
              주문하기
            </Button>
            <Link href="/shop" className="block text-center text-xs text-text-tertiary hover:text-primary mt-3 transition-colors">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
