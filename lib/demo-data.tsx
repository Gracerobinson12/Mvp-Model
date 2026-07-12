'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Fuel, Zap, Route, Lightbulb, Handshake, FileText, TrendingUp } from 'lucide-react'

// ── Mini live demos ──────────────────────────────────────────
function MiniGasDemo() {
  const [active, setActive] = useState(0)
  const stations = [
    { name: 'Circle K', price: '$3.06', best: true },
    { name: 'Exxon', price: '$3.09', best: false },
    { name: 'Marathon', price: '$3.14', best: false },
  ]
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % stations.length), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.95)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(28,28,30,.4)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><Fuel size={11} /> Gas Intelligence — live</div>
      {stations.map((s, i) => (
        <motion.div key={i}
          animate={{ backgroundColor: active === i ? 'rgba(255,59,48,.08)' : 'rgba(0,0,0,0)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10, marginBottom: 5, border: active === i ? '1px solid rgba(255,59,48,.2)' : '1px solid transparent' }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1c1c1e' }}>{s.best ? '★ ' : ''}{s.name}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: active === i ? '#ff3b30' : '#1c1c1e', fontFamily: "'Sora',sans-serif" }}>{s.price}</span>
        </motion.div>
      ))}
    </div>
  )
}

function MiniEVDemo() {
  const [pct, setPct] = useState(40)
  useEffect(() => {
    const t = setInterval(() => setPct(p => (p >= 90 ? 40 : p + 10)), 700)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.95)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(28,28,30,.4)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><Zap size={11} /> EV Intelligence — live</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1c1c1e' }}>ChargePoint · 0.6mi</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0a84ff' }}>{pct}% charged</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ height: '100%', background: 'linear-gradient(90deg,#0a84ff,#30a0ff)', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 10, color: 'rgba(28,28,30,.4)', marginTop: 8 }}>3 ports open · DC Fast · $0.32/kWh</div>
    </div>
  )
}

function MiniRouteDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep(p => (p + 1) % 4), 900)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.95)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(28,28,30,.4)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><Route size={11} /> Route Finder — live</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <motion.div key={i} animate={{ backgroundColor: step >= i ? '#30d158' : 'rgba(0,0,0,.08)' }} transition={{ duration: .3 }} style={{ flex: 1, height: 5, borderRadius: 3 }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ fontSize: 11, color: 'rgba(28,28,30,.55)' }}>
          {['Calculating route…', 'Scanning stations…', 'Found cheapest stop', 'Saved $4.20 this trip'][step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function VaultDemo() {
  const [hash, setHash] = useState('a3f9...')
  useEffect(() => {
    const t = setInterval(() => setHash(Math.random().toString(16).slice(2, 6) + '...'), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(191,90,242,.2)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(124,58,237,.7)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><Lightbulb size={11} /> Ideas Vault — sealing</div>
      <div style={{ fontSize: 11, color: 'rgba(28,28,30,.5)', marginBottom: 4, fontFamily: 'monospace' }}>SHA-256: <motion.span key={hash} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#bf5af2', fontWeight: 700 }}>{hash}</motion.span></div>
      <div style={{ fontSize: 11, color: 'rgba(28,28,30,.5)', fontFamily: 'monospace' }}>Bitcoin block: <span style={{ color: '#bf5af2' }}>anchoring…</span></div>
    </div>
  )
}

function RegulatoryDemo() {
  const [idx, setIdx] = useState(0)
  const updates = ['IRS: mileage rate updated', 'OSHA: new heat standard', 'DOL: overtime threshold change']
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % updates.length), 2000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(191,90,242,.2)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(124,58,237,.7)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={11} /> Regulatory Updates — feed</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff453a', flexShrink: 0 }} />
        <AnimatePresence mode="wait">
          <motion.span key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ fontSize: 12, color: '#1c1c1e', fontWeight: 600 }}>{updates[idx]}</motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

function MarketDemo() {
  const [val, setVal] = useState(3.12)
  useEffect(() => {
    const t = setInterval(() => setVal(v => parseFloat((v + (Math.random() - 0.5) * 0.03).toFixed(2))), 1200)
    return () => clearInterval(t)
  }, [])
  const up = val >= 3.12
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(191,90,242,.2)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(124,58,237,.7)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><TrendingUp size={11} /> Market Intelligence — ticking</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'rgba(28,28,30,.5)' }}>National avg margin</span>
        <motion.span key={val} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} style={{ fontSize: 14, fontWeight: 800, color: up ? '#30d158' : '#ff453a', fontFamily: "'Sora',sans-serif" }}>{up ? '↑' : '↓'} ${val.toFixed(2)}</motion.span>
      </div>
    </div>
  )
}

function BarterDemo() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStage(p => (p + 1) % 3), 1300)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1px solid rgba(191,90,242,.2)', borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(124,58,237,.7)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><Handshake size={11} /> Barter & Trade — sealing</div>
      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ fontSize: 11, color: 'rgba(28,28,30,.55)' }}>
          {['Drafting agreement…', 'Timestamping…', '✓ Sealed · ID #BT-2917'][stage]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Exported module lists ──────────────────────────────────────
export const CORE_MODULES = [
  { icon: Fuel, color: 'linear-gradient(135deg,#ff3b30,#ff6b35)', title: 'Gas Intelligence', desc: 'Real-time gas prices at every station near you. Compare grades and see exactly which pump saves you the most today.', meta: 'Live · Updated every refresh', demo: MiniGasDemo },
  { icon: Zap, color: 'linear-gradient(135deg,#0a84ff,#30a0ff)', title: 'EV Intelligence', desc: 'Find EV chargers near you with live availability, network, speed, and cost — before you drive there.', meta: 'Live · Open Charge Map data', demo: MiniEVDemo },
  { icon: Route, color: 'linear-gradient(135deg,#30d158,#34c759)', title: 'Route Finder', desc: 'Enter a destination and we calculate the cheapest fuel stop along your route — on the way, not out of the way.', meta: 'Live · Real route calculation', demo: MiniRouteDemo },
]

export const ENTERPRISE_MODULES = [
  { icon: Lightbulb, color: 'linear-gradient(135deg,#ffd60a,#ff9f0a)', title: 'Ideas Vault', desc: 'Timestamp and seal your ideas with SHA-256 hashing and Bitcoin blockchain anchoring. Establish prior art with a court-ready certificate.', meta: 'SHA-256 · RFC 3161 · Bitcoin proof', demo: VaultDemo },
  { icon: Handshake, color: 'linear-gradient(135deg,#0a84ff,#30a0ff)', title: 'Barter & Trade', desc: 'Legally timestamp trade agreements between businesses. Get an Agreement ID and a permanent legal record.', meta: 'Agreement ID · Legal timestamp', demo: BarterDemo },
  { icon: FileText, color: 'linear-gradient(135deg,#ff453a,#ff6b5b)', title: 'Regulatory Updates', desc: 'IRS, OSHA, DOL, FDA, and FTC updates — filtered to your industry so you find out before it costs you.', meta: 'IRS · OSHA · DOL · FDA · FTC', demo: RegulatoryDemo },
  { icon: TrendingUp, color: 'linear-gradient(135deg,#bf5af2,#da8fff)', title: 'Market Intelligence', desc: 'Track margins and spot pricing trends before they hit the news, with live data feeding every signal.', meta: 'Live margins · Trend signals', demo: MarketDemo },
]