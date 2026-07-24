// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  const links = [
    { href: '/', label: 'Home', icon: '⌂' },
    { href: '/barter', label: 'Barter board', icon: '🤝' },
    { href: '/#modules', label: 'Modules', icon: '◆' },
    { href: '/pricing', label: 'Pricing', icon: '$' },
    { href: '/about', label: 'About', icon: 'ⓘ' },
  ];

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,zIndex:1998,background:'rgba(0,0,0,0.12)',backdropFilter:'blur(2px)'}} />}

      {open && (
        <div style={{position:'fixed',bottom:84,right:20,zIndex:2000,width:230,background:'rgba(255,255,255,0.82)',backdropFilter:'blur(50px) saturate(180%)',WebkitBackdropFilter:'blur(50px) saturate(180%)',border:'1px solid rgba(255,255,255,0.95)',borderRadius:20,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.18)'}}>
          <div style={{height:3,background:'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)'}} />
          <div style={{padding:8}}>
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                style={{display:'flex',alignItems:'center',gap:11,padding:'11px 13px',borderRadius:12,textDecoration:'none',color:'#1c1c1e',fontSize:14,fontWeight:600}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{width:20,textAlign:'center',opacity:0.6}}>{l.icon}</span>{l.label}
              </Link>
            ))}
            <div style={{height:1,background:'rgba(0,0,0,0.08)',margin:'6px 8px'}} />
            {loggedIn ? (
              <Link href="/dashboard" onClick={()=>setOpen(false)} style={{display:'block',textAlign:'center',padding:'11px',borderRadius:12,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Go to dashboard →</Link>
            ) : (
              <div style={{display:'flex',gap:6,padding:'2px'}}>
                <Link href="/login" onClick={()=>setOpen(false)} style={{flex:1,textAlign:'center',padding:'10px',borderRadius:12,background:'rgba(0,0,0,0.05)',color:'rgba(28,28,30,0.7)',fontSize:13,fontWeight:600,textDecoration:'none'}}>Log in</Link>
                <Link href="/pricing" onClick={()=>setOpen(false)} style={{flex:1,textAlign:'center',padding:'10px',borderRadius:12,background:'linear-gradient(135deg,#ff3b30,#ff6b35)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Try free</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} aria-label="Menu"
        style={{position:'fixed',bottom:20,right:20,zIndex:2000,width:52,height:52,borderRadius:16,border:'1px solid rgba(255,255,255,0.95)',background:'rgba(255,255,255,0.82)',backdropFilter:'blur(40px) saturate(180%)',WebkitBackdropFilter:'blur(40px) saturate(180%)',boxShadow:'0 8px 28px rgba(0,0,0,0.14)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5}}>
        <span style={{width:20,height:2,borderRadius:2,background:'#1c1c1e',transition:'0.25s',transform:open?'rotate(45deg) translate(0,7px)':'none'}} />
        <span style={{width:20,height:2,borderRadius:2,background:'#1c1c1e',transition:'0.2s',opacity:open?0:1}} />
        <span style={{width:20,height:2,borderRadius:2,background:'#1c1c1e',transition:'0.25s',transform:open?'rotate(-45deg) translate(0,-7px)':'none'}} />
      </button>
    </>
  );
}