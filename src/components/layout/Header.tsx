'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, LogOut, ShoppingCart, Search, TrendingUp, FileText, Heart, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { getCartCount } from '@/lib/cart';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import MobileMenu from './MobileMenu';
import HistoryDropdown from './HistoryDropdown';

const navItems = [
  { label: '아이템검색', href: '/shop', icon: Search },
  { label: '쿠팡분석', href: '/coupang', icon: TrendingUp },
  { label: '상세페이지', href: '/detail-generator', icon: FileText },
  { label: '내찜목록', href: '/wishlist', icon: Heart },
  { label: '내주문목록', href: '/sourcing-orders', icon: ClipboardList },
];

// sourcing 관련 라우트에서만 네비 표시
const SOURCING_PREFIXES = ['/shop', '/coupang', '/detail-generator', '/wishlist', '/sourcing-orders', '/cart'];
const HIDE_NAV_PREFIXES = ['/admin', '/login', '/signup', '/reset-password'];

export default function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();
  const supabase = createClient();

  const showNav = !HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setCartCount(getCartCount());
    const onStorage = () => setCartCount(getCartCount());
    window.addEventListener('storage', onStorage);
    window.addEventListener('cart-updated', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart-updated', onStorage);
    };
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
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <div className="mx-auto px-2 sm:px-3 lg:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-1 lg:gap-2">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="8" fill="#ff385c" />
                  <path d="M8 14.5L12.5 19L20 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="20" cy="8" r="3" fill="#ff7a90" />
                </svg>
                <span className="hidden sm:inline">딸깍소싱</span>
              </Link>

              {/* Desktop Nav */}
              {showNav && (
                <nav className="hidden md:flex items-center ml-4 lg:ml-6 gap-0.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors whitespace-nowrap',
                          isActive
                            ? 'text-primary bg-primary-5'
                            : 'text-text-secondary hover:text-primary hover:bg-surface'
                        )}
                      >
                        <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : 'text-text-tertiary')} />
                        <span className="hidden lg:inline">{item.label}</span>
                      </Link>
                    );
                  })}
                  <HistoryDropdown />
                </nav>
              )}
            </div>

            {/* Right: Cart + Auth */}
            <div className="flex items-center gap-2 lg:gap-3">
              <Link
                href="/cart"
                className="relative p-2 text-text-secondary hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

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
                  className="hidden md:inline-flex items-center px-4 py-2 bg-primary text-white text-[15px] font-bold rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
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

      <div className="h-16" style={{ marginTop: 'var(--safe-area-top)' }} />
    </>
  );
}
