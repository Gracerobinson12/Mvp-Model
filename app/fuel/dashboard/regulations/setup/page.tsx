'use client'
// @ts-nocheck
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const INDUSTRIES = [
  { id: 'beauty',       icon: '💅', label: 'Beauty & Personal Care',   desc: 'Esthetician, nail tech, hair salon, massage, spa' },
  { id: 'food',         icon: '🍽️', label: 'Food & Beverage',          desc: 'Restaurant, food truck, catering, bakery, bar' },
  { id: 'construction', icon: '🏗️', label: 'Construction & Trades',    desc: 'Contractor, electrician, plumber, HVAC, landscaping' },
  { id: 'tech',         icon: '💻', label: 'Tech & Digital Services',   desc: 'SaaS, web dev, app development, IT, digital agency' },
  { id: 'gig',          icon: '🚗', label: 'Gig & Delivery',           desc: 'Rideshare, delivery, task apps, independent courier' },
  { id: 'healthcare',   icon: '🏥', label: 'Healthcare & Wellness',     desc: 'Home health aide, therapist, chiropractor, trainer' },
  { id: 'retail',       icon: '🛍️', label: 'Retail & E-commerce',      desc: 'Physical store, online shop, reseller, Amazon FBA' },
  { id: 'creative',     icon: '🎨', label: 'Creative & Freelance',      desc: 'Designer, photographer, writer, videographer, artist' },
  { id: 'industrial',   icon: '🏭', label: 'Industrial & Manufacturing', desc: 'Factory, fabrication, logistics, warehouse, shipping' },
  { id: 'childcare',    icon: '👶', label: 'Childcare & Education',     desc: 'Daycare, tutoring, after school, coaching' },
  { id: 'realestate',   icon: '🏠', label: 'Real Estate',               desc: 'Agent, broker, property manager, investor' },
  { id: 'other',        icon: '📋', label: 'Something else',            desc: 'Tell us what you do and we will find the right rules' },
]

const SUB_ROLES: Record<string, string[]> = {
  beauty:       ['Esthetician / Skin care', 'Nail technician', 'Hair stylist / Cosmetologist', 'Makeup artist', 'Massage therapist', 'Spa / Salon owner', 'Barber'],
  food:         ['Restaurant / Diner', 'Food truck / Cart', 'Catering company', 'Bakery / Desserts', 'Bar / Brewery', 'Ghost kitchen', 'Farmers market vendor'],
  construction: ['General contractor', 'Electrician', 'Plumber', 'HVAC technician', 'Roofer', 'Landscaper / Lawn care', 'Painter', 'Handyman'],
  tech:         ['SaaS / Software product', 'Web development / Agency', 'App development', 'IT services / MSP', 'Digital marketing', 'E-commerce platform'],
  gig:          ['Rideshare (Uber/Lyft)', 'Food delivery (DoorDash/etc)', 'Task apps (TaskRabbit/etc)', 'Instacart / Grocery', 'Independent courier', 'Multiple platforms'],
  healthcare:   ['Home health aide', 'Physical therapist', 'Personal trainer / Coach', 'Chiropractor', 'Therapist / Counselor', 'Nutritionist', 'Nurse practitioner'],
  retail:       ['Physical storefront', 'Online store only', 'Marketplace seller (eBay/Etsy/Amazon)', 'Reseller / Thrift', 'Pop-up / Markets', 'Wholesale / B2B'],
  creative:     ['Graphic designer', 'Photographer', 'Videographer / Editor', 'Copywriter / Content', 'Illustrator / Artist', 'Music / Audio', 'Social media manager'],
  industrial:   ['Manufacturing / Fabrication', 'Warehouse / Distribution', 'Logistics / Trucking', 'Auto repair / Body shop', 'Welding / Metal work'],
  childcare:    ['Daycare center', 'In-home daycare', 'Tutor', 'After school program', 'Sports coach', 'Music / Arts instructor'],
  realestate:   ['Real estate agent', 'Broker / Broker-owner', 'Property manager', 'Real estate investor', 'Appraiser'],
  other:        ['Accounting / Bookkeeping', 'Insurance agent', 'Financial advisor', 'Event planning', 'Pet services', 'Cleaning / Janitorial', 'Other'],
}

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

