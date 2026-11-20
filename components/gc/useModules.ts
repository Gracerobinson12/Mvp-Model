'use client';
// @ts-nocheck
// components/gc/useModules.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MODULES, MODULE_ORDER, PAID_MODULES } from '@/lib/modules';

export function useModules() {
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [access,     setAccess]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(null);
  const [summary,    setSummary]    = useState(null);  // { total, next_invoice, items[], card_last4, card_brand }
  const [error,      setError]      = useState('');
  // activating: module id that Stripe just paid for — waiting for webhook to confirm it
  const [activating, setActivating] = useState(null);
  // declined: module id whose card charge was declined
  const [declined,   setDeclined]   = useState(null);

  // pending confirm: { id, on, name, price, card_last4, card_brand }
  const [pending, setPending] = useState(null);

  const pollRef = useRef(null);

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token || '';

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUser(user);
    const [{ data: prof }, { data: rows }] = await Promise.all([
      supabase.from('profiles').select('full_name,first_name,last_name,email,stripe_customer_id,stripe_subscription_id,plan_status').eq('id', user.id).maybeSingle(),
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
    return a;
  }, []);

  // After Stripe Checkout returns, ?on=<module> tells us to wait for the webhook to activate it.
  // Poll Supabase every 2 s for up to 20 s, then give up gracefully.
  const startPolling = useCallback((moduleId) => {
    setActivating(moduleId);
    let attempts = 0;
    const MAX = 10; // 10 × 2 s = 20 s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      attempts++;
      const { data: row } = await supabase
        .from('module_access')
        .select('active')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('module', moduleId)
        .maybeSingle();
      if (row?.active) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setActivating(null);
        await load();
        // Clean ?on= from URL without a page reload
        const url = new URL(window.location.href);
        url.searchParams.delete('on');
        window.history.replaceState({}, '', url.toString());
      } else if (attempts >= MAX) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        // Webhook may still come — just stop the spinner and reload state
        setActivating(null);
        await load();
        const url = new URL(window.location.href);
        url.searchParams.delete('on');
        window.history.replaceState({}, '', url.toString());
      }
    }, 2000);
  }, [load]);

  useEffect(() => {
    // On mount: load state, then check for ?on= from Stripe success redirect
    load().then(() => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const onModule = params.get('on');
      if (onModule && onModule in MODULES) {
        startPolling(onModule);
      }
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []); // eslint-disable-line

  // Call this when user clicks "Turn on" for a paid module.
  // Card on file → show confirm modal. No card → go straight to Stripe Checkout.
  const requestToggle = useCallback(async (id, on) => {
    const mod = MODULES[id];
    setDeclined(null);
    if (!on || mod.price === 0) {
      await _doToggle(id, on);
      return;
    }
    const card_last4 = summary?.card_last4 || null;
    const card_brand = summary?.card_brand || null;
    if (card_last4) {
      setPending({ id, on, name: mod.name, price: mod.price, card_last4, card_brand });
    } else {
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
    setBusy(id); setError(''); setDeclined(null);
    try {
      const res = await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ module: id, on }),
      });
      const j = await res.json();
      if (j.url) { window.location.href = j.url; return; }  // no card → Stripe Checkout
      if (!j.ok) {
        // Card declined or payment error — surface it clearly
        const msg = j.error || 'Could not update that module.';
        const isDecline = /decline|card|payment|insufficient|card_error/i.test(msg);
        if (isDecline && on) {
          setDeclined(id);
          setError('Your card was declined. Please update your payment method and try again.');
        } else {
          throw new Error(msg);
        }
        setBusy(null);
        return;
      }
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
  // activating counts as 'on' so the gate doesn't flash "off" while we wait for the webhook
  const stateOf = (id) => {
    if (loading) return 'loading';
    if (activating === id) return 'activating';
    return access[id] ? 'on' : 'off';
  };
  const monthTotal = PAID_MODULES.reduce((s, id) => s + (access[id] ? MODULES[id].price : 0), 0);
  const onCount = PAID_MODULES.filter(id => access[id]).length;

  return {
    user, profile, name, access, stateOf, loading, busy, error, summary, monthTotal, onCount,
    toggle: requestToggle, confirmToggle, cancelToggle, pending, pauseAll, reload: load,
    activating, declined,
  };
}