'use client';

import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('reviews')
        .select('*, product:products(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setReviews(data as Review[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (reviewId: string) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      toast.error('삭제에 실패했습니다.');
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success('리뷰가 삭제되었습니다.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: '마이페이지', href: '/mypage' }, { label: '리뷰 관리' }]} />

      <h1 className="text-2xl font-bold text-text-primary mt-6 mb-8">리뷰 관리</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !reviews.length ? (
        <p className="text-text-tertiary text-center py-20">작성한 리뷰가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-border rounded-[var(--radius-md)] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">{(review.product as unknown as { title: string })?.title}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  {review.content && <p className="text-sm text-text-secondary">{review.content}</p>}
                  <p className="text-xs text-text-tertiary mt-2">{formatDate(review.created_at)}</p>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 text-text-tertiary hover:text-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
