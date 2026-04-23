import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const Stripe = (await import('stripe')).default

    const key = process.env.STRIPE_SECRET_KEY
    const priceId = process.env.STRIPE_PRICE_DRIVER
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gratiacore.com'

    if (!key) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY missing in Vercel env vars' },
        { status: 500 }
      )
    }
    if (!priceId) {
      return NextResponse.json(
        { error: 'STRIPE_PRICE_DRIVER missing in Vercel env vars' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' })

    const body = await req.json()
    const { userId, email, userType } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    // Check if user has a promo code with extended trial days
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get promo redemption for this user
    const { data: redemption } = await supabase
      .from('promo_redemptions')
      .select('code')
      .eq('user_id', userId)
      .single()

    let trialDays = 7
    if (redemption?.code) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('trial_days')
        .eq('code', redemption.code)
        .eq('active', true)
        .single()
      if (promo?.trial_days) trialDays = promo.trial_days
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          supabase_user_id: userId,
          user_type: userType || 'driver',
        },
      },
      client_reference_id: userId,
      metadata: {
        supabase_user_id: userId,
        user_type: userType || 'driver',
      },
      success_url: `${siteUrl}/dashboard`,
      cancel_url: `${siteUrl}`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error('[Stripe Checkout Error]', err?.message, err?.type, err?.code)
    return NextResponse.json(
      { error: err?.message || 'Stripe checkout failed' },
      { status: 500 }
    )
  }
}