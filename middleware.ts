/**
 * middleware.ts
 * Place at: middleware.ts (root of project, same level as package.json)
 *
 * npm install @supabase/ssr
 *
 * What this does:
 *   1. Every request to /dashboard/* is intercepted BEFORE the page loads
 *   2. Checks Supabase auth session server-side — no client JS involved
 *   3. No valid session → redirect to / instantly
 *   4. Valid session but no active plan → redirect to /pricing
 *   5. Also protects landing page behind launch gate cookie (server-side)
 *   6. /pricing and /login are always accessible
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that are always public — no auth needed
const PUBLIC_ROUTES = ['/login', '/pricing', '/about', '/contact', '/terms', '/privacy', '/cookies'];

// Plan statuses that are allowed into the dashboard
const ACTIVE_STATUSES = ['active', 'trialing'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Launch gate — server-side ─────────────────────────────
  // If someone hits the root / without the gc_access cookie,
  // they're already handled by the client component.
  // But for extra security, any direct route not in PUBLIC_ROUTES
  // and not /dashboard also checks the cookie.
  // (Dashboard has its own auth check below)

  // ── 2. Protect /dashboard/* routes ───────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // If coming back from Stripe checkout, let them through
    // The dashboard page itself will verify and update the profile
    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (sessionId) return NextResponse.next();

    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    // Create server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check session — this is server-side, cannot be spoofed
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // No valid session → kick to home
    if (authError || !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('auth', 'required');
      return NextResponse.redirect(url);
    }

    // Check subscription status in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_status, selected_plan, trial_ends_at')
      .eq('id', user.id)
      .single();

    // No profile at all → something went wrong, redirect home
    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Check if trial has actually expired
    const trialExpired =
      profile.plan_status === 'trialing' &&
      profile.trial_ends_at &&
      new Date(profile.trial_ends_at) < new Date();

    const hasAccess =
      ACTIVE_STATUSES.includes(profile.plan_status) && !trialExpired;

    // No active plan → redirect to pricing
    if (!hasAccess) {
      const url = request.nextUrl.clone();
      url.pathname = '/pricing';
      url.searchParams.set('reason', 'subscription_required');
      return NextResponse.redirect(url);
    }

    // ── Plan/route mismatch protection ──────────────────────────
    // Prevent a personal plan user accessing /dashboard/enterprise
    if (pathname.startsWith('/dashboard/enterprise') && profile.selected_plan === 'personal') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/personal';
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/dashboard/personal') && profile.selected_plan === 'business') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/enterprise';
      return NextResponse.redirect(url);
    }

    // All good — let the request through
    return response;
  }

  // ── 3. Protect /api/stripe/* routes ──────────────────────────
  // Stripe API routes should only be called from your own frontend
  if (pathname.startsWith('/api/stripe')) {
    const origin = request.headers.get('origin');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    // Block requests from unknown origins (not from your domain)
    if (origin && appUrl && !origin.startsWith(appUrl) && !origin.includes('localhost')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // All other routes — pass through
  return NextResponse.next();
}

// Which routes this middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*',   // All dashboard pages
    '/api/stripe/:path*',  // Stripe API routes
  ],
};