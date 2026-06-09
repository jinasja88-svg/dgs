/**
 * 자체 실시간 고객센터 채팅 — 열기 트리거.
 * 사이드바/푸터의 "고객센터" 버튼이 이 이벤트를 dispatch 하고,
 * 전역 SupportChatWidget 이 수신해 패널을 연다.
 */
export const SUPPORT_CHAT_OPEN_EVENT = 'open-support-chat';

export function openSupportChat() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SUPPORT_CHAT_OPEN_EVENT));
}
