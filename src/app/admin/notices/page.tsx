'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import type { Notice } from '@/types';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function loadNotices() {
    const res = await fetch('/api/admin/notices');
    if (res.ok) {
      const json = await res.json();
      setNotices(json);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  function openCreateModal() {
    setEditingNotice(null);
    setFormTitle('');
    setFormContent('');
    setFormIsPinned(false);
    setIsModalOpen(true);
  }

  function openEditModal(notice: Notice) {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormIsPinned(notice.is_pinned);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingNotice(null);
  }

  async function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const body = { title: formTitle, content: formContent, is_pinned: formIsPinned };

      let res: Response;
      if (editingNotice) {
        res = await fetch(`/api/admin/notices/${editingNotice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/admin/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) throw new Error();

      toast.success(editingNotice ? '공지가 수정되었습니다.' : '공지가 등록되었습니다.');
      closeModal();
      loadNotices();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('공지가 삭제되었습니다.');
      loadNotices();
    } catch {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">공지 관리</h1>
        <Button onClick={openCreateModal}>공지 작성</Button>
      </div>

      {!notices.length ? (
        <p className="text-text-tertiary text-center py-12">등록된 공지가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">제목</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">고정 여부</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">날짜</th>
                  <th className="px-4 py-3 text-right font-medium text-text-tertiary">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{notice.title}</td>
                    <td className="px-4 py-3">
                      {notice.is_pinned ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-primary">
                          📌 고정
                        </span>
                      ) : (
                        <span className="text-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-tertiary">{formatDate(notice.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="tertiary"
                          onClick={() => openEditModal(notice)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={isDeleting === notice.id}
                          onClick={() => handleDelete(notice.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        size="lg"
        title={editingNotice ? '공지 수정' : '공지 작성'}
      >
        <div className="space-y-4">
          <Input
            label="제목"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="공지 제목 입력"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">내용</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={8}
              placeholder="공지 내용 입력"
              className="w-full px-4 py-2.5 border border-border rounded-[var(--radius-md)] text-[15px] text-text-primary bg-white resize-none transition-colors placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formIsPinned}
              onChange={(e) => setFormIsPinned(e.target.checked)}
            />
            상단 고정
          </label>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="tertiary" onClick={closeModal}>
              취소
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              저장
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
