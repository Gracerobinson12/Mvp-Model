// app/api/stripe-webhook/route.ts
// ─────────────────────────────────────────────────────────────
// Handles Stripe webhook events to keep Supabase in sync
// 
// SETUP IN STRIPE DASHBOARD:
// 1. Stripe → Developers → Webhooks → Add endpoint
// 2. URL: https://gratiacore.com/api/stripe-webhook
// 3. Events to listen for:
//    - checkout.session.completed
//    - customer.subscription.updated
//    - customer.subscription.deleted
//    - invoice.payment_failed
// 4. Copy the Signing Secret → STRIPE_WEBHOOK_SECRET in Vercel
// ─────────────────────────────────────────────────────────────

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Use service role key for webhook — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_DRIVER!]:      'driver',
  [process.env.STRIPE_PRICE_FREELANCER!]:  'freelancer',
  [process.env.STRIPE_PRICE_BUSINESS!]:    'business',
}

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Checkout completed → subscription started ──────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.client_reference_id || session.metadata?.supabase_user_id

        if (!userId) break

        // Get the subscription to find price/plan
        const subscriptionId = session.subscription as string
        const subscription   = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId        = subscription.items.data[0]?.price.id
        const planKey        = PLAN_MAP[priceId] || 'driver'

        // Trial end date from Stripe
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        await supabase.from('profiles').update({
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: subscriptionId,
          plan:                   planKey,
          plan_status:            'trialing',
          trial_ends_at:          trialEnd,
        }).eq('id', userId)

        console.log(`✓ Subscription started for user ${userId} — ${planKey} plan`)
        break
      }

      // ── Subscription updated (trial → active, plan change) ─
      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const userId  = sub.metadata?.supabase_user_id

        // Find user by stripe_customer_id if no metadata
        let targetUserId = userId
        if (!targetUserId) {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', sub.customer as string)
            .single()
          targetUserId = data?.id
        }

        if (!targetUserId) break

        const priceId = sub.items.data[0]?.price.id
        const planKey = PLAN_MAP[priceId] || 'driver'
        const status  = sub.status // 'trialing' | 'active' | 'past_due' | 'canceled'

        await supabase.from('profiles').update({
          plan:        planKey,
          plan_status: status,
        }).eq('id', targetUserId)

        console.log(`✓ Subscription updated for ${targetUserId} — ${planKey} ${status}`)
        break
      }

      // ── Subscription canceled ──────────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!data?.id) break

        await supabase.from('profiles').update({
          plan:        'free',
          plan_status: 'canceled',
        }).eq('id', data.id)

        console.log(`✓ Subscription canceled for ${data.id}`)
        break
      }

      // ── Payment failed ─────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice  = event.data.object as Stripe.Invoice
        const { data } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (!data?.id) break

        await supabase.from('profiles').update({
          plan_status: 'past_due',
        }).eq('id', data.id)

        // TODO: send payment failed email here
        console.log(`⚠ Payment failed for ${data.email}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}