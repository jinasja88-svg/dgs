'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice, formatDate, getSourcingStatusLabel } from '@/lib/utils';
import type { SourcingOrderStatus } from '@/types';

interface SettlementSummary {
  total_orders: number;
  total_krw: number;
  total_service_fee: number;
  cancelled_krw: number;
  delivered_count: number;
}

interface SettlementData {
  year: number;
  month: number;
  summary: SettlementSummary;
  by_status: Record<string, { count: number; total_krw: number }>;
  recent_delivered: Array<{
    id: string;
    order_number: string;
    user_id: string;
    total_krw: number;
    service_fee: number;
    created_at: string;
  }>;
}

export default function AdminSettlementPage() {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [data, setData] = useState<SettlementData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/settlement?year=${year}&month=${month}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [year, month]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const summary = data?.summary ?? {
    total_orders: 0,
    total_krw: 0,
    total_service_fee: 0,
    cancelled_krw: 0,
    delivered_count: 0,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">정산 관리</h1>

      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-[var(--radius-md)] border border-border hover:bg-surface transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <span className="text-base font-semibold text-text-primary w-28 text-center">
          {year}년 {month}월
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-[var(--radius-md)] border border-border hover:bg-surface transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
          <p className="text-xs text-text-tertiary mb-1">총 주문 금액</p>
          <p className="text-lg font-bold text-text-primary">
            {isLoading ? '—' : formatPrice(summary.total_krw)}
          </p>
        </div>
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
          <p className="text-xs text-text-tertiary mb-1">서비스 수수료</p>
          <p className="text-lg font-bold text-text-primary">
            {isLoading ? '—' : formatPrice(summary.total_service_fee)}
          </p>
        </div>
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
          <p className="text-xs text-text-tertiary mb-1">취소 금액</p>
          <p className="text-lg font-bold text-text-primary">
            {isLoading ? '—' : formatPrice(summary.cancelled_krw)}
          </p>
        </div>
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
          <p className="text-xs text-text-tertiary mb-1">완료 주문 수</p>
          <p className="text-lg font-bold text-text-primary">
            {isLoading ? '—' : `${summary.delivered_count}건`}
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">상태별 현황</h2>
        {!data || Object.keys(data.by_status).length === 0 ? (
          <p className="text-text-tertiary text-sm text-center py-6">데이터가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">주문 수</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">총 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {Object.entries(data.by_status).map(([status, info]) => (
                  <tr key={status} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      {getSourcingStatusLabel(status as SourcingOrderStatus)}
                    </td>
                    <td className="px-4 py-3">{info.count}건</td>
                    <td className="px-4 py-3">{formatPrice(info.total_krw)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent delivered orders */}
      <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">최근 완료 주문</h2>
        {!data || data.recent_delivered.length === 0 ? (
          <p className="text-text-tertiary text-sm text-center py-6">완료된 주문이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">주문번호</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">상품금액</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">수수료</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {data.recent_delivered.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3">{formatPrice(order.total_krw)}</td>
                    <td className="px-4 py-3">{formatPrice(order.service_fee)}</td>
                    <td className="px-4 py-3 text-text-tertiary">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
