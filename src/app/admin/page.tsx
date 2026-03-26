'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Users, TrendingUp, Clock, Activity, AlertCircle, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatPrice, formatDate, getSourcingStatusLabel } from '@/lib/utils';
import type { SourcingOrder, SourcingOrderStatus } from '@/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: SourcingOrderStatus[] = ['pending', 'paid', 'purchasing', 'shipping', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning',
  paid: 'bg-info',
  purchasing: 'bg-primary',
  shipping: 'bg-secondary',
  delivered: 'bg-success',
  cancelled: 'bg-danger',
};

interface Stats {
  totalSourcingOrders: number;
  monthRevenue: number;
  pendingOrders: number;
  totalUsers: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface ApiSummary {
  total: number;
  errorCount: number;
  avgMs: number;
  byEndpoint: { endpoint: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalSourcingOrders: 0, monthRevenue: 0, pendingOrders: 0, totalUsers: 0 });
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [recentOrders, setRecentOrders] = useState<SourcingOrder[]>([]);
  const [apiSummary, setApiSummary] = useState<ApiSummary>({ total: 0, errorCount: 0, avgMs: 0, byEndpoint: [] });
  const [selectedOrder, setSelectedOrder] = useState<SourcingOrder | null>(null);
  const [newStatus, setNewStatus] = useState<SourcingOrderStatus>('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const supabase = createClient();

  const loadAll = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [usersRes, totalRes, pendingRes, recentRes, monthRes, allStatusRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('sourcing_orders').select('id', { count: 'exact', head: true }),
      supabase.from('sourcing_orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('sourcing_orders').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('sourcing_orders')
        .select('total_krw, service_fee, shipping_fee')
        .gte('created_at', monthStart.toISOString())
        .neq('status', 'cancelled'),
      supabase.from('sourcing_orders').select('status'),
    ]);

    const monthRevenue = (monthRes.data || []).reduce(
      (sum, o) => sum + (o.total_krw || 0) + (o.service_fee || 0) + (o.shipping_fee || 0), 0
    );
    setStats({ totalSourcingOrders: totalRes.count || 0, monthRevenue, pendingOrders: pendingRes.count || 0, totalUsers: usersRes.count || 0 });
    setRecentOrders((recentRes.data || []) as SourcingOrder[]);

    const counts: Record<string, number> = {};
    for (const o of allStatusRes.data || []) counts[o.status] = (counts[o.status] || 0) + 1;
    setStatusCounts(Object.entries(counts).map(([status, count]) => ({ status, count })));

    try {
      const apiRes = await supabase
        .from('api_call_logs')
        .select('endpoint, duration_ms, success')
        .gte('created_at', todayStart.toISOString());
      const logs = apiRes.data || [];
      const total = logs.length;
      const errorCount = logs.filter((l) => !l.success).length;
      const avgMs = total > 0 ? Math.round(logs.reduce((s, l) => s + (l.duration_ms || 0), 0) / total) : 0;
      const epMap: Record<string, number> = {};
      for (const l of logs) epMap[l.endpoint] = (epMap[l.endpoint] || 0) + 1;
      setApiSummary({ total, errorCount, avgMs, byEndpoint: Object.entries(epMap).map(([endpoint, count]) => ({ endpoint, count })) });
    } catch {}
  };

  useEffect(() => { loadAll(); }, []);

  const openEditModal = (order: SourcingOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.tracking_number || '');
    setAdminNote(order.admin_note || '');
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from('sourcing_orders')
      .update({ status: newStatus, tracking_number: trackingNumber || null, admin_note: adminNote || null })
      .eq('id', selectedOrder.id);
    if (error) toast.error('업데이트 실패');
    else { toast.success('주문이 업데이트되었습니다.'); setSelectedOrder(null); loadAll(); }
    setIsUpdating(false);
  };

  const totalStatusCount = statusCounts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">관리자 대시보드</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: '총 소싱 주문', value: `${stats.totalSourcingOrders}건`, color: 'text-primary bg-primary-5' },
          { icon: TrendingUp, label: '이번달 매출', value: formatPrice(stats.monthRevenue), color: 'text-success bg-success/10' },
          { icon: Clock, label: '대기중 주문', value: `${stats.pendingOrders}건`, color: 'text-warning bg-warning/10' },
          { icon: Users, label: '총 회원', value: `${stats.totalUsers}명`, color: 'text-secondary bg-secondary/10' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-text-tertiary">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 상태 분포 + API 현황 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
          <h2 className="text-sm font-semibold text-text-primary mb-4">소싱 주문 상태 분포</h2>
          {statusCounts.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">주문 데이터 없음</p>
          ) : (
            <div className="space-y-2.5">
              {statusCounts.map(({ status, count }) => {
                const pct = totalStatusCount > 0 ? Math.round((count / totalStatusCount) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{getSourcingStatusLabel(status as SourcingOrderStatus)}</span>
                      <span className="text-xs font-medium text-text-primary">{count}건 ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">오늘 API 호출 현황</h2>
            <Link href="/admin/api-monitor" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              상세보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: '총 호출', value: `${apiSummary.total}회` },
              { label: '평균 응답', value: apiSummary.total ? `${apiSummary.avgMs}ms` : '-' },
              { label: '에러', value: `${apiSummary.errorCount}건` },
            ].map((item) => (
              <div key={item.label} className="bg-surface rounded-[var(--radius-md)] p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{item.value}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {apiSummary.byEndpoint.length > 0 ? (
            <div className="space-y-2">
              {apiSummary.byEndpoint.map(({ endpoint, count }) => {
                const pct = apiSummary.total > 0 ? Math.round((count / apiSummary.total) * 100) : 0;
                return (
                  <div key={endpoint} className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary w-24 truncate">{endpoint}</span>
                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-text-primary w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-tertiary text-center py-3">오늘 API 호출 없음</p>
          )}
        </div>
      </div>

      {/* 최근 소싱 주문 */}
      <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h2 className="text-sm font-semibold text-text-primary">최근 소싱 주문</h2>
          <Link href="/admin/sourcing-orders" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            전체보기 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-10">주문이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['주문번호', '상태', '금액', '날짜', '운송장', ''].map((h) => (
                    <th key={h} className={`px-4 py-3 font-medium text-text-tertiary ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3"><Badge status={order.status} /></td>
                    <td className="px-4 py-3">{formatPrice(order.total_krw + order.service_fee + order.shipping_fee)}</td>
                    <td className="px-4 py-3 text-text-tertiary">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-text-tertiary">{order.tracking_number || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="tertiary" onClick={() => openEditModal(order)}>수정</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="주문 수정">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">상태 변경</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as SourcingOrderStatus)}
              className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getSourcingStatusLabel(s)}</option>)}
            </select>
          </div>
          <Input label="운송장 번호" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="운송장 번호 입력" />
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">관리자 메모</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="tertiary" onClick={() => setSelectedOrder(null)}>취소</Button>
            <Button onClick={handleUpdate} isLoading={isUpdating}>저장</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
