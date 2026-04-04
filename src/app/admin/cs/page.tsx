'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  formatDate,
  getCSInquiryStatusLabel,
  getCSReturnStatusLabel,
  getCSInquiryCategoryLabel,
  getCSReturnReasonLabel,
  getCSReturnTypeLabel,
} from '@/lib/utils';
import type {
  CSInquiry,
  CSReturn,
  CSInquiryStatus,
  CSInquiryCategory,
  CSReturnStatus,
} from '@/types';

const INQUIRY_STATUS_OPTIONS: CSInquiryStatus[] = ['open', 'in_progress', 'answered', 'closed'];
const INQUIRY_CATEGORY_OPTIONS: CSInquiryCategory[] = ['order', 'shipping', 'return', 'product', 'payment', 'other'];
const RETURN_STATUS_OPTIONS: CSReturnStatus[] = ['requested', 'reviewing', 'approved', 'rejected', 'completed'];

export default function AdminCSPage() {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'returns'>('inquiries');

  // Data
  const [inquiries, setInquiries] = useState<CSInquiry[]>([]);
  const [returns, setReturns] = useState<CSReturn[]>([]);

  // Selected items
  const [selectedInquiry, setSelectedInquiry] = useState<CSInquiry | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<CSReturn | null>(null);

  // Filter state
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<CSInquiryStatus | ''>('');
  const [inquiryCategoryFilter, setInquiryCategoryFilter] = useState<CSInquiryCategory | ''>('');
  const [returnStatusFilter, setReturnStatusFilter] = useState<CSReturnStatus | ''>('');

  // Inquiry modal fields
  const [replyText, setReplyText] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<CSInquiryStatus>('open');

  // Return modal fields
  const [returnStatus, setReturnStatus] = useState<CSReturnStatus>('requested');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);

  const loadInquiries = async () => {
    const params = new URLSearchParams();
    if (inquiryStatusFilter) params.set('status', inquiryStatusFilter);
    if (inquiryCategoryFilter) params.set('category', inquiryCategoryFilter);
    const res = await fetch(`/api/admin/cs/inquiries?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setInquiries(json.data ?? []);
    }
  };

  const loadReturns = async () => {
    const params = new URLSearchParams();
    if (returnStatusFilter) params.set('status', returnStatusFilter);
    const res = await fetch(`/api/admin/cs/returns?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setReturns(json.data ?? []);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [inquiryStatusFilter, inquiryCategoryFilter]);

  useEffect(() => {
    loadReturns();
  }, [returnStatusFilter]);

  const openInquiryModal = (inquiry: CSInquiry) => {
    setSelectedInquiry(inquiry);
    setInquiryStatus(inquiry.status);
    setReplyText(inquiry.admin_reply || '');
  };

  const openReturnModal = (ret: CSReturn) => {
    setSelectedReturn(ret);
    setReturnStatus(ret.status);
    setRefundAmount(ret.refund_amount != null ? String(ret.refund_amount) : '');
    setAdminNote(ret.admin_note || '');
  };

  const handleInquiryUpdate = async () => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/cs/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInquiry.id,
          status: inquiryStatus,
          admin_reply: replyText,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('문의가 업데이트되었습니다.');
      setSelectedInquiry(null);
      loadInquiries();
    } catch {
      toast.error('업데이트 실패');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReturnUpdate = async () => {
    if (!selectedReturn) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/cs/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReturn.id,
          status: returnStatus,
          refund_amount: refundAmount ? Number(refundAmount) : null,
          admin_note: adminNote || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('반품/교환이 업데이트되었습니다.');
      setSelectedReturn(null);
      loadReturns();
    } catch {
      toast.error('업데이트 실패');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">CS 관리</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface rounded-[var(--radius-lg)] w-fit mb-6">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={
            activeTab === 'inquiries'
              ? 'bg-white shadow-sm text-primary px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-medium'
              : 'px-4 py-1.5 text-sm text-text-secondary'
          }
        >
          문의{inquiries.length > 0 && ` (${inquiries.length})`}
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={
            activeTab === 'returns'
              ? 'bg-white shadow-sm text-primary px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-medium'
              : 'px-4 py-1.5 text-sm text-text-secondary'
          }
        >
          반품/교환{returns.length > 0 && ` (${returns.length})`}
        </button>
      </div>

      {/* Inquiries tab */}
      {activeTab === 'inquiries' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={inquiryStatusFilter}
              onChange={(e) => setInquiryStatusFilter(e.target.value as CSInquiryStatus | '')}
              className="px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="">전체 상태</option>
              {INQUIRY_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{getCSInquiryStatusLabel(s)}</option>
              ))}
            </select>
            <select
              value={inquiryCategoryFilter}
              onChange={(e) => setInquiryCategoryFilter(e.target.value as CSInquiryCategory | '')}
              className="px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="">전체 카테고리</option>
              {INQUIRY_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{getCSInquiryCategoryLabel(c)}</option>
              ))}
            </select>
            <span className="text-sm text-text-tertiary self-center">{inquiries.length}건</span>
          </div>

          {!inquiries.length ? (
            <p className="text-text-tertiary text-center py-12">문의가 없습니다.</p>
          ) : (
            <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">번호</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">고객</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">카테고리</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">제목</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">상태</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">날짜</th>
                      <th className="px-4 py-3 text-right font-medium text-text-tertiary">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {inquiries.map((inquiry, index) => (
                      <tr key={inquiry.id} className="hover:bg-surface/50">
                        <td className="px-4 py-3 text-text-tertiary">{index + 1}</td>
                        <td className="px-4 py-3">
                          {inquiry.profile?.name || inquiry.profile?.email || '알수없음'}
                        </td>
                        <td className="px-4 py-3">{getCSInquiryCategoryLabel(inquiry.category)}</td>
                        <td className="px-4 py-3">
                          {inquiry.title.length > 30 ? inquiry.title.slice(0, 30) + '...' : inquiry.title}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={inquiry.status} />
                        </td>
                        <td className="px-4 py-3 text-text-tertiary">{formatDate(inquiry.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="tertiary" onClick={() => openInquiryModal(inquiry)}>
                            답변
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Returns tab */}
      {activeTab === 'returns' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={returnStatusFilter}
              onChange={(e) => setReturnStatusFilter(e.target.value as CSReturnStatus | '')}
              className="px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="">전체 상태</option>
              {RETURN_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{getCSReturnStatusLabel(s)}</option>
              ))}
            </select>
            <span className="text-sm text-text-tertiary self-center">{returns.length}건</span>
          </div>

          {!returns.length ? (
            <p className="text-text-tertiary text-center py-12">반품/교환 신청이 없습니다.</p>
          ) : (
            <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">번호</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">고객</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">유형</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">사유</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">상태</th>
                      <th className="px-4 py-3 text-left font-medium text-text-tertiary">날짜</th>
                      <th className="px-4 py-3 text-right font-medium text-text-tertiary">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {returns.map((ret, index) => (
                      <tr key={ret.id} className="hover:bg-surface/50">
                        <td className="px-4 py-3 text-text-tertiary">{index + 1}</td>
                        <td className="px-4 py-3">
                          {ret.profile?.name || ret.profile?.email || '알수없음'}
                        </td>
                        <td className="px-4 py-3">{getCSReturnTypeLabel(ret.return_type)}</td>
                        <td className="px-4 py-3">{getCSReturnReasonLabel(ret.reason)}</td>
                        <td className="px-4 py-3">
                          <Badge status={ret.status} />
                        </td>
                        <td className="px-4 py-3 text-text-tertiary">{formatDate(ret.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="tertiary" onClick={() => openReturnModal(ret)}>
                            처리
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inquiry reply modal */}
      <Modal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        title="문의 답변"
        size="lg"
      >
        {selectedInquiry && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1.5">문의 내용</p>
              <div className="px-3 py-2.5 bg-surface border border-border rounded-[var(--radius-md)] text-sm text-text-secondary whitespace-pre-wrap">
                {selectedInquiry.content}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">상태</label>
              <select
                value={inquiryStatus}
                onChange={(e) => setInquiryStatus(e.target.value as CSInquiryStatus)}
                className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {INQUIRY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{getCSInquiryStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">답변 내용</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                placeholder="답변을 입력하세요..."
                className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => setSelectedInquiry(null)}>취소</Button>
              <Button onClick={handleInquiryUpdate} isLoading={isUpdating}>저장</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return processing modal */}
      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title="반품/교환 처리"
        size="lg"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1.5">반품 상세 내용</p>
              <div className="px-3 py-2.5 bg-surface border border-border rounded-[var(--radius-md)] text-sm text-text-secondary whitespace-pre-wrap">
                {selectedReturn.detail}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">상태</label>
              <select
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value as CSReturnStatus)}
                className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {RETURN_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{getCSReturnStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">환불 금액 (KRW)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="환불 금액 입력"
                min={0}
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">관리자 메모</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="관리자 메모를 입력하세요..."
                className="w-full px-3 py-2.5 border border-border rounded-[var(--radius-md)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => setSelectedReturn(null)}>취소</Button>
              <Button onClick={handleReturnUpdate} isLoading={isUpdating}>저장</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
