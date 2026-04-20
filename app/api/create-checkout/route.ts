import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    // ── Check env vars first ──────────────────────────────────
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: 'Stripe not configured — missing STRIPE_SECRET_KEY in Vercel env vars' }, { status: 500 })
    }
    if (!process.env.STRIPE_PRICE_DRIVER) {
      return Response.json({ error: 'Stripe not configured — missing STRIPE_PRICE_DRIVER in Vercel env vars' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })

    const { userId, email, userType } = await req.json()

    if (!userId || !email) {
      return Response.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    // All plans use driver/Core Pass price for now
    const priceId = process.env.STRIPE_PRICE_DRIVER

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      customer_email:       email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: userId,
          user_type:        userType || 'driver',
        },
      },
      client_reference_id: userId,
      metadata: {
        supabase_user_id: userId,
        user_type:        userType || 'driver',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gratiacore.com'}/dashboard`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gratiacore.com'}`,
      allow_promotion_codes: true,
    })

    return Response.json({ url: session.url, sessionId: session.id })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return Response.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}