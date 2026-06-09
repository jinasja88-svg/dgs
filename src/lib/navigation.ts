import {
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  Package,
  Search,
  ShoppingBag,
  TrendingUp,
  FileText,
  Heart,
  ClipboardList,
  Users,
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

export const adminNavItems: NavItem[] = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '소싱 주문', href: '/admin/sourcing-orders', icon: Package },
  { label: '일반 주문', href: '/admin/orders', icon: ShoppingBag },
  { label: '사용자', href: '/admin/users', icon: Users },
  { label: 'API 모니터', href: '/admin/api-monitor', icon: Activity },
];

export const adminSidebarOnlyItems: NavItem[] = [
  { label: 'CS 관리', href: '/admin/cs', icon: MessageCircle },
  { label: '실시간 상담', href: '/admin/chat', icon: MessagesSquare },
  { label: '정산', href: '/admin/settlement', icon: BarChart3 },
  { label: '공지 관리', href: '/admin/notices', icon: Bell },
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
