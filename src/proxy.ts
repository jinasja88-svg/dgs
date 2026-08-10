import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateSession } from '@/lib/supabase-middleware';

const protectedRoutes = ['/mypage', '/checkout', '/sourcing-orders'];
const authRoutes = ['/login', '/signup', '/reset-password'];

function getSafeRedirectTarget(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/mypage';
  return value;
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Protected routes - redirect to login if not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  // Admin routes - check DB role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Auth routes - redirect to mypage if already authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL(getSafeRedirectTarget(request.nextUrl.searchParams.get('redirect')), request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
