import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json()
    if (!sessionId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const Stripe = (await import('stripe')).default
    const { createClient } = await import('@supabase/supabase-js')

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ ok: false, reason: 'not paid' })
    }

    const sub = session.subscription as any
    const trialEnd = sub?.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('profiles').update({
      stripe_customer_id:     session.customer as string,
      stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : sub?.id,
      plan:                   'driver',
      plan_status:            sub?.status || 'trialing',
      trial_ends_at:          trialEnd,
    }).eq('id', userId)

    return NextResponse.json({ ok: true, status: sub?.status || 'trialing' })
  } catch (err: any) {
    console.error('[verify-session]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}