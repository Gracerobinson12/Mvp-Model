// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * app/barter/page.tsx
 * PUBLIC barter board — no login required to browse
 * "Request this trade" redirects to login/signup
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { key: 'all',        label: 'All skills',   emoji: '' },
  { key: 'Dev',        label: 'Development',  emoji: '💻' },
  { key: 'Design',     label: 'Design',       emoji: '🎨' },
  { key: 'Writing',    label: 'Writing',      emoji: '📝' },
  { key: 'Marketing',  label: 'Marketing',    emoji: '📣' },
  { key: 'Photo/Video',label: 'Photo/Video',  emoji: '📸' },
  { key: 'Audio',      label: 'Audio',        emoji: '🎵' },
  { key: 'Business',   label: 'Business',     emoji: '💼' },
  { key: 'Other',      label: 'Other',        emoji: '✨' },
];

const CAT_COLORS = {
  Dev:         { color: '#0a84ff', bg: 'rgba(10,132,255,0.1)',   border: 'rgba(10,132,255,0.2)'  },
  Design:      { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.2)'  },
  Writing:     { color: '#b45309', bg: 'rgba(255,149,0,0.1)',   border: 'rgba(255,149,0,0.2)'   },
  Marketing:   { color: '#1a7a35', bg: 'rgba(48,209,88,0.1)',   border: 'rgba(48,209,88,0.2)'   },
  'Photo/Video':{ color: '#cc2018', bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.2)'   },
  Audio:       { color: '#0a84ff', bg: 'rgba(10,132,255,0.08)', border: 'rgba(10,132,255,0.15)' },
  Business:    { color: '#ff3b30', bg: 'rgba(255,59,48,0.08)',  border: 'rgba(255,59,48,0.15)'  },
  Other:       { color: '#636366', bg: 'rgba(99,99,102,0.08)',  border: 'rgba(99,99,102,0.15)'  },
};

// One example listing shown when DB has no public listings yet
// Replace with a real listing by inserting into barter_listings in Supabase
const SEED_LISTINGS = [
  {
    id: 'example-1',
    what_i_offer: 'Business strategy consultation (1 hour)',
    what_i_want: 'Logo or brand design',
    category: 'Business',
    estimated_value: 200,
    profiles: { first_name: 'Gratia Core', barter_rating: 5.0, barter_trades_count: 0 },
  },
];

function GCIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="512" height="512" rx="114" fill="#ff3b30" />
      <text x="256" y="350" fontFamily="'Arial Black',Arial,sans-serif" fontSize="220" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-14">GC</text>
    </svg>
  );
}

// Modal that appears when non-logged-in user clicks "Request"
function LoginGateModal({ listing, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,calc(100vw - 32px))', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.18)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />
        <div style={{ padding: '28px 28px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 14, textAlign: 'center' }}>🤝</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.5px', marginBottom: 8, textAlign: 'center' }}>
            Start your trial to request
          </h2>
          <div style={{ background: 'rgba(48,209,88,0.08)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.5)', margin: '0 0 3px' }}>You want to request:</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1c1c1e', margin: 0 }}>{listing?.what_i_offer}</p>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.55)', lineHeight: 1.65, marginBottom: 20, textAlign: 'center' }}>
            Browse for free. Post listings and request trades with an Individual plan — <strong>7 days free</strong>, then $19/mo.
          </p>
          <Link href={`/pricing`} style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(48,209,88,0.3)', marginBottom: 10 }}>
            Start 7-day free trial →
          </Link>
          <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 100, background: 'rgba(28,28,46,0.05)', border: '0.5px solid rgba(28,28,46,0.1)', color: 'rgba(28,28,30,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, onRequest }) {
  const cat = CAT_COLORS[listing.category] || CAT_COLORS.Other;
  const name = listing.profiles?.first_name || 'Member';
  const rating = listing.profiles?.barter_rating || 5.0;
  const tradeCount = listing.profiles?.barter_trades_count || 0;
  const initial = name[0].toUpperCase();

  const avatarColors = ['linear-gradient(135deg,#0a84ff,#34aadc)', 'linear-gradient(135deg,#7c3aed,#bf5af2)', 'linear-gradient(135deg,#ff9500,#ff6b00)', 'linear-gradient(135deg,#30d158,#1a7a35)', 'linear-gradient(135deg,#ff3b30,#ff6b35)', 'linear-gradient(135deg,#ff9500,#ffd60a)'];
  const avatarBg = avatarColors[name.charCodeAt(0) % avatarColors.length];

  return (
    <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.82)', borderRadius: 20, padding: '16px 16px', boxShadow: '0 2px 0 rgba(255,255,255,0.92) inset, 0 6px 20px rgba(0,0,0,0.07)', transition: 'transform 0.18s, box-shadow 0.18s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(255,255,255,0.92) inset, 0 14px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 0 rgba(255,255,255,0.92) inset, 0 6px 20px rgba(0,0,0,0.07)'; }}>
      {/* User row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', margin: 0 }}>{name}</p>
          <p style={{ fontSize: 10, color: 'rgba(28,28,30,0.4)', margin: 0 }}>⭐ {rating.toFixed(1)} · {tradeCount} trade{tradeCount !== 1 ? 's' : ''}</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: cat.bg, color: cat.color, border: `0.5px solid ${cat.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {CATEGORIES.find(c => c.key === listing.category)?.emoji} {listing.category}
        </span>
      </div>

      {/* Exchange */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <div style={{ flex: 1, background: 'rgba(48,209,88,0.07)', border: '0.5px solid rgba(48,209,88,0.18)', borderRadius: 12, padding: '9px 10px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a7a35', margin: '0 0 3px' }}>Offering</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', margin: '0 0 3px', lineHeight: 1.3 }}>{listing.what_i_offer}</p>
          {listing.estimated_value && <p style={{ fontSize: 10, color: 'rgba(28,28,30,0.4)', margin: 0 }}>~${listing.estimated_value.toLocaleString()}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 16, color: 'rgba(28,28,30,0.2)', flexShrink: 0 }}>⇄</div>
        <div style={{ flex: 1, background: 'rgba(255,59,48,0.06)', border: '0.5px solid rgba(255,59,48,0.14)', borderRadius: 12, padding: '9px 10px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#cc2018', margin: '0 0 3px' }}>Wants</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', margin: 0, lineHeight: 1.3 }}>{listing.what_i_want}</p>
        </div>
      </div>

      <button onClick={() => onRequest(listing)} style={{ width: '100%', padding: '10px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 10px rgba(48,209,88,0.28)' }}>
        Request this trade →
      </button>
    </div>
  );
}

