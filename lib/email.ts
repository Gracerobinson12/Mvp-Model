// ═══════════════════════════════════════════════════════════════
// GratIA Core — Email Sequences
// 
// HOW TO SET UP WITH MICROSOFT 365 + RESEND:
// 1. Go to resend.com → sign up
// 2. Add domain: gratiacore.com
// 3. Add the DNS records Resend gives you to Namecheap
// 4. Set from address: hello@gratiacore.com
// 5. Add RESEND_API_KEY to Vercel env vars
// 6. Use the templates below in app/api/send-email/route.ts
//
// TRIGGER EACH EMAIL:
// Day 1 (Welcome)  → immediately after signup (already wired to /api/send-welcome)
// Day 5 (Nudge)    → Vercel Cron Job at 9am: checks trial_ends_at - 2 days
// Day 7 (Last Day) → Vercel Cron Job at 9am: checks trial_ends_at - 0 days
// ═══════════════════════════════════════════════════════════════

// ── DAY 1: WELCOME EMAIL ────────────────────────────────────────
export const welcomeEmail = (params: {
  firstName?: string
  email:      string
  userType:   string  // 'driver' | 'freelancer' | 'business'
  trialDays:  number
}) => {
  const name    = params.firstName || params.email.split('@')[0]
  const typeMap = {
    driver:     { emoji:'🚗', hook:'find the cheapest gas on every route and claim your mileage deductions', cta:'Open Gas Tracker', url:'https://gratiacore.com/dashboard/gas' },
    freelancer: { emoji:'💼', hook:'find every deduction you\'re missing and stay ahead of IRS changes',    cta:'Open Dashboard',   url:'https://gratiacore.com/dashboard' },
    business:   { emoji:'🏢', hook:'stay compliant and never miss a regulatory change that affects you',    cta:'View Regulatory Updates', url:'https://gratiacore.com/dashboard/regulatory' },
  }
  const t = typeMap[params.userType] || typeMap.driver

  return {
    from:    'GratIA Core <hello@gratiacore.com>',
    to:      params.email,
    subject: `${t.emoji} You're in — here's how to get the most out of GratIA Core`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0eff4;font-family:'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:32px;">
        <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#1a1a2e;">
          GRAT<span style="color:#ff3b30;">IA</span> CORE
        </div>
        <div style="font-size:10px;font-weight:600;letter-spacing:3px;color:rgba(26,26,46,.4);text-transform:uppercase;margin-top:4px;">
          Business Intelligence Agency
        </div>
      </td></tr>

      <!-- Main card -->
      <tr><td style="background:#ffffff;border-radius:24px;padding:40px 36px;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Welcome header -->
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#ff3b30;text-transform:uppercase;margin-bottom:8px;">
          Welcome to GratIA Core
        </div>
        <h1 style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#1a1a2e;margin:0 0 12px;line-height:1.2;">
          You're in, ${name}. Let's get you some wins.
        </h1>
        <p style="font-size:15px;color:rgba(26,26,46,.6);line-height:1.65;margin:0 0 28px;">
          Your ${params.trialDays}-day free trial starts now. Here's how to ${t.hook} — starting today.
        </p>

        <!-- Trial countdown -->
        <div style="background:rgba(255,59,48,.07);border:1px solid rgba(255,59,48,.2);border-radius:14px;padding:16px 20px;margin-bottom:28px;">
          <div style="font-size:12px;font-weight:700;color:#ff3b30;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
            Your Trial
          </div>
          <div style="font-size:18px;font-weight:800;color:#1a1a2e;">
            ${params.trialDays} days free — card not charged until day ${params.trialDays + 1}
          </div>
          <div style="font-size:12px;color:rgba(26,26,46,.5);margin-top:4px;">
            Cancel anytime before then and you pay nothing
          </div>
        </div>

        <!-- 3 steps -->
        <div style="margin-bottom:28px;">
          <div style="font-size:12px;font-weight:700;color:rgba(26,26,46,.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">
            Start here — takes 3 minutes
          </div>
          ${[
            { num:'1', title:'Open the Gas Tracker', sub:'See real-time prices at stations near you right now', url:'https://gratiacore.com/dashboard/gas' },
            { num:'2', title:'Set your location', sub:'Enter your ZIP code or allow location access for accurate prices', url:'https://gratiacore.com/dashboard/gas' },
            { num:'3', title:'Check your deduction estimate', sub:'See how much you could claim based on your driving', url:'https://gratiacore.com/dashboard' },
          ].map(step => `
          <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
            <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#ff3b30,#ff6b35);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;">
              ${step.num}
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:2px;">${step.title}</div>
              <div style="font-size:12px;color:rgba(26,26,46,.5);">${step.sub}</div>
            </div>
          </div>
          `).join('')}
        </div>

        <!-- CTA button -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${t.url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:100px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 16px rgba(255,59,48,.35);">
            ${t.cta} →
          </a>
        </div>

        <p style="font-size:12px;color:rgba(26,26,46,.35);text-align:center;line-height:1.6;margin:0;">
          Questions? Reply to this email — we actually read them.<br/>
          <a href="https://gratiacore.com/pricing" style="color:#ff3b30;">View your plan details</a>
        </p>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0;text-align:center;">
        <p style="font-size:11px;color:rgba(26,26,46,.35);margin:0;line-height:1.6;">
          © 2025 GratIA Core LLC · Business Intelligence Agency<br/>
          <a href="https://gratiacore.com" style="color:rgba(26,26,46,.35);">gratiacore.com</a> ·
          <a href="{{unsubscribe_url}}" style="color:rgba(26,26,46,.35);">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
    `
  }
}


// ── DAY 5: NUDGE EMAIL ─────────────────────────────────────────
export const day5Email = (params: {
  firstName?: string
  email:      string
  userType:   string
  planName:   string
  planPrice:  string
}) => {
  const name = params.firstName || params.email.split('@')[0]

  return {
    from:    'GratIA Core <hello@gratiacore.com>',
    to:      params.email,
    subject: `⏳ 2 days left on your trial — here's what you haven't tried yet`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0eff4;font-family:'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <tr><td align="center" style="padding-bottom:28px;">
        <div style="font-size:24px;font-weight:900;letter-spacing:-1px;color:#1a1a2e;">
          GRAT<span style="color:#ff3b30;">IA</span> CORE
        </div>
      </td></tr>

      <tr><td style="background:#ffffff;border-radius:24px;padding:40px 36px;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Urgency banner -->
        <div style="background:rgba(255,159,10,.08);border:1px solid rgba(255,159,10,.25);border-radius:14px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">⏳</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:#8a5c00;">2 days left in your free trial</div>
            <div style="font-size:12px;color:rgba(26,26,46,.5);margin-top:2px;">Your ${params.planName} continues at ${params.planPrice}/mo on day 8</div>
          </div>
        </div>

        <h1 style="font-size:24px;font-weight:900;letter-spacing:-.5px;color:#1a1a2e;margin:0 0 12px;line-height:1.25;">
          Hey ${name} — have you tried the route finder yet?
        </h1>
        <p style="font-size:14px;color:rgba(26,26,46,.6);line-height:1.65;margin:0 0 24px;">
          Most people who try the route gas finder keep their subscription. Here's why — it shows you the cheapest gas station along any route, with the least detour. 
        </p>

        <!-- Feature highlight -->
        <div style="background:#f8f7fc;border-radius:16px;padding:20px;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:700;color:#ff3b30;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Try before your trial ends</div>
          ${[
            { emoji:'🛣️', title:'Route Gas Finder', sub:'Enter any destination — see cheapest gas along your route', url:'https://gratiacore.com/dashboard/gas' },
            { emoji:'🧾', title:'Mileage Deduction Calculator', sub:'See your estimated IRS deduction in real time', url:'https://gratiacore.com/dashboard/gas' },
            { emoji:'📋', title:'Regulatory Updates', sub:'Filter compliance changes to your exact industry', url:'https://gratiacore.com/dashboard/regulatory' },
          ].map(f => `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
            <span style="font-size:20px;">${f.emoji}</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:#1a1a2e;">${f.title}</div>
              <div style="font-size:12px;color:rgba(26,26,46,.5);margin-top:2px;">${f.sub}</div>
            </div>
            <a href="${f.url}" style="font-size:12px;font-weight:600;color:#ff3b30;text-decoration:none;white-space:nowrap;padding:6px 12px;background:rgba(255,59,48,.08);border-radius:8px;">Try it →</a>
          </div>
          `).join('')}
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:20px;">
          <a href="https://gratiacore.com/dashboard" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:100px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 16px rgba(255,59,48,.35);">
            Open Dashboard →
          </a>
        </div>

        <p style="font-size:12px;color:rgba(26,26,46,.35);text-align:center;margin:0;">
          Want to cancel? <a href="https://gratiacore.com/dashboard" style="color:#ff3b30;">Click here</a> — no hard feelings, no hoops.
        </p>

      </td></tr>

      <tr><td style="padding:24px 0;text-align:center;">
        <p style="font-size:11px;color:rgba(26,26,46,.35);margin:0;">
          © 2025 GratIA Core LLC ·
          <a href="{{unsubscribe_url}}" style="color:rgba(26,26,46,.35);">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
    `
  }
}


// ── DAY 7: LAST DAY EMAIL ──────────────────────────────────────
export const day7Email = (params: {
  firstName?: string
  email:      string
  planName:   string
  planPrice:  string
  trialEndDate: string  // formatted date string e.g. "March 29, 2025"
}) => {
  const name = params.firstName || params.email.split('@')[0]

  return {
    from:    'GratIA Core <hello@gratiacore.com>',
    to:      params.email,
    subject: `🔔 Last day of your free trial — your card charges tomorrow`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0eff4;font-family:'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <tr><td align="center" style="padding-bottom:28px;">
        <div style="font-size:24px;font-weight:900;letter-spacing:-1px;color:#1a1a2e;">
          GRAT<span style="color:#ff3b30;">IA</span> CORE
        </div>
      </td></tr>

      <tr><td style="background:#ffffff;border-radius:24px;padding:40px 36px;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Last day banner -->
        <div style="background:rgba(255,59,48,.08);border:1px solid rgba(255,59,48,.2);border-radius:14px;padding:14px 18px;margin-bottom:24px;">
          <div style="font-size:13px;font-weight:700;color:#cc2018;">🔔 Today is the last day of your free trial</div>
          <div style="font-size:12px;color:rgba(26,26,46,.5);margin-top:3px;">
            Your ${params.planName} begins tomorrow at ${params.planPrice}/mo. Cancel today to pay nothing.
          </div>
        </div>

        <h1 style="font-size:24px;font-weight:900;letter-spacing:-.5px;color:#1a1a2e;margin:0 0 12px;line-height:1.25;">
          ${name}, your trial ends tonight.
        </h1>
        <p style="font-size:14px;color:rgba(26,26,46,.6);line-height:1.65;margin:0 0 20px;">
          If you want to keep GratIA Core, you don't need to do anything — your subscription starts automatically tomorrow.
        </p>
        <p style="font-size:14px;color:rgba(26,26,46,.6);line-height:1.65;margin:0 0 24px;">
          If you want to cancel, click below. No questions, no forms, takes 10 seconds.
        </p>

        <!-- What you keep -->
        <div style="background:#f8f7fc;border-radius:16px;padding:20px;margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;color:rgba(26,26,46,.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">What you keep with ${params.planName}</div>
          ${[
            'Real-time gas prices at stations near you',
            'Route gas finder — cheapest stop on any trip',
            'IRS mileage deduction calculator',
            'Regulatory updates filtered to your industry',
            'Price drop alerts via email',
          ].map(f => `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px;color:rgba(26,26,46,.75);">
            <span style="color:#ff3b30;font-weight:700;font-size:14px;">✓</span>${f}
          </div>
          `).join('')}
        </div>

        <!-- Two CTAs -->
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
          <a href="https://gratiacore.com/dashboard" style="flex:1;display:block;padding:13px 24px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;text-align:center;box-shadow:0 4px 14px rgba(255,59,48,.3);min-width:180px;">
            Keep My Access →
          </a>
          <a href="https://gratiacore.com/dashboard/settings" style="flex:1;display:block;padding:13px 24px;background:rgba(0,0,0,.05);color:rgba(26,26,46,.6);border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;text-align:center;border:1px solid rgba(0,0,0,.1);min-width:180px;">
            Cancel Subscription
          </a>
        </div>

        <p style="font-size:12px;color:rgba(26,26,46,.35);text-align:center;margin:0;line-height:1.6;">
          Questions about your subscription? Reply to this email.<br/>
          We're real humans — we'll respond within hours.
        </p>

      </td></tr>

      <tr><td style="padding:24px 0;text-align:center;">
        <p style="font-size:11px;color:rgba(26,26,46,.35);margin:0;">
          © 2025 GratIA Core LLC ·
          <a href="{{unsubscribe_url}}" style="color:rgba(26,26,46,.35);">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
    `
  }
}


// ── HOW TO WIRE THESE UP ────────────────────────────────────────
//
// 1. INSTALL RESEND:
//    npm install resend
//
// 2. ADD ENV VAR IN VERCEL:
//    RESEND_API_KEY=re_xxxxxxxxxxxx
//
// 3. UPDATE app/api/send-welcome/route.ts:
/*
import { Resend } from 'resend'
import { welcomeEmail } from '@/lib/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, userType, trialDays } = await req.json()
  
  const emailData = welcomeEmail({ email, userType, trialDays })
  
  await resend.emails.send({
    from:    emailData.from,
    to:      emailData.to,
    subject: emailData.subject,
    html:    emailData.html,
  })
  
  return Response.json({ ok: true })
}
*/
//
// 4. SET UP CRON JOBS IN vercel.json:
/*
{
  "crons": [
    {
      "path": "/api/cron/trial-day5",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/trial-day7", 
      "schedule": "0 9 * * *"
    }
  ]
}
*/
//
// 5. CREATE app/api/cron/trial-day5/route.ts:
/*
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { day5Email } from '@/lib/emails'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
const resend   = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  // Find users whose trial ends in exactly 2 days
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  const dateStr = twoDaysFromNow.toISOString().split('T')[0]

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, user_type, plan')
    .gte('trial_ends_at', `${dateStr}T00:00:00`)
    .lte('trial_ends_at', `${dateStr}T23:59:59`)

  for (const user of users || []) {
    const planMap = { driver: { name:'Driver Pass', price:'$4.99' }, freelancer: { name:'Freelancer Pass', price:'$7.99' }, business: { name:'Business Pass', price:'$14.99' } }
    const plan = planMap[user.user_type] || planMap.driver
    await resend.emails.send(day5Email({ email: user.email, userType: user.user_type, planName: plan.name, planPrice: plan.price }))
  }

  return Response.json({ sent: users?.length || 0 })
}
*/