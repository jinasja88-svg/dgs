/**
 * 채널톡(Channel Talk) 연동 헬퍼.
 * 플러그인 키(NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY)가 없으면 조용히 비활성화되고,
 * 고객센터 버튼은 /contact 폼으로 폴백한다.
 */

export const CHANNEL_TALK_PLUGIN_KEY = process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY || '';

export function isChannelTalkEnabled(): boolean {
  return Boolean(CHANNEL_TALK_PLUGIN_KEY);
}

interface ChannelIOFn {
  (command: string, ...args: unknown[]): void;
  q?: unknown[][];
  c?: (args: unknown[]) => void;
}

declare global {
  interface Window {
    ChannelIO?: ChannelIOFn;
    ChannelIOInitialized?: boolean;
  }
}

/** 고객센터 열기 — 채널톡 메신저, 미설정 시 문의 폼으로 폴백 */
export function openCustomerSupport() {
  if (typeof window === 'undefined') return;
  if (window.ChannelIO) {
    window.ChannelIO('showMessenger');
    return;
  }
  window.location.href = '/contact';
}
