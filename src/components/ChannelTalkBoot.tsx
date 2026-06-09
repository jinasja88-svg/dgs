'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CHANNEL_TALK_PLUGIN_KEY } from '@/lib/channel-talk';

/**
 * 채널톡 SDK 부트 — 전역 마운트.
 * 플러그인 키가 없으면 아무것도 로드하지 않는다(조용히 비활성화).
 * 로그인 사용자는 프로필 정보를 채널톡에 전달해 관리자 응대 컨텍스트를 제공.
 */
export default function ChannelTalkBoot() {
  useEffect(() => {
    if (!CHANNEL_TALK_PLUGIN_KEY) return;

    // 공식 로더 (중복 로드 방지)
    if (!window.ChannelIO) {
      const queue: unknown[][] = [];
      const ch = ((...args: unknown[]) => {
        queue.push(args);
      }) as Window['ChannelIO'] & { q: unknown[][]; c: (a: unknown[]) => void };
      ch.q = queue;
      ch.c = (args: unknown[]) => queue.push(args);
      window.ChannelIO = ch;

      if (!window.ChannelIOInitialized) {
        window.ChannelIOInitialized = true;
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
        const x = document.getElementsByTagName('script')[0];
        x.parentNode?.insertBefore(s, x);
      }
    }

    window.ChannelIO?.('boot', { pluginKey: CHANNEL_TALK_PLUGIN_KEY });

    // 로그인 사용자 컨텍스트 연동
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user && window.ChannelIO) {
        window.ChannelIO('updateUser', {
          profile: {
            email: user.email,
            name: user.user_metadata?.name || user.email,
          },
        });
      }
    });

    return () => {
      window.ChannelIO?.('shutdown');
    };
  }, []);

  return null;
}
