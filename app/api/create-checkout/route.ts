// app/api/create-checkout/route.ts
// ─────────────────────────────────────────────────────────────
// Creates a Stripe Checkout session with 7-day free trial
// Card collected by Stripe — not charged until trial ends
//
// ENV VARS NEEDED IN VERCEL:
//   STRIPE_SECRET_KEY            = sk_live_xxxx  (or sk_test_xxxx for testing)
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_xxxx
//   STRIPE_PRICE_DRIVER          = price_xxxx  ($4.99/mo)
//   STRIPE_PRICE_FREELANCER      = price_xxxx  ($7.99/mo)
//   STRIPE_PRICE_BUSINESS        = price_xxxx  ($14.99/mo)
//   STRIPE_WEBHOOK_SECRET        = whsec_xxxx  (from Stripe webhook settings)
// ─────────────────────────────────────────────────────────────

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const PRICE_IDS: Record<string, string> = {
  gas:        process.env.STRIPE_PRICE_DRIVER!,
  driver:     process.env.STRIPE_PRICE_DRIVER!,
  freelancer: process.env.STRIPE_PRICE_FREELANCER!,
  business:   process.env.STRIPE_PRICE_BUSINESS!,
  // default fallback
  default:    process.env.STRIPE_PRICE_DRIVER!,
}

export async function POST(req: Request) {
  try {
    const { userId, email, userType, promoCode } = await req.json()

    if (!userId || !email) {
      return Response.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    const priceId = PRICE_IDS[userType] || PRICE_IDS.default

    if (!priceId) {
      return Response.json({ error: 'Invalid price ID — check Vercel env vars' }, { status: 400 })
    }

    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode:                 'subscription',
      payment_method_types: ['card'],
      customer_email:       email,
      line_items: [
        {
          price:    priceId,
          quantity: 1,
        },
      ],
      // 7-day free trial — card saved but NOT charged until day 8
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: userId,
          user_type:        userType,
        },
      },
      // Pass userId through so webhook can update Supabase
      client_reference_id: userId,
      metadata: {
        supabase_user_id: userId,
        user_type:        userType,
      },
      // Where to go after payment
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gratiacore.com'}/dashboard?welcome=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gratiacore.com'}?cancelled=true`,
      // Allow promo codes at checkout
      allow_promotion_codes: true,
    }

    // If a promo code was entered, try to apply it
    if (promoCode && promoCode.trim()) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code:   promoCode.trim().toUpperCase(),
          active: true,
        })
        if (promoCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }]
          // Remove allow_promotion_codes if we're applying one directly
          delete sessionParams.allow_promotion_codes
        }
      } catch {
        // Promo code lookup failed — proceed without it
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return Response.json({ url: session.url, sessionId: session.id })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return Response.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}