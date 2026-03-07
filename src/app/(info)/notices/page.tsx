import Link from 'next/link';
import { Pin } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { Notice } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '공지사항' };

export default async function NoticesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '공지사항' }]} />

      <h1 className="font-heading text-3xl font-bold text-text-primary mt-6 mb-8">공지사항</h1>

      {!notices?.length ? (
        <p className="text-text-tertiary text-center py-12">등록된 공지사항이 없습니다.</p>
      ) : (
        <div className="bg-white border border-border rounded-[var(--radius-lg)] divide-y divide-border">
          {(notices as Notice[]).map((notice) => (
            <Link
              key={notice.id}
              href={`/notices/${notice.id}`}
              className="flex items-center gap-3 px-6 py-4 hover:bg-surface transition-colors"
            >
              {notice.is_pinned && <Pin className="w-4 h-4 text-primary flex-shrink-0" />}
              <span className="flex-1 text-sm font-medium text-text-primary truncate">
                {notice.title}
              </span>
              <span className="text-xs text-text-tertiary flex-shrink-0">
                {formatDate(notice.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
