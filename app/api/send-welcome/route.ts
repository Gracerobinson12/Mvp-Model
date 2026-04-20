import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, userType, trialDays } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // If Resend not configured, skip silently — don't break signup
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.log('[send-welcome] RESEND_API_KEY not set — skipping email')
      return NextResponse.json({ ok: true, skipped: true })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

    const typeLabel = userType === 'business' ? 'Enterprise'
      : userType === 'freelancer' ? 'Pro'
      : 'Personal'

    await resend.emails.send({
      from:    'GratIA Core <hello@gratiacore.com>',
      to:      email,
      subject: '⛽ Welcome to GratIA Core — your gas intelligence is ready',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f0eff4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
              <tr><td align="center" style="padding-bottom:28px;">
                <div style="font-size:26px;font-weight:900;letter-spacing:-1px;color:#1a1a2e;">
                  GRAT<span style="color:#ff3b30;">IA</span> CORE
                </div>
                <div style="font-size:10px;font-weight:600;letter-spacing:3px;color:rgba(26,26,46,.4);text-transform:uppercase;margin-top:4px;">
                  Business Intelligence Agency
                </div>
              </td></tr>
              <tr><td style="background:#ffffff;border-radius:24px;padding:40px 36px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
                <h1 style="font-size:26px;font-weight:900;letter-spacing:-1px;color:#1a1a2e;margin:0 0 12px;line-height:1.2;">
                  Welcome to GratIA Core ⛽
                </h1>
                <p style="font-size:15px;color:rgba(26,26,46,.6);line-height:1.65;margin:0 0 24px;">
                  Your ${typeLabel} plan is set up. Here's what's live for you right now:
                </p>
                <div style="background:#f8f7fc;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
                  ${['📍 Real-time gas prices at stations near you','🛣️ Route gas finder — cheapest on any trip','🗺️ USA gas price map across all 50 states','🧾 IRS mileage deduction calculator'].map(f=>`
                    <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(26,26,46,.75);margin-bottom:8px;">
                      ${f}
                    </div>
                  `).join('')}
                </div>
                <div style="text-align:center;margin-bottom:20px;">
                  <a href="https://gratiacore.com/dashboard/gas" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff3b30,#ff6b35);color:#fff;border-radius:100px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 16px rgba(255,59,48,.35);">
                    Open Gas Tracker →
                  </a>
                </div>
                <p style="font-size:12px;color:rgba(26,26,46,.35);text-align:center;margin:0;">
                  Questions? Reply to this email — we actually read them.
                </p>
              </td></tr>
              <tr><td style="padding:24px 0;text-align:center;">
                <p style="font-size:11px;color:rgba(26,26,46,.35);margin:0;">
                  © 2025 GratIA Core LLC · <a href="https://gratiacore.com" style="color:rgba(26,26,46,.35);">gratiacore.com</a>
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[send-welcome error]', err?.message)
    // Never fail signup because of email error
    return NextResponse.json({ ok: true, emailError: err?.message })
  }
}