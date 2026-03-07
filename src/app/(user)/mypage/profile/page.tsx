'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const supabase = createClient();

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
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error('프로필이 아직 로드되지 않았습니다.');
      return;
    }
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ name, phone })
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
        <Button type="submit" isLoading={isSaving} className="w-full">
          저장하기
        </Button>
      </form>
    </div>
  );
}
