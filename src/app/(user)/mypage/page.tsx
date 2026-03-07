'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, User, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Profile, SourcingOrder } from '@/types';

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<SourcingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('sourcing_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (ordersRes.data) setOrders(ordersRes.data as SourcingOrder[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const summaryCards = [
    { icon: ShoppingBag, label: '소싱 주문', value: orders.length, href: '/sourcing-orders' },
    { icon: Package, label: '배송중', value: orders.filter((o) => o.status === 'shipping').length, href: '/sourcing-orders' },
    { icon: Star, label: '완료', value: orders.filter((o) => o.status === 'delivered').length, href: '/sourcing-orders' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">마이페이지</h1>

      {/* Profile summary */}
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-bg rounded-full flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-text-primary">{profile?.name || '사용자'}</h2>
          <p className="text-sm text-text-tertiary">{profile?.email}</p>
        </div>
        <Link
          href="/mypage/profile"
          className="text-sm text-primary hover:underline"
        >
          프로필 수정
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-border rounded-[var(--radius-lg)] p-5 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <card.icon className="w-5 h-5 text-primary" />
              <span className="text-sm text-text-secondary">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">{card.value}</span>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {[
          { label: '소싱 주문 내역', href: '/sourcing-orders' },
          { label: '주문 내역', href: '/mypage/orders' },
          { label: '리뷰 관리', href: '/mypage/reviews' },
          { label: '프로필 설정', href: '/mypage/profile' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-5 py-3.5 bg-white border border-border rounded-[var(--radius-md)] text-sm font-medium text-text-secondary hover:bg-surface hover:text-primary transition-colors"
          >
            {link.label}
            <span className="text-text-tertiary">&rarr;</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <h2 className="font-heading text-lg font-semibold mb-4">최근 소싱 주문</h2>
      {!orders.length ? (
        <p className="text-sm text-text-tertiary py-8 text-center">주문 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {orders.slice(0, 3).map((order) => (
            <Link
              key={order.id}
              href={`/sourcing-orders/${order.id}`}
              className="flex items-center justify-between p-4 bg-white border border-border rounded-[var(--radius-md)] hover:shadow-card-hover transition-shadow"
            >
              <div>
                <p className="text-sm font-medium">{order.order_number}</p>
                <p className="text-xs text-text-tertiary">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{formatPrice(order.total_krw + order.service_fee + order.shipping_fee)}</span>
                <Badge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
