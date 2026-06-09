'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_admin: number;
  profile: { name: string | null; email: string | null };
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  body: string;
  created_at: string;
}

const LIST_POLL_MS = 4000;
const MSG_POLL_MS = 3000;

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {}
  }, []);

  const loadMessages = useCallback(
    async (convId: string, scroll = false) => {
      try {
        const res = await fetch(`/api/admin/chat?conversation_id=${convId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setMessages((prev) => {
          const next = (data.messages as ChatMessage[]) ?? [];
          if (prev.length !== next.length) {
            if (scroll || next.length > prev.length) scrollToBottom();
            return next;
          }
          return prev;
        });
      } catch {}
    },
    [scrollToBottom]
  );

  // 대화 목록 폴링
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, LIST_POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // 선택 대화 메시지 폴링
  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId, true);
    const t = setInterval(() => loadMessages(selectedId), MSG_POLL_MS);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedId, body: text }),
      });
      if (res.ok) {
        const m = (await res.json()) as ChatMessage;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        scrollToBottom();
        loadConversations();
      } else {
        setInput(text);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const label = (c: Conversation) =>
    c.profile.name || c.profile.email || `사용자 ${c.user_id.slice(0, 8)}`;
  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-1">실시간 상담</h1>
      <p className="text-sm text-text-tertiary mb-5">고객 문의에 실시간으로 응대합니다. (자동 새로고침)</p>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[420px]">
        {/* 대화 목록 */}
        <div className="bg-white border border-border rounded-[var(--radius-lg)] overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-10">아직 문의가 없습니다.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setMessages([]); }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border-light hover:bg-surface transition-colors',
                  selectedId === c.id && 'bg-primary-5'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">{label(c)}</span>
                  {c.unread_admin > 0 && selectedId !== c.id && (
                    <span className="flex-shrink-0 min-w-5 h-5 px-1.5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {c.unread_admin}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-tertiary truncate">ID: {c.user_id}</p>
                {c.profile.email && c.profile.name && (
                  <p className="text-[11px] text-text-tertiary truncate">{c.profile.email}</p>
                )}
                <p className="text-xs text-text-tertiary truncate mt-0.5">{c.last_message || '—'}</p>
              </button>
            ))
          )}
        </div>

        {/* 메시지 스레드 */}
        <div className="bg-white border border-border rounded-[var(--radius-lg)] flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary gap-2">
              <MessagesSquare className="w-8 h-8" />
              <p className="text-sm">왼쪽에서 대화를 선택하세요.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3 bg-white flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {selectedConversation ? label(selectedConversation) : '고객 대화'}
                    </p>
                    {selectedConversation && (
                      <p className="text-[11px] text-text-tertiary truncate">
                        ID: {selectedConversation.user_id}
                      </p>
                    )}
                  </div>
                  {selectedConversation?.unread_admin ? (
                    <span className="flex-shrink-0 min-w-5 h-5 px-1.5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {selectedConversation.unread_admin}
                    </span>
                  ) : null}
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-surface">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-text-tertiary py-6">메시지를 불러오는 중...</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={m.sender === 'admin' ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        className={cn(
                          'max-w-[70%] px-3 py-2 rounded-[var(--radius-md)] text-sm whitespace-pre-wrap break-words',
                          m.sender === 'admin'
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-surface-strong text-ink rounded-bl-sm'
                        )}
                      >
                        {m.body}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 p-3 border-t border-border flex-shrink-0"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="답변을 입력하세요"
                  className="flex-1 px-3 py-2 border border-hairline rounded-full text-sm focus:outline-none focus:border-ink bg-canvas"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-60 transition-colors flex-shrink-0"
                  aria-label="전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
