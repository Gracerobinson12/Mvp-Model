/**
 * middleware.ts — auth guard only.
 * /dashboard/* requires a valid Supabase session.
 * No plan/subscription check — the module system handles that inside each page.
 * /login, /signup, /pricing, /advisory and all public routes pass through freely.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Stripe webhook and checkout returns — never block these
  if (pathname.startsWith('/api/stripe')) return NextResponse.next();

  // Only protect /dashboard routes
  if (!pathname.startsWith('/dashboard')) return NextResponse.next();

  // Let Stripe checkout success through (has session_id param)
  if (request.nextUrl.searchParams.get('session_id')) return NextResponse.next();

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Not logged in → send to login, remember where they were going
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Logged in → let them through. Each module page handles its own "turn on" gate.
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};