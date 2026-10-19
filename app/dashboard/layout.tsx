// @ts-nocheck
'use client';
// app/dashboard/layout.tsx — MINIMAL guard, NO visual nav rail.
// Each dashboard page draws its own header. This just protects /dashboard/* :
// must be logged in, and must have an entitlement (no pay, no access) — fails OPEN
// only for logged-in users with no plan (sent to pricing), never a blank screen.

import './gc.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const guard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: p } = await supabase
        .from('profiles')
        .select('has_solutions, has_intelligence, role, plan_status, trial_ends_at, created_at')
        .eq('id', user.id)
        .single();

      // owner always allowed
      if (p?.role === 'owner') { setReady(true); return; }

      const hasEntitlement = p?.has_solutions || p?.has_intelligence;
      const trialLive = p?.trial_ends_at ? new Date(p.trial_ends_at) > new Date() : false;
      const active = ['trialing', 'active'].includes(p?.plan_status);

      // Access if they have any entitlement (flags are the source of truth).
      if (hasEntitlement || trialLive || active) { setReady(true); return; }

      // Logged in but nothing purchased → send to pricing (never a blank/dead page).
      router.replace('/pricing');
    };
    guard();
  }, [router, pathname]);

  if (!ready) {
    return <div style={{ minHeight: '100vh', background: '#eef1f6' }} />;
  }

  // No wrapper UI — pages render full-bleed with their own headers.
  return <>{children}</>;
}