const BTN = { border: '0.5px solid rgba(26,26,46,.12)', background: 'rgba(255,255,255,.65)', borderRadius: '100px', padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", color: 'rgba(26,26,46,.65)', transition: 'all .2s' }
const BTN_ON = { ...BTN, background: 'rgba(255,59,48,.09)', borderColor: 'rgba(255,59,48,.35)', color: '#cc2018', fontWeight: 600 }

export default function RegSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [industry, setIndustry]   = useState('')
  const [role, setRole]           = useState('')
  const [situations, setSituations] = useState<string[]>([])
  const [structure, setStructure] = useState('')
  const [empCount, setEmpCount]   = useState('')
  const [clientType, setClientType] = useState('')
  const [employerSize, setEmployerSize] = useState('')
  const [state, setState]         = useState('')
  const [county, setCounty]       = useState('')
  const [city, setCity]           = useState('')
  const [saving, setSaving]       = useState(false)

  const toggleSit = (s: string) => setSituations(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const selectedInd = INDUSTRIES.find(i => i.id === industry)

  const save = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({
        reg_state: state, reg_county: county, reg_city: city,
        reg_industries: [industry], reg_role: role,
        reg_situations: situations, reg_structure: structure,
        reg_employee_count: empCount, reg_alerts: true,
        reg_frequency: 'instant', reg_onboarded: true,
      }).eq('id', user.id)
      router.push('/dashboard/regulations')
    } catch(e) { setSaving(false) }
  }

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={active ? BTN_ON : BTN}>{label}</button>
  )

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '0.5px solid rgba(26,26,46,.15)', background: 'rgba(255,255,255,.65)', fontSize: 13, fontFamily: "'DM Sans',system-ui,sans-serif", outline: 'none', color: '#1a1a2e' }

  const steps = ['Industry', 'Your role', 'Work situation', 'Location']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ background: '#f0eff4', backgroundImage: 'radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,.09) 0%,transparent 55%)', minHeight: '100vh', padding: '24px 16px 80px', color: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 3, borderRadius: 2, background: i <= step ? '#ff3b30' : 'rgba(26,26,46,.1)', transition: 'background .3s', marginBottom: 4 }} />
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, color: i <= step ? '#ff3b30' : 'rgba(26,26,46,.3)', textTransform: 'uppercase', textAlign: 'center' }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ animation: 'fadeUp .3s ease both' }}>

          {/* ── STEP 0: Industry ── */}
          {step === 0 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 6 }}>Step 1 of 4 · Enterprise · Regulatory setup</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: -1, color: '#1a1a2e', marginBottom: 6, lineHeight: 1.1 }}>What kind of work do you do?</div>
              <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', marginBottom: 20, lineHeight: 1.6 }}>Pick the closest match. We use this to filter the regulations that actually apply to you — nothing irrelevant.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {INDUSTRIES.map(ind => (
                  <button key={ind.id} onClick={() => { setIndustry(ind.id); setRole('') }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 16, border: `0.5px solid ${industry === ind.id ? 'rgba(255,59,48,.35)' : 'rgba(26,26,46,.1)'}`, background: industry === ind.id ? 'rgba(255,59,48,.08)' : 'rgba(255,255,255,.65)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',system-ui,sans-serif', transition: 'all .15s", backdropFilter: 'blur(20px)' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{ind.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: industry === ind.id ? '#cc2018' : '#1a1a2e' }}>{ind.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', marginTop: 2 }}>{ind.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => industry && setStep(1)} style={{ width: '100%', marginTop: 16, padding: 13, borderRadius: 100, border: 'none', background: industry ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.08)', color: industry ? '#fff' : 'rgba(26,26,46,.3)', fontSize: 14, fontWeight: 700, cursor: industry ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: industry ? '0 4px 14px rgba(255,59,48,.35)' : 'none' }}>
                Continue →
              </button>
            </>
          )}

          {/* ── STEP 1: Role ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 6 }}>Step 2 of 4 · Regulatory setup</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>{selectedInd?.icon}</span>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: -1, color: '#1a1a2e', lineHeight: 1.1 }}>Which best describes you?</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', marginBottom: 20, lineHeight: 1.6 }}>
                {industry === 'beauty' && 'Alabama requires a state cosmetology or esthetics license. We track renewal dates and CE requirements for your specific license.'}
                {industry === 'food' && 'Food businesses face health department inspections, food handler certs, and local permitting. Your specific type determines which apply.'}
                {industry === 'construction' && 'Alabama requires state contractor licensing for most trades above certain project values.'}
                {industry === 'tech' && 'Tech businesses face data privacy laws, SaaS tax rules, and contractor classification regulations.'}
                {industry === 'gig' && 'Gig workers face 1099 thresholds, mileage deduction rules, and state-specific classification laws.'}
                {!['beauty','food','construction','tech','gig'].includes(industry) && 'Your specific role determines which state licenses, certifications, and regulations apply to you.'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(SUB_ROLES[industry] || []).map(r => (
                  <button key={r} onClick={() => setRole(r)} style={role === r ? BTN_ON : BTN}>{r}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(0)} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(26,26,46,.12)', background: 'transparent', color: 'rgba(26,26,46,.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>← Back</button>
                <button onClick={() => role && setStep(2)} style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: role ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.08)', color: role ? '#fff' : 'rgba(26,26,46,.3)', fontSize: 14, fontWeight: 700, cursor: role ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Continue →</button>
              </div>
            </>
          )}

          {/* ── STEP 2: Work situation ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 6 }}>Step 3 of 4 · Regulatory setup</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: -1, color: '#1a1a2e', marginBottom: 6, lineHeight: 1.1 }}>What is your work situation?</div>
              <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', marginBottom: 18, lineHeight: 1.6 }}>Pick everything that applies — you can have a day job AND a side business. Regulations affect you from every angle.</div>

              {[
                { id: 'owner', icon: '🏢', label: 'I run my own business', desc: 'LLC, sole prop, S-Corp — I am the owner' },
                { id: 'freelance', icon: '💼', label: 'I freelance or do contract work', desc: '1099 income, project-based, independent contractor' },
                { id: 'employee', icon: '👔', label: 'I work for someone else', desc: 'W-2 employee — I want to know what applies to my employer' },
                { id: 'mix', icon: '🔄', label: 'I do a mix of all of these', desc: 'Day job plus side business or freelance' },
              ].map(sit => (
                <div key={sit.id} style={{ marginBottom: 8 }}>
                  <button onClick={() => toggleSit(sit.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 16, border: `0.5px solid ${situations.includes(sit.id) ? 'rgba(255,59,48,.35)' : 'rgba(26,26,46,.1)'}`, background: situations.includes(sit.id) ? 'rgba(255,59,48,.08)' : 'rgba(255,255,255,.65)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',system-ui,sans-serif", backdropFilter: 'blur(20px)' }}>
                    <span style={{ fontSize: 22 }}>{sit.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: situations.includes(sit.id) ? '#cc2018' : '#1a1a2e' }}>{sit.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(26,26,46,.5)', marginTop: 2 }}>{sit.desc}</div>
                    </div>
                    {situations.includes(sit.id) && <span style={{ marginLeft: 'auto', color: '#cc2018', fontWeight: 700, fontSize: 14 }}>✓</span>}
                  </button>

                  {/* Reveal extras */}
                  {situations.includes(sit.id) && sit.id === 'owner' && (
                    <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(255,59,48,.04)', border: '0.5px solid rgba(255,59,48,.12)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>Business structure</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {['Sole proprietor','LLC','S-Corp','C-Corp','Partnership'].map(s => (
                          <button key={s} onClick={() => setStructure(s)} style={structure === s ? BTN_ON : BTN}>{s}</button>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>How many people work with you?</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['Just me','2–5','6–15','16–50','50+'].map(e => (
                          <button key={e} onClick={() => setEmpCount(e)} style={empCount === e ? BTN_ON : BTN}>{e}</button>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', marginTop: 8, lineHeight: 1.5 }}>Employee count matters — FMLA, ACA health mandates, and minimum wage rules all have size thresholds.</div>
                    </div>
                  )}
                  {situations.includes(sit.id) && sit.id === 'freelance' && (
                    <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(255,59,48,.04)', border: '0.5px solid rgba(255,59,48,.12)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>Who do you mostly work for?</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['Small businesses','Mid-size companies','Large corporations','Other freelancers','Mix of all'].map(c => (
                          <button key={c} onClick={() => setClientType(c)} style={clientType === c ? BTN_ON : BTN}>{c}</button>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', marginTop: 8, lineHeight: 1.5 }}>As a freelancer you face 1099-K rules, ABC contractor classification, quarterly estimated taxes, and state contractor registration.</div>
                    </div>
                  )}
                  {situations.includes(sit.id) && sit.id === 'employee' && (
                    <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(255,59,48,.04)', border: '0.5px solid rgba(255,59,48,.12)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 8 }}>Approximately how big is your employer?</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['Under 10','10–50','50–250','250+','Not sure'].map(s => (
                          <button key={s} onClick={() => setEmployerSize(s)} style={employerSize === s ? BTN_ON : BTN}>{s} employees</button>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', marginTop: 8, lineHeight: 1.5 }}>Regulations affect your rights as an employee — minimum wage, overtime, FMLA eligibility, and non-compete laws all depend on your employer size.</div>
                    </div>
                  )}
                  {situations.includes(sit.id) && sit.id === 'mix' && (
                    <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(48,209,88,.05)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 12, fontSize: 12, color: 'rgba(26,26,46,.6)', lineHeight: 1.6 }}>
                      This is actually the most important situation to track. When you have W-2 income AND freelance or a side business, you face regulations from every direction at once — and most people miss something.
                    </div>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(26,26,46,.12)', background: 'transparent', color: 'rgba(26,26,46,.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>← Back</button>
                <button onClick={() => situations.length > 0 && setStep(3)} style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: situations.length > 0 ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.08)', color: situations.length > 0 ? '#fff' : 'rgba(26,26,46,.3)', fontSize: 14, fontWeight: 700, cursor: situations.length > 0 ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Continue →</button>
              </div>
            </>
          )}

          {/* ── STEP 3: Location ── */}
          {step === 3 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#ff3b30', textTransform: 'uppercase', marginBottom: 6 }}>Step 4 of 4 · Regulatory setup</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: -1, color: '#1a1a2e', marginBottom: 6, lineHeight: 1.1 }}>Where is your business located?</div>
              <div style={{ fontSize: 13, color: 'rgba(26,26,46,.5)', marginBottom: 20, lineHeight: 1.6 }}>We monitor at every level — federal, state, county, and city — so you never miss a local ordinance or license deadline.</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 6 }}>State *</div>
                <select value={state} onChange={e => setState(e.target.value)} style={{ ...inputStyle }}>
                  <option value="">Select your state...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 6 }}>County</div>
                <input value={county} onChange={e => setCounty(e.target.value)} placeholder="e.g. Lee County" style={inputStyle} />
                <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', marginTop: 4 }}>County commission meetings, county license renewals, county zoning updates</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,46,.5)', marginBottom: 6 }}>City</div>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Auburn" style={inputStyle} />
                <div style={{ fontSize: 10, color: 'rgba(26,26,46,.4)', marginTop: 4 }}>City council ordinances, city business licenses, city-specific regulations</div>
              </div>

              {/* Preview */}
              {state && (
                <div style={{ background: 'rgba(48,209,88,.06)', border: '0.5px solid rgba(48,209,88,.2)', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1a7a35', marginBottom: 8 }}>You will get alerts from</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {[
                      '🏛️ Federal Register', '⚖️ IRS', '📋 Dept of Labor', '🏢 SBA',
                      `📋 ${state} Legislature`, `💰 ${state} Dept of Revenue`,
                      county ? `🏢 ${county} Commission` : null,
                      city ? `🏙️ ${city} City Council` : null,
                    ].filter(Boolean).map(s => (
                      <span key={s as string} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, background: 'rgba(26,26,46,.06)', border: '0.5px solid rgba(26,26,46,.1)', color: 'rgba(26,26,46,.6)', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(26,26,46,.5)', marginTop: 8 }}>
                    All filtered to: <strong style={{ color: '#1a1a2e' }}>{selectedInd?.label} — {role}</strong> · Updated hourly
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ padding: '13px 18px', borderRadius: 100, border: '0.5px solid rgba(26,26,46,.12)', background: 'transparent', color: 'rgba(26,26,46,.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>← Back</button>
                <button onClick={save} disabled={!state || saving} style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: state ? 'linear-gradient(135deg,#ff3b30,#ff6b35)' : 'rgba(26,26,46,.08)', color: state ? '#fff' : 'rgba(26,26,46,.3)', fontSize: 14, fontWeight: 700, cursor: state ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',system-ui,sans-serif", boxShadow: state ? '0 4px 14px rgba(255,59,48,.35)' : 'none' }}>
                  {saving ? 'Setting up...' : 'Start monitoring my regulations →'}
                </button>
              </div>
            </>
          )}

          </div>
        </div>
      </div>
    </>
  )
}