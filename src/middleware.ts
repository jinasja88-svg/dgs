import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

const protectedRoutes = ['/mypage', '/checkout', '/sourcing-orders'];
const authRoutes = ['/login', '/signup', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Protected routes - redirect to login if not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Admin routes - check email whitelist
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim());
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Auth routes - redirect to mypage if already authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL('/mypage', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
