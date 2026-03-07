'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatPrice, formatDate } from '@/lib/utils';
import type { SourcingOrder, SourcingOrderStatus } from '@/types';

const STATUS_OPTIONS: SourcingOrderStatus[] = ['pending', 'paid', 'purchasing', 'shipping', 'delivered', 'cancelled'];

export default function AdminSourcingOrdersPage() {
  const [orders, setOrders] = useState<SourcingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SourcingOrder | null>(null);
  const [newStatus, setNewStatus] = useState<SourcingOrderStatus>('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  const loadOrders = async () => {
    const { data } = await supabase
      .from('sourcing_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as SourcingOrder[]);
  };

  useEffect(() => { loadOrders(); }, []);

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
      .update({
        status: newStatus,
        tracking_number: trackingNumber || null,
        admin_note: adminNote || null,
      })
      .eq('id', selectedOrder.id);

    if (error) {
      toast.error('업데이트 실패');
    } else {
      toast.success('주문이 업데이트되었습니다.');
      setSelectedOrder(null);
      loadOrders();
    }
    setIsUpdating(false);
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">소싱 주문 관리</h1>

      {!orders.length ? (
        <p className="text-text-tertiary text-center py-12">주문이 없습니다.</p>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">주문번호</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">금액</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">날짜</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">운송장</th>
                  <th className="px-4 py-3 text-right font-medium text-text-tertiary">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3"><Badge status={order.status} /></td>
                    <td className="px-4 py-3">{formatPrice(order.total_krw + order.service_fee + order.shipping_fee)}</td>
                    <td className="px-4 py-3 text-text-tertiary">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-text-tertiary">{order.tracking_number || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(order)}>
                        수정
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="주문 수정"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">상태 변경</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as SourcingOrderStatus)}
              className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <Input
            label="운송장 번호"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="운송장 번호 입력"
          />
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">관리자 메모</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>취소</Button>
            <Button onClick={handleUpdate} isLoading={isUpdating}>저장</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
