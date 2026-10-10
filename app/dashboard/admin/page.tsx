'use client';
// @ts-nocheck
// app/admin/page.tsx — private admin dashboard. Only emails in ADMIN_EMAILS can see data.
// Shows signups, trials, entitlements, Intelligence waitlist, Advisory leads, and feedback.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GCIcon({ size = 26 }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{display:'block'}}><rect width="512" height="512" rx="114" fill="#ff3b30"/><text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text></svg>);
}

const fmt = (s) => { try { return new Date(s).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return s || '—'; } };

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState('loading'); // loading | denied | ready | error
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      try {
        const res = await fetch('/api/admin/summary', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.status === 403) { setState('denied'); return; }
        if (!res.ok) { setState('error'); return; }
        setD(await res.json()); setState('ready');
      } catch { setState('error'); }
    })();
  }, [router]);

  const ink = '#14202e', ink2 = '#566475', ink3 = '#8a97a6', card = '#fff', bdr = '#e3e7ee', accent = '#1f45c7';
  const wrap = { minHeight: '100vh', background: '#f4f6f9', fontFamily: "'DM Sans',sans-serif", padding: '24px 18px 80px', color: ink };

  if (state === 'loading') return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ink3 }}>Loading…</div>;
  if (state === 'denied') return <div style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}><p style={{ fontWeight: 700 }}>Not authorized</p><p style={{ fontSize: 13, color: ink2 }}>This page is for admins only.</p><Link href="/" style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>← Home</Link></div>;
  if (state === 'error') return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ink3 }}>Couldn't load admin data.</div>;

  const S = d.stats;
  const Stat = ({ label, value }) => (
    <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 14, padding: '14px 16px', flex: 1, minWidth: 120 }}>
      <p style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Sora',sans-serif", color: ink, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11.5, color: ink2, marginTop: 4 }}>{label}</p>
    </div>
  );
  const Section = ({ title, count, children }) => (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: ink }}>{title}</h2>
        {count != null && <span style={{ fontSize: 12, color: ink3 }}>{count} total</span>}
      </div>
      <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 14, overflow: 'hidden' }}>{children}</div>
    </div>
  );
  const Row = ({ cols }) => (
    <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderTop: `1px solid ${bdr}`, fontSize: 13 }}>
      {cols.map((c, i) => <div key={i} style={{ flex: c.flex || 1, color: c.dim ? ink3 : ink, fontWeight: c.bold ? 600 : 400, whiteSpace: c.nowrap ? 'nowrap' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.v}</div>)}
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}`}</style>
      <div style={wrap}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><GCIcon size={28} /><div><p style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800 }}>Admin</p><p style={{ fontSize: 11, color: ink3 }}>Gratia Core · live</p></div></div>
            <Link href="/dashboard/solutions" style={{ fontSize: 13, color: ink2, textDecoration: 'none' }}>← Dashboard</Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Stat label="Total users" value={S.totalUsers} />
            <Stat label="New (7 days)" value={S.signups7d} />
            <Stat label="On trial" value={S.trialing} />
            <Stat label="Solutions" value={S.solUsers} />
            <Stat label="Intelligence" value={S.intelUsers} />
          </div>

          <Section title="Recent signups" count={S.totalUsers}>
            {d.recentSignups.length === 0 ? <div style={{ padding: 16, color: ink3, fontSize: 13 }}>No signups yet.</div> :
              d.recentSignups.map((r, i) => <Row key={i} cols={[{ v: r.email, bold: true, flex: 2 }, { v: r.plan || '—', dim: true }, { v: r.plan_status || '—', dim: true }, { v: fmt(r.created_at), dim: true, nowrap: true, flex: 1.4 }]} />)}
          </Section>

          <Section title="Intelligence waitlist" count={d.waitlist.count}>
            {d.waitlist.recent.length === 0 ? <div style={{ padding: 16, color: ink3, fontSize: 13 }}>No one on the waitlist yet.</div> :
              d.waitlist.recent.map((r, i) => <Row key={i} cols={[{ v: r.email, bold: true, flex: 2 }, { v: fmt(r.created_at), dim: true, nowrap: true }]} />)}
          </Section>

          <Section title="Advisory leads" count={d.advisory.count}>
            {d.advisory.recent.length === 0 ? <div style={{ padding: 16, color: ink3, fontSize: 13 }}>No leads yet.</div> :
              d.advisory.recent.map((r, i) => <Row key={i} cols={[{ v: r.first_name || '—', bold: true }, { v: r.email, flex: 2 }, { v: r.stage || '—', dim: true }, { v: fmt(r.created_at), dim: true, nowrap: true, flex: 1.4 }]} />)}
          </Section>

          <Section title="Feedback" count={d.feedback.count}>
            {d.feedback.recent.length === 0 ? <div style={{ padding: 16, color: ink3, fontSize: 13 }}>No feedback yet.</div> :
              d.feedback.recent.map((r, i) => <Row key={i} cols={[{ v: r.email || 'anon', dim: true, nowrap: true }, { v: r.message, flex: 3 }, { v: fmt(r.created_at), dim: true, nowrap: true, flex: 1.2 }]} />)}
          </Section>

          <Section title="Modules (internal testing)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14 }}>
              {[
                ['Solutions dashboard', '/dashboard/solutions'],
                ['Ideas Vault', '/dashboard/vault'],
                ['Barter', '/dashboard/barter'],
                ['Intelligence hub', '/dashboard/intelligence'],
                ['Regulatory', '/dashboard/regulatory'],
                ['Tariff', '/dashboard/tariff'],
                ['Expense Intelligence', '/dashboard/expense'],
                ['Advisory (public)', '/advisory'],
                ['Settings', '/dashboard/settings'],
              ].map(([label, href]) => (
                <Link key={href} href={href} style={{ fontSize: 13, fontWeight: 600, color: accent, textDecoration: 'none', background: '#eef2fe', border: `1px solid #d8e0fb`, borderRadius: 100, padding: '8px 14px' }}>{label} ↗</Link>
              ))}
            </div>
          </Section>

          <p style={{ fontSize: 11, color: ink3, textAlign: 'center', marginTop: 28, lineHeight: 1.7 }}>
            Private admin view · visible only to allow-listed emails.<br />
            For page-view traffic analytics, enable Vercel Analytics (see notes).
          </p>
        </div>
      </div>
    </>
  );
}