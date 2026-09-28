// lib/pricing.ts — SINGLE SOURCE OF TRUTH for tiers, prices, entitlements, + Stripe price IDs.
// After you create Products in Stripe, set each Price ID as a PRIVATE env var (no NEXT_PUBLIC_ prefix
// — these are only read server-side in the checkout route, so they stay off the browser).

export type TierKey = 'solutions' | 'intelligence' | 'bundle';

export interface Tier {
  key: TierKey;
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  annualSaves: number;
  grants: { solutions: boolean; intelligence: boolean };
  accent: string;
  // ⬇️ PASTE YOUR STRIPE PRICE IDs HERE (from Stripe Dashboard → Products).
  // Use TEST-mode price IDs while testing, then swap to LIVE price IDs to go live.
  stripe: { monthly: string; annual: string };
}

export const TIERS: Record<TierKey, Tier> = {
  solutions: {
    key: 'solutions', name: 'Solutions', tagline: 'Ideas Vault + Barter. The tools.',
    monthly: 15, annual: 150, annualSaves: 30,
    grants: { solutions: true, intelligence: false }, accent: '#30d158',
    stripe: {
      monthly: process.env.STRIPE_PRICE_SOLUTIONS_MONTHLY || '',
      annual:  process.env.STRIPE_PRICE_SOLUTIONS_ANNUAL  || '',
    },
  },
  intelligence: {
    key: 'intelligence', name: 'Intelligence', tagline: 'Regulatory + market signals for your industry.',
    monthly: 49, annual: 500, annualSaves: 88,
    grants: { solutions: false, intelligence: true }, accent: '#0a84ff',
    stripe: {
      monthly: process.env.STRIPE_PRICE_INTELLIGENCE_MONTHLY || '',
      annual:  process.env.STRIPE_PRICE_INTELLIGENCE_ANNUAL  || '',
    },
  },
  bundle: {
    key: 'bundle', name: 'Gratia Core', tagline: 'Everything — Intelligence + every tool.',
    monthly: 59, annual: 590, annualSaves: 118,
    grants: { solutions: true, intelligence: true }, accent: '#ff3b30',
    stripe: {
      monthly: process.env.STRIPE_PRICE_BUNDLE_MONTHLY || '',
      annual:  process.env.STRIPE_PRICE_BUNDLE_ANNUAL  || '',
    },
  },
};

export const TRIAL_DAYS = 7;

export function onboardingKind(tier: TierKey): 'solutions' | 'intelligence' {
  return tier === 'solutions' ? 'solutions' : 'intelligence';
}
export function canAccess(area: 'solutions' | 'intelligence', ent: { has_solutions?: boolean; has_intelligence?: boolean }) {
  return area === 'solutions' ? !!ent.has_solutions : !!ent.has_intelligence;
}
// map a Stripe price id back to its tier (used by the webhook)
export function tierFromPrice(priceId: string): TierKey | null {
  for (const k of Object.keys(TIERS) as TierKey[]) {
    if (TIERS[k].stripe.monthly === priceId || TIERS[k].stripe.annual === priceId) return k;
  }
  return null;
}
export const fmt = (n: number) => `$${n.toLocaleString()}`;