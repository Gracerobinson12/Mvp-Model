'use client';
// @ts-nocheck
// app/dashboard/layout.tsx — guard + the app look.
// Logged in → in. There is no "must have a plan" gate anymore: Advisory is free and every
// paid module shows its own "Turn on" card when it's off (see ModuleGate).

import './gc.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!alive) return;
      if (!user) {
        try { localStorage.setItem('gc_post_login', pathname || '/dashboard'); } catch {}
        router.replace('/login'); return;
      }
      setReady(true);
    });
    return () => { alive = false; };
  }, [router, pathname]);

  if (!ready) return <div className="gc" />;
  return <div className="gc">{children}</div>;
}