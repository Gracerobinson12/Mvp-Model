// lib/modules.ts — the single source of truth for the bubble ecosystem.
// Add a module here and it shows up on Home, in Add modules, in billing and in the webhook.
// Prices are display values (USD / month). Stripe price IDs come from env (server only).

export type ModuleId = 'protect' | 'vault' | 'barter' | 'advisory';

export type ModuleDef = {
  id: ModuleId;
  name: string;
  tagline: string;          // one line under the name
  price: number;            // 0 = free / always included
  href: string;             // where the bubble opens
  external?: boolean;       // opens another app (GC Protect)
  bullets: string[];        // "what you get"
  priceEnv: string;         // env var holding the Stripe price id (server only)
};

export const MODULES: Record<ModuleId, ModuleDef> = {
  protect: {
    id: 'protect', name: 'GC Protect', price: 5, href: '/dashboard/protect',
    tagline: 'Sensitive details become tokens before any AI sees them.',
    bullets: ['Names, SSNs, cards, keys caught', 'Works with any AI you use', 'Audit log you can export'],
    priceEnv: 'STRIPE_PRICE_PROTECT',
  },
  vault: {
    id: 'vault', name: 'Idea Vault', price: 5, href: '/dashboard/vault',
    tagline: 'Timestamped proof that your idea existed today.',
    bullets: ['Seal ideas with SHA-256 + UTC timestamp', 'Signed certificate you can download', 'Only you can read what you sealed'],
    priceEnv: 'STRIPE_PRICE_VAULT',
  },
  barter: {
    id: 'barter', name: 'Barter', price: 5, href: '/dashboard/barter',
    tagline: 'Trade services with another founder. Both sign, both get the agreement.',
    bullets: ['Written agreement, emailed to both', 'Confirm by link, no account needed', 'Edit & resend anytime'],
    priceEnv: 'STRIPE_PRICE_BARTER',
  },
  advisory: {
    id: 'advisory', name: 'Advisory', price: 0, href: '/dashboard/advisory',
    tagline: 'Real people. Websites, consulting, tech & automation, security & privacy.',
    bullets: ['Free 20-minute scoping call', 'One fixed quote per job', 'You own everything we build'],
    priceEnv: '',
  },
};

export const MODULE_ORDER: ModuleId[] = ['protect', 'vault', 'barter', 'advisory'];
export const PAID_MODULES: ModuleId[] = MODULE_ORDER.filter(m => MODULES[m].price > 0);

export const COMING_SOON = [
  { id: 'intelligence', name: 'Intelligence', tagline: 'Regulatory changes that may affect you, in plain English, from the Federal Register.' },
  { id: 'guardrail',    name: 'GC Guardrail', tagline: 'Every kind of data on your phone, and exactly who can see it. Mobile app.' },
  { id: 'clonewatch',   name: 'Clone Watch',  tagline: 'Copycat detection across app stores, GitHub and the web, with takedowns you approve.' },
];

export function isModuleId(x: any): x is ModuleId { return typeof x === 'string' && x in MODULES; }

/** Server only: Stripe price id for a module (reads env). */
export function priceIdFor(id: ModuleId): string | null {
  const env = MODULES[id].priceEnv;
  return env ? (process.env[env] || null) : null;
}

/** Server only: module for a Stripe price id. */
export function moduleForPrice(priceId: string): ModuleId | null {
  for (const id of PAID_MODULES) if (process.env[MODULES[id].priceEnv] === priceId) return id;
  return null;
}

export const money = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`;
