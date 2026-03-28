'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { Profile, SourcingCategory } from '@/types';

const MAX_PREFERRED = 5;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const supabase = createClient();

  const { data: categories } = useQuery<SourcingCategory[]>({
    queryKey: ['sourcing-categories'],
    queryFn: () => fetch('/api/sourcing/categories').then((r) => r.json()),
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadError('로그인이 필요합니다.'); return; }

      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (!data) {
        const res = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        }).select().single();
        data = res.data;
        error = res.error;
      }

      if (error && !data) {
        setLoadError(`프로필 로드 실패: ${error.message}`);
        return;
      }
      if (data) {
        const p = data as Profile;
        setProfile(p);
        setName(p.name || '');
        setPhone(p.phone || '');
        setPreferredCategories(p.preferred_categories || []);
      }
    }
    load();
  }, []);

  const toggleCategory = (catName: string) => {
    setPreferredCategories((prev) => {
      if (prev.includes(catName)) return prev.filter((c) => c !== catName);
      if (prev.length >= MAX_PREFERRED) {
        toast.error(`최대 ${MAX_PREFERRED}개까지 선택할 수 있습니다`);
        return prev;
      }
      return [...prev, catName];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error('프로필이 아직 로드되지 않았습니다.');
      return;
    }
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ name, phone, preferred_categories: preferredCategories })
      .eq('id', profile.id);

    if (error) {
      toast.error(`저장 실패: ${error.message}`);
    } else {
      toast.success('프로필이 저장되었습니다.');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: '마이페이지', href: '/mypage' }, { label: '프로필 편집' }]} />

      <h1 className="text-2xl font-bold text-text-primary mt-6 mb-8">프로필 편집</h1>

      {loadError && (
        <div className="mb-6 p-3 bg-danger-5 border border-danger/20 rounded-[var(--radius-md)] text-sm text-danger">
          {loadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="이메일" value={profile?.email || ''} disabled />
        <Input
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
        />
        <Input
          label="연락처"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
        />

        {/* 취향 카테고리 */}
        {categories && categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              관심 카테고리
              <span className="ml-1.5 text-xs font-normal text-text-tertiary">
                ({preferredCategories.length}/{MAX_PREFERRED}) — 선택한 카테고리가 쇼핑 홈 상단에 표시됩니다
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = preferredCategories.includes(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-text-secondary hover:border-primary hover:text-primary'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isSaving} className="w-full">
          저장하기
        </Button>
      </form>
    </div>
  );
}
