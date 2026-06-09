'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, MessagesSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_admin: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  body: string;
  created_at: string;
}

export default function AdminChatPage() {
  const supabaseRef = useRef(createClient());
  const [admin, setAdmin] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string; name: string | null }>>({});
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
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from('cs_chat_conversations')
      .select('id, user_id, status, last_message, last_message_at, unread_admin')
      .order('last_message_at', { ascending: false });
    const list = (data as Conversation[]) ?? [];
    setConversations(list);

    // 사용자 프로필(이메일/이름) 매핑 — RLS 로 일부만 보일 수 있음(없으면 id 폴백)
    const ids = Array.from(new Set(list.map((c) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', ids);
      const map: Record<string, { email: string; name: string | null }> = {};
      for (const p of profs ?? []) map[p.id] = { email: p.email, name: p.name };
      setProfiles(map);
    }
  }, []);

  // 초기 로드 + 대화방 실시간 갱신
  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getUser().then(({ data }) => setAdmin(data.user));
    loadConversations();

    const channel = supabase
      .channel('admin:cs_chat_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_chat_conversations' }, () => {
        loadConversations();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  // 선택 대화방 메시지 로드 + 실시간 구독
  useEffect(() => {
    if (!selectedId) return;
    const supabase = supabaseRef.current;
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('cs_chat_messages')
        .select('id, conversation_id, sender, body, created_at')
        .eq('conversation_id', selectedId)
        .order('created_at', { ascending: true });
      if (!active) return;
      setMessages((data as ChatMessage[]) ?? []);
      scrollToBottom();
      await supabase.from('cs_chat_conversations').update({ unread_admin: 0 }).eq('id', selectedId);
    })();

    const channel = supabase
      .channel(`admin:cs_chat:${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cs_chat_messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [selectedId, scrollToBottom]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body || !selectedId || !admin || sending) return;
    setSending(true);
    setInput('');
    const { error } = await supabaseRef.current.from('cs_chat_messages').insert({
      conversation_id: selectedId,
      sender: 'admin',
      sender_id: admin.id,
      body,
    });
    if (error) setInput(body);
    setSending(false);
  };

  const label = (c: Conversation) => {
    const p = profiles[c.user_id];
    return p?.name || p?.email || `사용자 ${c.user_id.slice(0, 8)}`;
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-1">실시간 상담</h1>
      <p className="text-sm text-text-tertiary mb-5">고객 문의에 실시간으로 응대합니다.</p>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[420px]">
        {/* 대화 목록 */}
        <div className="bg-white border border-border rounded-[var(--radius-lg)] overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-10">대화가 없습니다.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border-light hover:bg-surface transition-colors',
                  selectedId === c.id && 'bg-primary-5'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">{label(c)}</span>
                  {c.unread_admin > 0 && (
                    <span className="flex-shrink-0 min-w-5 h-5 px-1.5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {c.unread_admin}
                    </span>
                  )}
                </div>
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
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-surface">
                {messages.map((m) => (
                  <div key={m.id} className={m.sender === 'admin' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={cn(
                        'max-w-[70%] px-3 py-2 rounded-[var(--radius-md)] text-sm whitespace-pre-wrap break-words',
                        m.sender === 'admin'
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white border border-hairline text-ink rounded-bl-sm'
                      )}
                    >
                      {m.body}
                    </div>
                  </div>
                ))}
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
