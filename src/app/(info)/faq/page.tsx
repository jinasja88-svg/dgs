import Breadcrumb from '@/components/ui/Breadcrumb';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { CSFAQ } from '@/types';
import FaqAccordion from './FaqAccordion';

export default async function FaqPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('cs_faqs')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  const faqs = (data || []) as CSFAQ[];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: 'FAQ' }]} />

      <h1 className="text-3xl font-bold text-text-primary mt-6 mb-2">자주 묻는 질문</h1>
      <p className="text-text-tertiary mb-8">딸깍소싱에 대해 궁금한 점을 확인해보세요.</p>

      <FaqAccordion faqs={faqs} />
    </div>
  );
}
