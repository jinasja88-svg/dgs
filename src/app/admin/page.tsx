'use client';

import { useEffect, useState } from 'react';
import { Package, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  totalSourcingOrders: number;
  totalOrders: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalSourcingOrders: 0, totalOrders: 0, pendingOrders: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const [usersRes, sourcingRes, ordersRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('sourcing_orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('sourcing_orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalSourcingOrders: sourcingRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingRes.count || 0,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { icon: Users, label: '전체 사용자', value: stats.totalUsers, color: 'bg-blue-50 text-blue-600' },
    { icon: Package, label: '소싱 주문', value: stats.totalSourcingOrders, color: 'bg-purple-50 text-purple-600' },
    { icon: ShoppingBag, label: '일반 주문', value: stats.totalOrders, color: 'bg-green-50 text-green-600' },
    { icon: TrendingUp, label: '대기중 주문', value: stats.pendingOrders, color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">관리자 대시보드</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-text-secondary">{card.label}</span>
            </div>
            <span className="text-3xl font-bold text-text-primary">{card.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">빠른 안내</h2>
        <ul className="text-sm text-text-secondary space-y-2">
          <li>* 소싱 주문 관리에서 주문 상태를 변경하고 운송장을 입력할 수 있습니다.</li>
          <li>* 사용자 관리에서 가입된 사용자 목록을 확인할 수 있습니다.</li>
          <li>* 통계 데이터는 실시간으로 업데이트됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
