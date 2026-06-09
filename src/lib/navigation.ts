import {
  Search,
  TrendingUp,
  FileText,
  Heart,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * 앱 메인 네비게이션 — Header(데스크톱은 사이드바로 이동) / SidebarNav /
 * 모바일 하단 탭이 공유하는 단일 출처.
 */
export const navItems: NavItem[] = [
  { label: '아이템검색', href: '/shop', icon: Search },
  { label: '쿠팡분석', href: '/coupang', icon: TrendingUp },
  { label: '상세페이지', href: '/detail-generator', icon: FileText },
  { label: '내찜목록', href: '/wishlist', icon: Heart },
  { label: '내주문목록', href: '/sourcing-orders', icon: ClipboardList },
];

/** sourcing 관련 라우트에서만 검색창/사이드바 노출 */
export const SOURCING_PREFIXES = [
  '/shop',
  '/coupang',
  '/detail-generator',
  '/wishlist',
  '/sourcing-orders',
  '/cart',
];

export const HIDE_NAV_PREFIXES = ['/admin', '/login', '/signup', '/reset-password'];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}
