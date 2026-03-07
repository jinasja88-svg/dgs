import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { Notice } from '@/types';

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: notice } = await supabase
    .from('notices')
    .select('*')
    .eq('id', id)
    .single();

  if (!notice) notFound();

  const n = notice as Notice;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb
        items={[
          { label: '홈', href: '/' },
          { label: '공지사항', href: '/notices' },
          { label: n.title },
        ]}
      />

      <Link href="/notices" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-primary mt-4 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 목록으로
      </Link>

      <article className="bg-white border border-border rounded-[var(--radius-lg)] p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{n.title}</h1>
        <p className="text-xs text-text-tertiary mb-8">{formatDate(n.created_at)}</p>
        <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-wrap">
          {n.content}
        </div>
      </article>
    </div>
  );
}
