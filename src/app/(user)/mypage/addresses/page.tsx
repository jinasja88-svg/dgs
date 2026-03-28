'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface ShippingAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  address_detail: string | null;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  label: '',
  recipient: '',
  phone: '',
  address: '',
  address_detail: '',
  postal_code: '',
  is_default: false,
};

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: addresses = [], isLoading } = useQuery<ShippingAddress[]>({
    queryKey: ['shipping-addresses'],
    queryFn: () => fetch('/api/addresses').then((r) => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) =>
      fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || '저장 실패');
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('배송지가 추가되었습니다');
      setShowModal(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('배송지가 삭제되었습니다');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !form.recipient || !form.phone || !form.address) {
      toast.error('필수 항목을 모두 입력해주세요');
      return;
    }
    addMutation.mutate(form);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: '마이페이지', href: '/mypage' }, { label: '배송지 관리' }]} />

      <div className="flex items-center justify-between mt-6 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">배송지 관리</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-[var(--radius-lg)] animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <p className="mb-4">등록된 배송지가 없습니다</p>
          <Button onClick={() => setShowModal(true)}>배송지 추가</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border rounded-[var(--radius-lg)] p-5 ${
                addr.is_default ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[10px] font-bold text-primary bg-primary-5 px-2 py-0.5 rounded-full">
                      기본
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!addr.is_default && (
                    <button
                      onClick={() => setDefaultMutation.mutate(addr.id)}
                      className="text-text-tertiary hover:text-primary transition-colors"
                      title="기본 배송지로 설정"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(addr.id)}
                    className="text-text-tertiary hover:text-danger transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{addr.recipient} · {addr.phone}</p>
              <p className="text-sm text-text-secondary mt-0.5">
                {addr.postal_code && `(${addr.postal_code}) `}{addr.address}
                {addr.address_detail && ` ${addr.address_detail}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }} title="배송지 추가">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="배송지 이름"
            placeholder="예: 집, 회사"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <Input
            label="받는 분"
            placeholder="이름"
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
          />
          <Input
            label="연락처"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="우편번호"
            placeholder="12345"
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          />
          <Input
            label="주소"
            placeholder="도로명 주소"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="상세 주소"
            placeholder="동/호수"
            value={form.address_detail}
            onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="rounded"
            />
            기본 배송지로 설정
          </label>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={addMutation.isPending}>
              저장
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
