// app/api/cron/regulations/route.ts
// Vercel cron: runs every hour — add to vercel.json:
// { "crons": [{ "path": "/api/cron/regulations", "schedule": "0 * * * *" }] }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SOURCES = [
  { name: 'Federal Register', url: 'https://www.federalregister.gov/api/v1/articles.rss?per_page=20&order=newest', scope: 'federal', states: ['all'], industries: ['all'] },
  { name: 'IRS Newsroom',     url: 'https://www.irs.gov/rss-newsroom',  scope: 'federal', states: ['all'], industries: ['all'] },
  { name: 'Dept of Labor',   url: 'https://www.dol.gov/rss/releases.xml', scope: 'federal', states: ['all'], industries: ['all'] },
  { name: 'SBA News',        url: 'https://www.sba.gov/rss.xml',       scope: 'federal', states: ['all'], industries: ['all'] },
  { name: 'Alabama Legislature', url: 'http://alisondb.legislature.state.al.us/rss/bills.rss', scope: 'state', states: ['Alabama'], industries: ['all'] },
  { name: 'Alabama Dept of Revenue', url: 'https://www.revenue.alabama.gov/rss', scope: 'state', states: ['Alabama'], industries: ['all'] },
]

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let newCount = 0
  const errors: string[] = []

  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { headers: { 'User-Agent': 'GratiaCore/1.0' } })
      if (!res.ok) continue
      const xml = await res.text()

      // Parse RSS items
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
        const get = (tag: string) => m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
        return { title: get('title'), content: get('description') || get('summary'), url: get('link'), publishedAt: get('pubDate') }
      }).filter(i => i.title && i.url)

      for (const item of items.slice(0, 10)) {
        const hash = crypto.createHash('sha256').update(source.name + item.url + item.title).digest('hex')

        // Check if already ingested
        const { data: existing } = await supabase.from('regulatory_updates').select('id').eq('source_hash', hash).single()
        if (existing) continue

        // Tag with Claude
        const tagged = await tagWithClaude(item, source)
        if (!tagged || !tagged.is_relevant) continue

        const { error } = await supabase.from('regulatory_updates').insert({
          source_url: item.url, source_name: source.name,
          title: tagged.title, summary: tagged.summary,
          urgency: tagged.urgency, deadline: tagged.deadline,
          states: tagged.states || source.states,
          counties: tagged.counties || [],
          cities: tagged.cities || [],
          industries: tagged.industries || source.industries,
          situations: tagged.situations || ['all'],
          tags: tagged.tags || [],
          published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
          source_hash: hash, action_url: item.url,
        })
        if (!error) newCount++
      }
    } catch(e: any) {
      errors.push(`${source.name}: ${e.message}`)
    }
  }

  // Send alerts for new updates
  if (newCount > 0) await matchAndAlert()

  return NextResponse.json({ ok: true, new: newCount, errors, timestamp: new Date().toISOString() })
}

async function tagWithClaude(item: any, source: any) {
  const prompt = `You are a regulatory intelligence system for small businesses and workers.
Analyze this update and return ONLY a valid JSON object, no markdown.

SOURCE: ${source.name}
TITLE: ${item.title}
CONTENT: ${(item.content || '').slice(0, 1500)}

{
  "title": "10 word max plain English title for a small business owner",
  "summary": "2-3 sentences: what it is, who it affects, what action if any is needed",
  "urgency": "action_required" or "upcoming" or "monitoring",
  "deadline": "YYYY-MM-DD or null",
  "states": ["Alabama"] or ["all"] for federal,
  "counties": [] or specific counties,
  "cities": [] or specific cities,
  "industries": array from: ["all","beauty","food","construction","tech","gig","healthcare","retail","creative","industrial","childcare","realestate"],
  "situations": array from: ["all","owner","freelance","employee","mix"],
  "tags": array from: ["tax","labor","license","zoning","safety","privacy","benefits","contracts"],
  "is_relevant": true if it affects a small business or worker, false if irrelevant
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text?.replace(/```json?|```/g, '').trim() || '{}'
    return JSON.parse(text)
  } catch(e) { return null }
}

async function matchAndAlert() {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data: updates } = await supabase.from('regulatory_updates').select('*').gte('fetched_at', since)
  if (!updates?.length) return

  const { data: users } = await supabase.from('profiles').select('id,email,full_name,reg_state,reg_county,reg_city,reg_industries,reg_situations,reg_frequency').eq('reg_alerts', true).eq('reg_onboarded', true)
  if (!users?.length) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY!)

  for (const user of users) {
    const matched = updates.filter(u => {
      const stateOk    = u.states.includes('all') || u.states.includes(user.reg_state)
      const countyOk   = !u.counties?.length || u.counties.includes(user.reg_county)
      const cityOk     = !u.cities?.length || u.cities.includes(user.reg_city)
      const industryOk = u.industries.includes('all') || (user.reg_industries || []).some((i: string) => u.industries.includes(i))
      const sitOk      = u.situations.includes('all') || (user.reg_situations || []).some((s: string) => u.situations.includes(s))
      return stateOk && countyOk && cityOk && industryOk && sitOk
    })
    if (!matched.length) continue

    const { data: sent } = await supabase.from('regulation_alerts_sent').select('update_id').eq('user_id', user.id).in('update_id', matched.map(u => u.id))
    const sentIds = new Set(sent?.map(s => s.update_id) || [])
    const toSend = matched.filter(u => !sentIds.has(u.id))
    if (!toSend.length) continue

    const urgent = toSend.filter(u => u.urgency === 'action_required')
    const name = user.full_name?.split(' ')[0] || 'there'
    await resend.emails.send({
      from: 'Gratia Core <alerts@gratiacore.com>',
      to: user.email,
      subject: urgent.length ? `⚠️ ${urgent.length} regulatory action required — ${new Date().toLocaleDateString()}` : `📋 ${toSend.length} regulatory updates for your business`,
      html: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px"><h2>Hi ${name}</h2><p>Here are your latest regulatory updates for your business.</p>${toSend.map(u => `<div style="border:1px solid ${u.urgency==='action_required'?'#fca5a5':'#e5e7eb'};border-radius:12px;padding:16px;margin-bottom:12px"><strong>${u.title}</strong><p>${u.summary}</p>${u.deadline?`<p>Deadline: ${u.deadline}</p>`:''}<a href="${u.action_url}">Read more →</a></div>`).join('')}<p style="font-size:12px;color:#aaa"><a href="https://gratiacore.com/dashboard/regulations/setup">Manage preferences</a></p></div>`
    })

    await supabase.from('regulation_alerts_sent').insert(toSend.map(u => ({ user_id: user.id, update_id: u.id })))
  }
}