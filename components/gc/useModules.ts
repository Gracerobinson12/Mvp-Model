'use client';
// @ts-nocheck
// components/gc/useModules.ts

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MODULES, MODULE_ORDER, PAID_MODULES } from '@/lib/modules';

export function useModules() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [access,  setAccess]  = useState({});
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(null);
  const [summary, setSummary] = useState(null);   // { total, next_invoice, items[], card_last4, card_brand }
  const [error,   setError]   = useState('');

  // pending confirm: { id, on, label, price, card_last4, card_brand }
  const [pending, setPending] = useState(null);

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
    for (const id of MODULE_ORDER) a[id] = MODULES[id].price === 0;
    for (const r of rows || []) if (r.module in MODULES) a[r.module] = !!r.active || !!r.comp;
    setAccess(a);
    setLoading(false);
    fetch('/api/modules/summary', { headers: { Authorization: `Bearer ${await token()}` } })
      .then(r => r.json()).then(j => { if (j.ok) setSummary(j); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Call this when user slides toggle ON for a paid module.
  // If card is on file → show confirm modal (setPending).
  // If no card → go straight to Stripe Checkout (no confirm needed).
  const requestToggle = useCallback(async (id, on) => {
    const mod = MODULES[id];
    if (!on || mod.price === 0) {
      // Turning off or free module — no confirm needed, just do it
      await _doToggle(id, on);
      return;
    }
    // Turning on a paid module
    const card_last4 = summary?.card_last4 || null;
    const card_brand = summary?.card_brand || null;
    if (card_last4) {
      // Card on file — show confirm modal
      setPending({ id, on, name: mod.name, price: mod.price, card_last4, card_brand });
    } else {
      // No card — go straight to Stripe (toggle will redirect)
      await _doToggle(id, on);
    }
  }, [summary]); // eslint-disable-line

  const confirmToggle = useCallback(async () => {
    if (!pending) return;
    const { id, on } = pending;
    setPending(null);
    await _doToggle(id, on);
  }, [pending]); // eslint-disable-line

  const cancelToggle = useCallback(() => setPending(null), []);

  const _doToggle = useCallback(async (id, on) => {
    setBusy(id); setError('');
    try {
      const res = await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ module: id, on }),
      });
      const j = await res.json();
      if (j.url) { window.location.href = j.url; return; }   // no card → Stripe Checkout
      if (!j.ok) throw new Error(j.error || 'Could not update that module.');
      await load();
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    setBusy(null);
  }, [load]); // eslint-disable-line

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

  // expose toggle as requestToggle so pages always go through the confirm flow
  return { user, profile, name, access, stateOf, loading, busy, error, summary, monthTotal, onCount,
           toggle: requestToggle, confirmToggle, cancelToggle, pending, pauseAll, reload: load };
}