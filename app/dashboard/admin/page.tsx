// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('tickets');

  useEffect(() => {
    (async () => {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      // must be owner
      const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (me?.role !== 'owner') { router.replace('/dashboard/personal'); return; }

      const [{ data: u }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('email, plan, plan_status, onboarded, created_at').order('created_at',{ascending:false}),
        supabase.from('support_tickets').select('*').order('created_at',{ascending:false}),
      ]);
      setUsers(u || []); setTickets(t || []);
      setLoading(false);
    })();
  }, [router]);

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const box = { background:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:16, padding:'16px 18px', marginBottom:10, boxShadow:'0 4px 16px rgba(0,0,0,0.05)' };

  if (loading) return <div style={{minHeight:'100vh',background:'#e8eef5',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(28,28,30,0.4)'}}>Loading…</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{minHeight:'100vh',background:'#e8eef5',fontFamily:"'DM Sans',sans-serif",padding:'28px 24px 80px'}}>
        <div style={{maxWidth:820,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <span style={{fontSize:26}}>🛠️</span>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:900,letterSpacing:'-1px',color:'#1c1c1e'}}>Owner Dashboard</h1>
          </div>
          <p style={{fontSize:14,color:'rgba(28,28,30,0.55)',marginBottom:20}}>{users.length} users · {openTickets} open support tickets</p>

          {/* stat cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {[['Users',users.length,'#0a84ff'],['Open tickets',openTickets,'#ff9500'],['Active subs',users.filter(u=>u.plan_status==='active').length,'#30d158']].map(([l,v,c])=>(
              <div key={l} style={{...box,textAlign:'center',marginBottom:0}}>
                <p style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:900,color:c}}>{v}</p>
                <p style={{fontSize:12,color:'rgba(28,28,30,0.5)'}}>{l}</p>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {['tickets','users'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 18px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,background:tab===t?'#1c1c1e':'rgba(255,255,255,0.6)',color:tab===t?'#fff':'rgba(28,28,30,0.55)'}}>
                {t==='tickets'?`Support (${tickets.length})`:`Users (${users.length})`}
              </button>
            ))}
          </div>

          {tab==='tickets' ? (
            tickets.length===0 ? <p style={{color:'rgba(28,28,30,0.4)',padding:'20px 0'}}>No support tickets yet.</p> :
            tickets.map(t=>(
              <div key={t.id} style={box}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:100,background:t.status==='open'?'rgba(255,149,0,0.12)':'rgba(48,209,88,0.12)',color:t.status==='open'?'#b45309':'#1a7a35'}}>{t.status}</span>
                  <span style={{fontSize:14,fontWeight:700,color:'#1c1c1e'}}>{t.subject}</span>
                  <span style={{marginLeft:'auto',fontSize:12,color:'rgba(28,28,30,0.4)'}}>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{fontSize:13,color:'rgba(28,28,30,0.6)',marginBottom:6,lineHeight:1.5}}>{t.message}</p>
                <p style={{fontSize:12,color:'#0a84ff'}}>{t.email}</p>
              </div>
            ))
          ) : (
            users.map(u=>(
              <div key={u.email} style={{...box,display:'flex',alignItems:'center',gap:12}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:14,fontWeight:600,color:'#1c1c1e'}}>{u.email}</p>
                  <p style={{fontSize:12,color:'rgba(28,28,30,0.45)'}}>{u.plan||'—'} · joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:100,background:u.plan_status==='active'?'rgba(48,209,88,0.12)':u.plan_status==='trialing'?'rgba(255,149,0,0.12)':'rgba(0,0,0,0.06)',color:u.plan_status==='active'?'#1a7a35':u.plan_status==='trialing'?'#b45309':'rgba(28,28,30,0.5)'}}>{u.plan_status||'none'}</span>
                <span style={{fontSize:11,color:u.onboarded?'#30d158':'rgba(28,28,30,0.35)'}}>{u.onboarded?'✓ onboarded':'not onboarded'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}