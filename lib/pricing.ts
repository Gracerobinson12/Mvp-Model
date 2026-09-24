// lib/pricing.ts — SINGLE SOURCE OF TRUTH for tiers, prices, and entitlements.
// Every CTA, the pricing page, signup, and Stripe read from here. Change a number once.

export type TierKey = 'solutions' | 'intelligence' | 'bundle';

export interface Tier {
  key: TierKey;
  name: string;
  tagline: string;
  monthly: number;         // USD / month
  annual: number;          // USD / year (billed once)
  annualSaves: number;     // marketing "save $X"
  grants: { solutions: boolean; intelligence: boolean };  // entitlements this tier flips on
  accent: string;
  // Stripe price IDs — fill these in from your Stripe dashboard (test mode first).
  stripe: { monthly: string; annual: string };
}

export const TIERS: Record<TierKey, Tier> = {
  solutions: {
    key: 'solutions',
    name: 'Solutions',
    tagline: 'Ideas Vault + Barter. The tools.',
    monthly: 15,
    annual: 150,
    annualSaves: 30,
    grants: { solutions: true, intelligence: false },
    accent: '#30d158',
    stripe: { monthly: 'price_SOLUTIONS_MONTHLY', annual: 'price_SOLUTIONS_ANNUAL' },
  },
  intelligence: {
    key: 'intelligence',
    name: 'Intelligence',
    tagline: 'Regulatory + market signals for your industry.',
    monthly: 49,
    annual: 500,
    annualSaves: 88,
    grants: { solutions: false, intelligence: true },
    accent: '#0a84ff',
    stripe: { monthly: 'price_INTELLIGENCE_MONTHLY', annual: 'price_INTELLIGENCE_ANNUAL' },
  },
  bundle: {
    key: 'bundle',
    name: 'Gratia Core',
    tagline: 'Everything — Intelligence + every tool.',
    monthly: 59,
    annual: 590,
    annualSaves: 118,
    grants: { solutions: true, intelligence: true },
    accent: '#ff3b30',
    stripe: { monthly: 'price_BUNDLE_MONTHLY', annual: 'price_BUNDLE_ANNUAL' },
  },
};

export const TRIAL_DAYS = 7;

// Which onboarding a tier needs after payment.
export function onboardingKind(tier: TierKey): 'solutions' | 'intelligence' {
  // Bundle uses the Intelligence wizard (superset: needs industry/state/etc).
  return tier === 'solutions' ? 'solutions' : 'intelligence';
}

// Does a set of entitlements grant access to a given area?
export function canAccess(area: 'solutions' | 'intelligence', ent: { has_solutions?: boolean; has_intelligence?: boolean }) {
  return area === 'solutions' ? !!ent.has_solutions : !!ent.has_intelligence;
}

export const fmt = (n: number) => `$${n.toLocaleString()}`;