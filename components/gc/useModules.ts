'use client';
// @ts-nocheck
// components/gc/useModules.ts — one hook every app page uses:
// who am I, which modules are on, what's this month's bill, and toggle / pause actions.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MODULES, MODULE_ORDER, PAID_MODULES } from '@/lib/modules';

export function useModules() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [access, setAccess] = useState({});        // { vault: true, barter: false, ... }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);          // module id being toggled, or 'pause'
  const [summary, setSummary] = useState(null);    // { total, next_invoice, items[] }
  const [error, setError] = useState('');

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token || '';

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUser(user);
    const [{ data: prof }, { data: rows }] = await Promise.all([
      supabase.from('profiles').select('full_name,first_name,last_name,email,stripe_customer_id,stripe_subscription_id').eq('id', user.id).maybeSingle(),
      supabase.from('module_access').select('module,active,comp').eq('user_id', user.id),
    ]);
    setProfile(prof || null);
    const a = {};
    for (const id of MODULE_ORDER) a[id] = MODULES[id].price === 0;      // free modules are always on
    for (const r of rows || []) if (r.module in MODULES) a[r.module] = !!r.active || !!r.comp;
    setAccess(a);
    setLoading(false);
    // billing summary is non-blocking
    fetch('/api/modules/summary', { headers: { Authorization: `Bearer ${await token()}` } })
      .then(r => r.json()).then(j => { if (j.ok) setSummary(j); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (id, on) => {
    setBusy(id); setError('');
    try {
      const res = await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ module: id, on }),
      });
      const j = await res.json();
      if (j.url) { window.location.href = j.url; return; }        // first paid module → Stripe Checkout
      if (!j.ok) throw new Error(j.error || 'Could not update that module.');
      await load();
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    setBusy(null);
  }, [load]);

  const pauseAll = useCallback(async () => {
    setBusy('pause'); setError('');
    try {
      const res = await fetch('/api/modules/pause', { method: 'POST', headers: { Authorization: `Bearer ${await token()}` } });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Could not pause.');
      await load();
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    setBusy(null);
  }, [load]);

  const name = (profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email || '').trim();
  const stateOf = (id) => loading ? 'loading' : (access[id] ? 'on' : 'off');
  const monthTotal = PAID_MODULES.reduce((s, id) => s + (access[id] ? MODULES[id].price : 0), 0);
  const onCount = PAID_MODULES.filter(id => access[id]).length;

  return { user, profile, name, access, stateOf, loading, busy, error, summary, monthTotal, onCount, toggle, pauseAll, reload: load };
}