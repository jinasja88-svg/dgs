'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { formatDate, getPlanLabel } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Profile } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setUsers(data as Profile[]);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">사용자 관리</h1>

      {!users.length ? (
        <p className="text-text-tertiary text-center py-12">사용자가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">이메일</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">이름</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">플랜</th>
                  <th className="px-4 py-3 text-left font-medium text-text-tertiary">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-bg text-primary">
                        {getPlanLabel(user.subscription_plan)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-tertiary">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
