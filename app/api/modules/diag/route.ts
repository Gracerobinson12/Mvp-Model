 // app/api/modules/diag/route.ts — temporary: shows which env vars are set (not values, just present/missing)
// DELETE THIS FILE once toggle is working.
import { NextResponse } from 'next/server';

export async function GET() {
  const check = (k: string) => process.env[k] ? `set (${process.env[k]!.slice(0, 8)}…)` : 'MISSING';
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL:    check('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: check('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY:   check('SUPABASE_SERVICE_ROLE_KEY'),
    STRIPE_SECRET_KEY:           check('STRIPE_SECRET_KEY'),
    STRIPE_PRICE_PROTECT:        check('STRIPE_PRICE_PROTECT'),
    STRIPE_PRICE_VAULT:          check('STRIPE_PRICE_VAULT'),
    STRIPE_PRICE_BARTER:         check('STRIPE_PRICE_BARTER'),
    NEXT_PUBLIC_SITE_URL:        check('NEXT_PUBLIC_SITE_URL'),
  });
}