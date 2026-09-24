// lib/cfr-taxonomy.ts
// SUPREME MAPPING (Tier 2): the government's OWN classification → your industries.
// Every Federal Register document carries agency IDs + CFR title numbers. Instead of
// guessing from keywords, we map the finite, fixed set of ~50 CFR titles and the major
// agencies to a curated industry list. This scales because the govt already classified
// the rule — we just translate its taxonomy to ours.
//
// This is the single source of truth for BOTH:
//   1. the curated industry list users pick from (INDUSTRIES)
//   2. how incoming regulatory docs get tagged (CFR_TITLE_MAP, AGENCY_MAP)

// ── The curated industry list (maps cleanly to regulatory taxonomy) ──
export const INDUSTRIES = [
  'Technology & Software',
  'E-commerce & Retail',
  'Finance & Banking',
  'Health & Medical',
  'Food & Beverage',
  'Beauty & Personal Care',
  'Manufacturing',
  'Construction',
  'Real Estate',
  'Agriculture',
  'Energy & Utilities',
  'Transportation & Logistics',
  'Automotive',
  'Hospitality & Travel',
  'Professional Services',
  'Legal Services',
  'Education',
  'Media & Creative',
  'Telecommunications',
  'Import / Export',
  'Insurance',
  'Pharmaceuticals',
  'Nonprofit',
  'Cannabis',
  'Aerospace & Defense',
  'Environmental Services',
  'Mining & Resources',
  'Fitness & Wellness',
  'Childcare & Family Services',
  'Waste & Recycling',
] as const;

export type Industry = typeof INDUSTRIES[number];

// ── CFR Title → industries (the ~50 titles of the Code of Federal Regulations) ──
// One-time, finite mapping. Every FDA rule cites Title 21; every EPA rule Title 40; etc.
export const CFR_TITLE_MAP: Record<number, Industry[]> = {
  7:  ['Agriculture', 'Food & Beverage'],                          // Agriculture
  9:  ['Agriculture', 'Food & Beverage'],                          // Animals & Animal Products
  10: ['Energy & Utilities'],                                      // Energy
  12: ['Finance & Banking', 'Insurance'],                          // Banks & Banking
  14: ['Aerospace & Defense', 'Transportation & Logistics'],       // Aeronautics & Space
  16: ['E-commerce & Retail', 'Technology & Software'],            // Commercial Practices (FTC)
  17: ['Finance & Banking'],                                       // Commodity & Securities Exchanges
  19: ['Import / Export', 'E-commerce & Retail'],                  // Customs Duties
  20: ['Professional Services'],                                   // Employees' Benefits
  21: ['Health & Medical', 'Food & Beverage', 'Beauty & Personal Care', 'Pharmaceuticals'], // Food & Drugs (FDA)
  23: ['Transportation & Logistics', 'Construction'],              // Highways
  24: ['Real Estate'],                                             // Housing & Urban Development
  26: ['Finance & Banking', 'Professional Services'],              // Internal Revenue
  29: ['Manufacturing', 'Construction', 'Professional Services'],  // Labor (OSHA)
  30: ['Mining & Resources'],                                      // Mineral Resources
  33: ['Environmental Services', 'Transportation & Logistics'],    // Navigation & Navigable Waters
  34: ['Education'],                                               // Education
  40: ['Environmental Services', 'Manufacturing', 'Energy & Utilities', 'Agriculture'], // Environment (EPA)
  42: ['Health & Medical'],                                        // Public Health
  45: ['Health & Medical', 'Childcare & Family Services', 'Nonprofit'], // Public Welfare (HHS)
  47: ['Telecommunications', 'Media & Creative', 'Technology & Software'], // Telecommunication (FCC)
  48: ['Aerospace & Defense', 'Professional Services'],            // Federal Acquisition
  49: ['Transportation & Logistics', 'Automotive'],               // Transportation (DOT)
  50: ['Environmental Services', 'Agriculture'],                   // Wildlife & Fisheries
};

// ── Agency name/short → industries (backstop when CFR title is absent) ──
export const AGENCY_MAP: Record<string, Industry[]> = {
  'food-and-drug-administration': ['Health & Medical', 'Food & Beverage', 'Beauty & Personal Care', 'Pharmaceuticals'],
  'environmental-protection-agency': ['Environmental Services', 'Manufacturing', 'Energy & Utilities', 'Agriculture'],
  'federal-trade-commission': ['E-commerce & Retail', 'Technology & Software'],
  'securities-and-exchange-commission': ['Finance & Banking'],
  'occupational-safety-and-health-administration': ['Manufacturing', 'Construction'],
  'labor-department': ['Professional Services', 'Hospitality & Travel'],
  'u-s-customs-and-border-protection': ['Import / Export'],
  'federal-communications-commission': ['Telecommunications', 'Media & Creative', 'Technology & Software'],
  'agriculture-department': ['Agriculture', 'Food & Beverage'],
  'energy-department': ['Energy & Utilities'],
  'transportation-department': ['Transportation & Logistics', 'Automotive'],
  'consumer-financial-protection-bureau': ['Finance & Banking'],
  'health-and-human-services-department': ['Health & Medical'],
  'housing-and-urban-development-department': ['Real Estate'],
  'education-department': ['Education'],
  'national-highway-traffic-safety-administration': ['Automotive', 'Transportation & Logistics'],
  'drug-enforcement-administration': ['Pharmaceuticals', 'Cannabis', 'Health & Medical'],
  'federal-aviation-administration': ['Aerospace & Defense', 'Transportation & Logistics'],
};

// ── The mapper: given a Federal Register doc, return matched industries ──
// Reads the govt's own cfr_references[].title and agencies[].slug. Falls back to a small
// keyword pass only when structured metadata is missing.
const KEYWORD_FALLBACK: Record<string, Industry[]> = {
  cannabis: ['Cannabis'], marijuana: ['Cannabis'], hemp: ['Cannabis', 'Agriculture'],
  insurance: ['Insurance'], childcare: ['Childcare & Family Services'],
  fitness: ['Fitness & Wellness'], recycling: ['Waste & Recycling'], hotel: ['Hospitality & Travel'],
};

export function mapDocToIndustries(doc: any): Industry[] {
  const set = new Set<Industry>();

  // 1. CFR title references — the strongest signal (govt's own classification)
  const refs = doc.cfr_references || [];
  for (const r of refs) {
    const t = Number(r.title);
    if (CFR_TITLE_MAP[t]) CFR_TITLE_MAP[t].forEach(i => set.add(i));
  }

  // 2. Agency slugs — backstop
  const agencies = doc.agencies || [];
  for (const a of agencies) {
    const slug = a.slug || (a.name || '').toLowerCase().replace(/\s+/g, '-');
    if (AGENCY_MAP[slug]) AGENCY_MAP[slug].forEach(i => set.add(i));
  }

  // 3. Keyword fallback only if still empty
  if (set.size === 0) {
    const text = `${doc.title || ''} ${doc.abstract || ''}`.toLowerCase();
    for (const [k, inds] of Object.entries(KEYWORD_FALLBACK)) if (text.includes(k)) inds.forEach(i => set.add(i));
  }

  return [...set];
}