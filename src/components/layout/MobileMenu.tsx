'use client';

import Link from 'next/link';
import { X, Search, FileText, Heart, ClipboardList, User, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  onLogout: () => void;
}

const menuItems = [
  { label: '아이템검색', href: '/shop', icon: Search },
  { label: '상세페이지 생성', href: '/detail-generator', icon: FileText },
  { label: '내찜목록', href: '/wishlist', icon: Heart },
  { label: '내주문목록', href: '/sourcing-orders', icon: ClipboardList },
];

export default function MobileMenu({ isOpen, onClose, user, onLogout }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-xl animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="text-lg font-bold text-primary">딸깍소싱</span>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="py-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-6 py-3 text-sm text-text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-6 py-4">
          {user ? (
            <div className="flex flex-col gap-2">
              <Link
                href="/mypage"
                onClick={onClose}
                className="flex items-center gap-3 py-2 text-sm text-text-secondary hover:text-primary transition-colors"
              >
                <User className="w-4 h-4" />
                마이페이지
              </Link>
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="flex items-center gap-3 py-2 text-sm text-text-tertiary hover:text-danger transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="block w-full text-center py-2.5 bg-primary text-white text-[15px] font-bold rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
