'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Headphones, X, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SUPPORT_CHAT_OPEN_EVENT } from '@/lib/support-chat';
import type { User } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  body: string;
  created_at: string;
}

/**
 * 자체 실시간 고객센터 채팅 위젯 (전역 플로팅).
 * Supabase Realtime 으로 관리자 답변을 실시간 수신. 로그인 사용자 전용
 * (비로그인 시 로그인 안내 → /contact 폼 폴백 가능).
 */
export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  // 인증 상태
  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 외부 트리거(사이드바/푸터 "고객센터" 버튼)로 열기
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(SUPPORT_CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(SUPPORT_CHAT_OPEN_EVENT, handler);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  // 대화방 확보 + 메시지 로드 + 실시간 구독 (열렸고 로그인된 경우)
  useEffect(() => {
    if (!open || !user) return;
    const supabase = supabaseRef.current;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // open 대화방 확보
      let convId: string | null = null;
      const { data: existing } = await supabase
        .from('cs_chat_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .limit(1)
        .maybeSingle();
      if (existing) {
        convId = existing.id;
      } else {
        const { data: created } = await supabase
          .from('cs_chat_conversations')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        convId = created?.id ?? null;
      }
      if (!active || !convId) return;
      setConversationId(convId);

      // 기존 메시지 로드
      const { data: msgs } = await supabase
        .from('cs_chat_messages')
        .select('id, conversation_id, sender, body, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (!active) return;
      setMessages((msgs as ChatMessage[]) ?? []);
      scrollToBottom();

      // 미읽음 초기화(고객)
      await supabase.from('cs_chat_conversations').update({ unread_user: 0 }).eq('id', convId);

      // 실시간 구독
      channel = supabase
        .channel(`cs_chat:${convId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'cs_chat_messages', filter: `conversation_id=eq.${convId}` },
          (payload) => {
            const m = payload.new as ChatMessage;
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
            scrollToBottom();
          }
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, user, scrollToBottom]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body || !conversationId || !user || sending) return;
    setSending(true);
    setInput('');
    const { error } = await supabaseRef.current.from('cs_chat_messages').insert({
      conversation_id: conversationId,
      sender: 'user',
      sender_id: user.id,
      body,
    });
    if (error) setInput(body); // 실패 시 복구
    setSending(false);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="고객센터 채팅"
        className="fixed right-4 bottom-20 md:bottom-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-60 transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
      </button>

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed right-4 bottom-36 md:bottom-24 z-50 w-[calc(100vw-2rem)] max-w-[360px] h-[480px] max-h-[70vh] bg-white border border-hairline rounded-[var(--radius-lg)] shadow-xl flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              <span className="text-sm font-semibold">고객센터</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="닫기">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 본문 */}
          {!authChecked ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted">불러오는 중...</div>
          ) : !user ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-ink">실시간 상담은 로그인 후 이용할 수 있어요.</p>
              <Link
                href="/login?redirect=/shop"
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
              >
                로그인하기
              </Link>
              <Link href="/contact" className="text-xs text-muted hover:text-primary">
                또는 문의 폼으로 남기기
              </Link>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-surface">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-muted py-6">
                    무엇을 도와드릴까요? 메시지를 남겨주시면 순차적으로 답변드립니다.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={m.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={
                          'max-w-[78%] px-3 py-2 rounded-[var(--radius-md)] text-sm whitespace-pre-wrap break-words ' +
                          (m.sender === 'user'
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-white border border-hairline text-ink rounded-bl-sm')
                        }
                      >
                        {m.body}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 입력 */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 p-2.5 border-t border-hairline flex-shrink-0"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 px-3 py-2 border border-hairline rounded-full text-sm focus:outline-none focus:border-ink bg-canvas"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-60 transition-colors flex-shrink-0"
                  aria-label="전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
