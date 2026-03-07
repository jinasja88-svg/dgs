'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import MobileMenu from './MobileMenu';

const navItems = [
  { label: '소싱하기', href: '/shop' },
  { label: '요금 안내', href: '/pricing' },
  { label: '서비스 소개', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: '문의하기', href: '/contact' },
];

export default function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-200',
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-heading text-xl font-bold text-primary">
              딸깍소싱
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-primary'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/mypage"
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-danger transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-primary-hover transition-colors"
                >
                  로그인
                </Link>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-text-secondary hover:text-primary transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="h-16" />
    </>
  );
}
