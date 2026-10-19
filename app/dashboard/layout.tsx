// @ts-nocheck
'use client';
// app/dashboard/layout.tsx — MINIMAL guard, NO visual nav rail.
// Each dashboard page draws its own header. This only protects /dashboard/*:
// you must be logged in. That's it. Free accounts (no modules on) are welcome — Advisory is free,
// and each paid module gates itself with <ModuleGate>, so there is no "send to pricing" step anymore.

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
      setReady(true);
    };
    guard();
  }, [router, pathname]);

  if (!ready) {
    return <div style={{ minHeight: '100vh', background: '#f0eff4' }} />;
  }

  // No wrapper UI — pages render full-bleed with their own headers.
  return <>{children}</>;
}