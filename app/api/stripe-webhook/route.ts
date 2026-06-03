// app/api/stripe/webhook/route.ts
// ── COMPLETE STRIPE WEBHOOK ───────────────────────────────────────────────────
// Handles: checkout complete, subscription updated, subscription deleted,
//          payment failed, trial ending — keeps profiles.plan always in sync

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ← service role bypasses RLS so webhook can write
)

// Map Stripe price IDs → plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_BASIC      || 'price_basic']:      'basic',       // $2.99 - gas only 2mi
  [process.env.STRIPE_PRICE_CORE       || 'price_core']:       'core',        // $4.99 - full gas + vault
  [process.env.STRIPE_PRICE_PRO        || 'price_pro']:        'pro',         // $19.99
  [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: 'enterprise',  // $79.99
  [process.env.STRIPE_PRICE_DRIVER     || '']:                 'core',        // legacy
}

function getPlanFromPriceId(priceId: string): string {
  return PRICE_TO_PLAN[priceId] || 'core'
}

async function updateUserPlan(customerId: string, updates: {
  plan?: string
  plan_status?: string
  stripe_subscription_id?: string
  trial_ends_at?: string | null
  trial_used?: boolean
}) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, plan_updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Failed to update plan for customer', customerId, error)
    return false
  }
  return true
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Stripe webhook:', event.type)

  try {
    switch (event.type) {

      // ── User completes checkout ──────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.userId || session.client_reference_id

        // Fetch the subscription to get price details
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id
        const plan = getPlanFromPriceId(priceId)
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
        const status = sub.status === 'trialing' ? 'trialing' : 'active'

        // Update by customer ID (already linked) or by user ID from metadata
        if (customerId) {
          await updateUserPlan(customerId, {
            plan, plan_status: status,
            stripe_subscription_id: subscriptionId,
            trial_ends_at: trialEnd,
            trial_used: true,
          })
        } else if (userId) {
          await supabase.from('profiles').update({
            plan, plan_status: status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            trial_ends_at: trialEnd,
            trial_used: true,
            plan_updated_at: new Date().toISOString(),
          }).eq('id', userId)
        }
        break
      }

      // ── Subscription renewed / upgraded / downgraded ─────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price?.id
        const plan = getPlanFromPriceId(priceId)
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null

        let plan_status: string
        switch (sub.status) {
          case 'active':    plan_status = 'active'; break
          case 'trialing':  plan_status = 'trialing'; break
          case 'past_due':  plan_status = 'past_due'; break
          case 'canceled':  plan_status = 'canceled'; break
          case 'unpaid':    plan_status = 'unpaid'; break
          default:          plan_status = sub.status
        }

        await updateUserPlan(customerId, {
          plan, plan_status,
          stripe_subscription_id: sub.id,
          trial_ends_at: trialEnd,
        })
        break
      }

      // ── Subscription cancelled → 30-day grace then full deletion ──────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        // Set deletion_scheduled_at to 30 days from now
        // A separate cron job will delete the account after this date
        const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('stripe_customer_id', customerId)
          .single()

        await supabase.from('profiles').update({
          plan_status: 'canceled',
          deletion_scheduled_at: deletionDate,
          plan_updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)

        // Send warning email via Resend
        if (profile?.email) {
          try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY!)
            await resend.emails.send({
              from: 'Gratia Core <support@gratiacore.com>',
              to: profile.email,
              subject: 'Your Gratia Core account will be deleted in 30 days',
              html: `
                <div style="font-family:system-ui;max-width:540px;margin:0 auto;padding:24px">
                  <h2>Hi ${profile.full_name?.split(' ')[0] || 'there'}</h2>
                  <p>Your Gratia Core subscription has been cancelled.</p>
                  <p>Your account and all data will be permanently deleted on <strong>${new Date(deletionDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</strong>.</p>
                  <p>If this was a mistake, you can resubscribe before that date and your data will be fully restored.</p>
                  <a href="https://gratiacore.com/dashboard/billing" style="display:inline-block;padding:12px 24px;background:#ff3b30;color:#fff;border-radius:100px;text-decoration:none;font-weight:600;margin-top:12px">Resubscribe to keep my account →</a>
                  <p style="margin-top:24px;font-size:12px;color:#999">Gratia Core Enterprise LLC · support@gratiacore.com</p>
                </div>
              `
            })
          } catch(e) { console.error('Failed to send deletion warning:', e) }
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await updateUserPlan(customerId, { plan_status: 'past_due' })
        // TODO: send Resend email warning user their payment failed
        break
      }

      // ── Trial ending in 3 days ────────────────────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null

        await updateUserPlan(customerId, { trial_ends_at: trialEnd })
        // TODO: send Resend reminder email
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}