export default function PublicBarterBoard() {
  const router = useRouter();
  const [listings,     setListings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [category,     setCategory]     = useState('all');
  const [search,       setSearch]       = useState('');
  const [gateModal,    setGateModal]    = useState(null);
  const [isLoggedIn,   setIsLoggedIn]   = useState(false);
  const [totalCount,   setTotalCount]   = useState(0);

  useEffect(() => {
    const init = async () => {
      // Check if logged in (changes button behavior)
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      // Load public listings
      const { data, count } = await supabase
        .from('barter_listings')
        .select('*, profiles(first_name, barter_rating, barter_trades_count)', { count: 'exact' })
        .eq('is_public', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setListings(data);
        setTotalCount(count || data.length);
      } else {
        // Use seed listings on launch
        setListings(SEED_LISTINGS);
        setTotalCount(SEED_LISTINGS.length);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleRequest = async (listing) => {
    if (isLoggedIn) {
      // Already logged in — go to dashboard barter page
      router.push(`/dashboard/barter?request=${listing.id}`);
    } else {
      // Show gate modal
      setGateModal(listing);
    }
  };

  const filtered = listings.filter(l => {
    const matchCat = category === 'all' || l.category === category;
    const matchSearch = !search ||
      l.what_i_offer?.toLowerCase().includes(search.toLowerCase()) ||
      l.what_i_want?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        @keyframes rainbowAnim{to{background-position:200% center;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .cat-btn{padding:7px 14px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;border:0.5px solid;transition:all 0.18s;font-family:'DM Sans',sans-serif;white-space:nowrap;}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 60% at 20% -10%,rgba(48,209,88,0.16) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 110%,rgba(10,132,255,0.12) 0%,transparent 60%),#e8eef5', color: '#1c1c1e', fontFamily: "'DM Sans',sans-serif", backgroundAttachment: 'fixed' }}>

        {/* Nav */}
        <header style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: '0.5px solid rgba(255,255,255,0.8)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ff3b30,#ff9f0a,#ffd60a,#30d158,#0a84ff,#34aadc,#ff3b30)', backgroundSize: '200% auto', animation: 'rainbowAnim 3s linear infinite' }} />

          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <GCIcon size={24} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#1c1c1e', letterSpacing: '-0.3px' }}>Gratia Core</span>
              <span style={{ fontSize: 11, color: 'rgba(28,28,30,0.35)', fontWeight: 500 }}>/ Barter Board</span>
            </div>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Live count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.25)', borderRadius: 100, padding: '5px 12px', flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#30d158' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a7a35' }}>{totalCount} open listings</span>
          </div>

          {isLoggedIn ? (
            <Link href="/dashboard/barter" style={{ padding: '8px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(48,209,88,0.28)', flexShrink: 0 }}>
              My trades →
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.55)', border: '0.5px solid rgba(255,255,255,0.8)', color: 'rgba(28,28,30,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Log in</Link>
              <Link href="/pricing" style={{ padding: '8px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(48,209,88,0.28)', flexShrink: 0 }}>Start free trial →</Link>
            </>
          )}
        </header>

        <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 100, padding: '5px 14px 5px 10px', marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(28,28,30,0.55)' }}>Live community board</span>
            </div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.8px', lineHeight: 1.1, color: '#1c1c1e', marginBottom: 10 }}>
              Trade skills,<br />not cash.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(28,28,30,0.52)', marginBottom: 22, maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.6 }}>
              Browse what Gratia Core members are offering and what they want in return. Every trade is timestamped and protected.
            </p>

            {/* Search */}
            <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(28,28,30,0.35)" strokeWidth="2" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills — design, development, writing…"
                style={{ width: '100%', padding: '13px 18px 13px 40px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1c1c1e', boxShadow: '0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {CATEGORIES.map(c => {
              const isActive = category === c.key;
              const col = CAT_COLORS[c.key] || {};
              return (
                <button key={c.key} onClick={() => setCategory(c.key)} className="cat-btn" style={{
                  background: isActive ? (c.key === 'all' ? '#1c1c1e' : col.bg) : 'rgba(255,255,255,0.5)',
                  borderColor: isActive ? (c.key === 'all' ? '#1c1c1e' : col.border) : 'rgba(255,255,255,0.75)',
                  color: isActive ? (c.key === 'all' ? '#fff' : col.color) : 'rgba(28,28,30,0.5)',
                  backdropFilter: 'blur(20px)',
                  fontWeight: isActive ? 700 : 500,
                }}>
                  {c.emoji ? `${c.emoji} ${c.label}` : c.label}
                </button>
              );
            })}
          </div>

          {/* Results count */}
          <p style={{ fontSize: 12, color: 'rgba(28,28,30,0.4)', marginBottom: 14 }}>
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            {category !== 'all' ? ` in ${category}` : ''}
            {search ? ` matching "${search}"` : ''}
          </p>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(28,28,30,0.35)', fontSize: 14 }}>Loading listings…</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🤝</div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: '#1c1c1e', marginBottom: 8, letterSpacing: '-0.5px' }}>Be the first to post in {category !== 'all' ? category : 'this category'}.</p>
              <p style={{ fontSize: 14, color: 'rgba(28,28,30,0.52)', marginBottom: 20, lineHeight: 1.65, maxWidth: 380, margin: '0 auto 20px' }}>
                The board grows when members post. Your listing goes live instantly and is findable on Google.
              </p>
              <Link href="/pricing" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(48,209,88,0.3)' }}>
                Start 7-day free trial to post →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {filtered.map((listing, i) => (
                <div key={listing.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                  <ListingCard listing={listing} onRequest={handleRequest} />
                </div>
              ))}
            </div>
          )}

          {/* CTA banner */}
          {!isLoggedIn && (
            <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.82)', borderRadius: 22, padding: '24px 28px', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', boxShadow: '0 2px 0 rgba(255,255,255,0.92) inset, 0 8px 32px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(48,209,88,0.1)', pointerEvents: 'none' }} />
              <div>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 900, color: '#1c1c1e', marginBottom: 5, letterSpacing: '-0.5px' }}>Post your listing. First 7 days free.</p>
                <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.52)', lineHeight: 1.6, maxWidth: 420 }}>
                  Browse for free — always. Post a listing and request trades with an Individual plan. <strong style={{ color: '#1c1c1e' }}>7 days free</strong>, then $19/mo. Cancel any time before day 8.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <Link href="/login" style={{ padding: '11px 18px', borderRadius: 100, background: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.8)', color: 'rgba(28,28,30,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                <Link href="/pricing" style={{ padding: '11px 22px', borderRadius: 100, background: 'linear-gradient(135deg,#30d158,#1a7a35)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(48,209,88,0.3)' }}>Start 7-day free trial →</Link>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '0.5px solid rgba(28,28,46,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 11, color: 'rgba(28,28,30,0.3)' }}>Gratia Core Barter Exchange · All agreements are timestamped and protected</p>
            <div style={{ display: 'flex', gap: 14 }}>
              <Link href="/terms"   style={{ fontSize: 11, color: 'rgba(28,28,30,0.35)', textDecoration: 'none' }}>Terms</Link>
              <Link href="/privacy" style={{ fontSize: 11, color: 'rgba(28,28,30,0.35)', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/"        style={{ fontSize: 11, color: 'rgba(28,28,30,0.35)', textDecoration: 'none' }}>← Back to Gratia Core</Link>
            </div>
          </div>
        </main>
      </div>

      {gateModal && <LoginGateModal listing={gateModal} onClose={() => setGateModal(null)} />}
    </>
  );
}