// @ts-nocheck
/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CAT_COLORS = {
  Dev:{color:'#0a84ff',bg:'rgba(10,132,255,0.1)',border:'rgba(10,132,255,0.2)'},
  Design:{color:'#7c3aed',bg:'rgba(124,58,237,0.1)',border:'rgba(124,58,237,0.2)'},
  Writing:{color:'#b45309',bg:'rgba(255,149,0,0.1)',border:'rgba(255,149,0,0.2)'},
  Marketing:{color:'#1a7a35',bg:'rgba(48,209,88,0.1)',border:'rgba(48,209,88,0.2)'},
  'Photo/Video':{color:'#cc2018',bg:'rgba(255,59,48,0.1)',border:'rgba(255,59,48,0.2)'},
  Audio:{color:'#0a84ff',bg:'rgba(10,132,255,0.08)',border:'rgba(10,132,255,0.15)'},
  Business:{color:'#ff3b30',bg:'rgba(255,59,48,0.08)',border:'rgba(255,59,48,0.15)'},
  Other:{color:'#636366',bg:'rgba(99,99,102,0.08)',border:'rgba(99,99,102,0.15)'},
};

export default function PublicListingPage() {
  const { public_id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('public_barter_board')       // secure view — no login needed
        .select('*')
        .eq('public_id', public_id)
        .single();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setListing(data);
      setLoading(false);
      supabase.rpc('bump_listing_view', { pid: public_id }); // fire-and-forget
    };
    load();
  }, [public_id]);

  const cat = listing ? (CAT_COLORS[listing.category] || CAT_COLORS.Other) : CAT_COLORS.Other;
  const name = listing?.first_name || 'Member';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes rainbowAnim{to{background-position:200% center}}
      `}</style>
      <div style={{minHeight:'100vh',background:'radial-gradient(ellipse 80% 60% at 20% -10%,rgba(48,209,88,0.16) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 110%,rgba(10,132,255,0.12) 0%,transparent 60%),#e8eef5',fontFamily:"'DM Sans',sans-serif"}}>
        {/* header */}
        <header style={{position:'relative',background:'rgba(255,255,255,0.6)',backdropFilter:'blur(40px)',borderBottom:'0.5px solid rgba(255,255,255,0.8)',padding:'0 20px',height:56,display:'flex',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)',backgroundSize:'200% auto',animation:'rainbowAnim 3s linear infinite'}} />
          <Link href="/barter" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
            <div style={{width:24,height:24,borderRadius:6,background:'#ff3b30',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:11}}>GC</div>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,color:'#1c1c1e'}}>Gratia Core</span>
            <span style={{fontSize:11,color:'rgba(28,28,30,0.35)'}}>/ Barter</span>
          </Link>
          <div style={{flex:1}} />
          <Link href="/barter" style={{fontSize:13,color:'rgba(28,28,30,0.5)',textDecoration:'none',fontWeight:600}}>← All listings</Link>
        </header>

        <main style={{maxWidth:560,margin:'0 auto',padding:'40px 20px 80px'}}>
          {loading ? (
            <p style={{textAlign:'center',color:'rgba(28,28,30,0.35)',padding:'60px 0'}}>Loading…</p>
          ) : notFound ? (
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:44,marginBottom:14}}>🔍</div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:900,marginBottom:8}}>Listing not found</p>
              <p style={{fontSize:14,color:'rgba(28,28,30,0.5)',marginBottom:20}}>It may have been closed or completed.</p>
              <Link href="/barter" style={{display:'inline-block',padding:'12px 24px',borderRadius:100,background:'linear-gradient(135deg,#30d158,#1a7a35)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Browse the board →</Link>
            </div>
          ) : (
            <>
              <div style={{background:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.85)',borderRadius:24,padding:'28px 26px',boxShadow:'0 8px 32px rgba(0,0,0,0.08)',marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#30d158,#1a7a35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:800,color:'#fff'}}>{name[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:700,color:'#1c1c1e',margin:0}}>{name}</p>
                    <p style={{fontSize:12,color:'rgba(28,28,30,0.45)',margin:0}}>⭐ {(listing.barter_rating||5).toFixed(1)} · {listing.barter_trades_count||0} trades</p>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:100,background:cat.bg,color:cat.color,border:`0.5px solid ${cat.border}`}}>{listing.category}</span>
                </div>

                <div style={{background:'rgba(48,209,88,0.07)',border:'0.5px solid rgba(48,209,88,0.18)',borderRadius:16,padding:'16px 18px',marginBottom:10}}>
                  <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#1a7a35',marginBottom:6}}>Offering</p>
                  <p style={{fontSize:17,fontWeight:700,color:'#1c1c1e',lineHeight:1.35}}>{listing.what_i_offer}</p>
                  {listing.estimated_value && <p style={{fontSize:12,color:'rgba(28,28,30,0.4)',marginTop:4}}>Estimated value ~${Number(listing.estimated_value).toLocaleString()}</p>}
                </div>
                <div style={{textAlign:'center',fontSize:20,color:'rgba(28,28,30,0.25)',margin:'4px 0'}}>⇅</div>
                <div style={{background:'rgba(255,59,48,0.05)',border:'0.5px solid rgba(255,59,48,0.14)',borderRadius:16,padding:'16px 18px'}}>
                  <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#cc2018',marginBottom:6}}>Wants in return</p>
                  <p style={{fontSize:17,fontWeight:700,color:'#1c1c1e',lineHeight:1.35}}>{listing.what_i_want}</p>
                </div>

                {listing.description && <p style={{fontSize:14,color:'rgba(28,28,30,0.6)',lineHeight:1.65,marginTop:16,paddingTop:16,borderTop:'0.5px solid rgba(28,28,30,0.08)'}}>{listing.description}</p>}
              </div>

              {/* CTA — login gate */}
              <div style={{background:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.85)',borderRadius:20,padding:'22px 24px',textAlign:'center',boxShadow:'0 6px 20px rgba(0,0,0,0.07)'}}>
                <p style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:900,marginBottom:6}}>Want to make this trade?</p>
                <p style={{fontSize:13,color:'rgba(28,28,30,0.52)',lineHeight:1.6,marginBottom:16}}>Browsing is free. Start a 7-day trial to request trades and post your own listings.</p>
                <Link href="/pricing" style={{display:'block',padding:13,borderRadius:100,background:'linear-gradient(135deg,#30d158,#1a7a35)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none',marginBottom:10}}>Start 7-day free trial →</Link>
                <Link href="/login" style={{fontSize:13,color:'rgba(28,28,30,0.5)',textDecoration:'none',fontWeight:600}}>Already have an account? Log in</Link>
              </div>

              <p style={{fontSize:11,color:'rgba(28,28,30,0.3)',textAlign:'center',marginTop:20}}>{listing.views||0} views · Gratia Core Barter Exchange</p>
            </>
          )}
        </main>
      </div>
    </>
  );
}