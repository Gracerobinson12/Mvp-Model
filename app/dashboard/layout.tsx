// @ts-nocheck
'use client';

// app/dashboard/layout.tsx — wraps EVERY /dashboard/* page with shared nav + auth guard

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PERSONAL_NAV = [
  { href: '/dashboard/personal', label: 'Home',        icon: '⌂' },
  { href: '/dashboard/vault',    label: 'Ideas Vault', icon: '💡' },
  { href: '/dashboard/barter',   label: 'Barter',      icon: '🤝' },
  { href: '/dashboard/duty',     label: 'Duty',        icon: '⚓' },
];

const ENTERPRISE_NAV = [
  { href: '/dashboard/enterprise',  label: 'Home',        icon: '⌂' },
  { href: '/dashboard/regulations', label: 'Regulatory',  icon: '⚖️' },
  { href: '/dashboard/market',      label: 'Market',      icon: '📈' },
  { href: '/dashboard/barter',      label: 'Barter',      icon: '🤝' },
  { href: '/dashboard/vault',       label: 'Vault',       icon: '💡' },
];

const COMMON = [
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  { href: '/dashboard/billing',  label: 'Billing',  icon: '$' },
];

// which plan values count as "let them in"
const ALLOWED = ['active', 'trialing'];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const guard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

        const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_status, onboarded, role')   // ← add role
    .eq('id', user.id)
    .single();

  // not logged in already handled above (redirects to /login)

  // OWNER: always goes to admin, gets in regardless of plan/onboarding
  if (profile?.role === 'owner') {
    setPlan('enterprise');
    setChecking(false);
    return;   // owner bypasses trial + onboarding checks
  }

  // NON-OWNER trying to reach the admin page → kick out
  if (pathname.startsWith('/dashboard/admin')) {
    router.replace('/dashboard/personal');
    return;
  }

  // normal gating for everyone else
  if (!profile || !ALLOWED.includes(profile.plan_status)) {
    router.replace('/pricing');
    return;
  }
  if (!profile.onboarded) {
    router.replace('/onboarding');
    return;
  }
      setPlan(profile.plan || 'personal');
      setChecking(false);
    };
    guard();
  }, [router]);

  if (checking) {
    return <div style={{ position: 'fixed', inset: 0, background: '#e8eef5' }} />;
  }

  const isBiz = plan === 'enterprise';
  const nav = [...(isBiz ? ENTERPRISE_NAV : PERSONAL_NAV), ...COMMON];
  const homeHref = isBiz ? '/dashboard/enterprise' : '/dashboard/personal';

  return (
    <div style={{ minHeight: '100vh', background: '#e8eef5' }}>
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 76, zIndex: 90,
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRight: '0.5px solid rgba(255,255,255,0.9)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 0', gap: 6,
      }}>
        <Link href={homeHref}
          style={{ width: 40, height: 40, borderRadius: 11, background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none', marginBottom: 10 }}>
          GC
        </Link>

        {nav.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} title={item.label}
              style={{
                width: 48, height: 48, borderRadius: 13, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2, textDecoration: 'none',
                background: active ? 'rgba(255,59,48,0.1)' : 'transparent',
                border: active ? '0.5px solid rgba(255,59,48,0.25)' : '0.5px solid transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 17, opacity: active ? 1 : 0.55 }}>{item.icon}</span>
              <span style={{ fontSize: 8, fontWeight: 600, color: active ? '#ff3b30' : 'rgba(28,28,30,0.45)' }}>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />
        <button onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }}
          title="Sign out"
          style={{ width: 48, height: 48, borderRadius: 13, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, opacity: 0.5 }}>
          ⎋
        </button>
      </aside>

      <div style={{ marginLeft: 76 }}>
        {children}
      </div>
    </div>
  );
}