// GC Shield · Website check (no key needed, read-only).
// GET /api/shield/website?domain=gratiacore.com
// Finds third-party services that run code on the site (and can see visitors),
// secret files anyone can download, and which security protections the site sends.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Risk = "Low" | "Medium" | "High";

const KNOWN: { match: RegExp; name: string; what: string; risk: Risk }[] = [
  { match: /googletagmanager\.com$/, name: "Google Tag Manager", what: "can load other tracking tools on every page", risk: "Medium" },
  { match: /google-analytics\.com$/, name: "Google Analytics", what: "records what visitors do on your pages", risk: "Medium" },
  { match: /connect\.facebook\.net$/, name: "Meta Pixel", what: "sends visitor activity to Meta for ads", risk: "Medium" },
  { match: /hotjar\.com$/, name: "Hotjar", what: "records visitor sessions, including clicks and typing", risk: "High" },
  { match: /clarity\.ms$/, name: "Microsoft Clarity", what: "records visitor sessions, including clicks and scrolling", risk: "High" },
  { match: /fullstory\.com$/, name: "FullStory", what: "records visitor sessions", risk: "High" },
  { match: /js\.stripe\.com$/, name: "Stripe", what: "runs the payment form on your site", risk: "Low" },
  { match: /paypal\.com$/, name: "PayPal", what: "runs payment buttons on your site", risk: "Low" },
  { match: /segment\.(com|io)$/, name: "Segment", what: "collects visitor data and forwards it to other tools", risk: "Medium" },
  { match: /intercom\.io$|intercomcdn\.com$/, name: "Intercom", what: "runs a chat widget that sees visitor details", risk: "Medium" },
  { match: /hs-scripts\.com$|hubspot\.com$|hs-analytics\.net$/, name: "HubSpot", what: "tracks visitors and form entries for marketing", risk: "Medium" },
  { match: /tiktok\.com$/, name: "TikTok Pixel", what: "sends visitor activity to TikTok for ads", risk: "Medium" },
  { match: /linkedin\.com$|licdn\.com$/, name: "LinkedIn Insight", what: "sends visitor activity to LinkedIn for ads", risk: "Medium" },
  { match: /vercel-scripts\.com$|vercel-insights\.com$/, name: "Vercel Analytics", what: "measures page visits", risk: "Low" },
  { match: /plausible\.io$/, name: "Plausible", what: "measures page visits without cookies", risk: "Low" },
  { match: /youtube\.com$|ytimg\.com$/, name: "YouTube", what: "embeds videos and can set tracking cookies", risk: "Low" },
  { match: /calendly\.com$/, name: "Calendly", what: "runs a booking widget that collects names and emails", risk: "Low" },
  { match: /recaptcha\.net$|gstatic\.com$|google\.com$/, name: "Google (reCAPTCHA or fonts)", what: "runs Google code on your pages", risk: "Low" },
  { match: /jsdelivr\.net$|unpkg\.com$|cdnjs\.cloudflare\.com$/, name: "Public code CDN", what: "serves code that runs with full access to your pages", risk: "Medium" },
];

const HEADERS = [
  { key: "strict-transport-security", label: "Forces HTTPS (HSTS)", why: "Stops visitors from being sent to an unencrypted copy of the site." },
  { key: "content-security-policy", label: "Content Security Policy", why: "Limits which outside code can run on your pages." },
  { key: "x-frame-options", label: "Clickjacking protection", why: "Stops other sites from hiding your pages inside theirs." },
  { key: "x-content-type-options", label: "File-type protection", why: "Stops browsers from running files as the wrong type." },
  { key: "referrer-policy", label: "Referrer policy", why: "Controls what page addresses leak to other sites." },
];

function normalize(raw: string) {
  const d = raw.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/\.$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(d) ? d : null;
}

function root(host: string) {
  const parts = host.split(".");
  return parts.slice(-2).join(".");
}

async function get(url: string, ms: number, redirect: RequestRedirect = "follow") {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { redirect, signal: ctrl.signal, cache: "no-store", headers: { "User-Agent": "GC-Shield-Website-Check/1.0" } });
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  const domain = normalize(req.nextUrl.searchParams.get("domain") ?? "");
  if (!domain) return NextResponse.json({ error: "Enter a website address like gratiacore.com." }, { status: 400 });

  let res: Response;
  try {
    res = await get(`https://${domain}/`, 9000);
  } catch {
    return NextResponse.json({ error: `Couldn't reach ${domain} over HTTPS. Check the address and try again.` }, { status: 502 });
  }
  const finalUrl = res.url || `https://${domain}/`;
  const html = (await res.text()).slice(0, 2_000_000);
  const siteRoot = root(new URL(finalUrl).hostname);

  let httpRedirects: boolean | null = null;
  try {
    const plain = await get(`http://${domain}/`, 5000, "manual");
    const loc = plain.headers.get("location") ?? "";
    httpRedirects = plain.status >= 300 && plain.status < 400 && loc.startsWith("https://");
  } catch {
    httpRedirects = null;
  }

  const csp = res.headers.get("content-security-policy") ?? "";
  const headers = HEADERS.map((h) => ({
    ...h,
    present: h.key === "x-frame-options" ? !!res.headers.get(h.key) || /frame-ancestors/i.test(csp) : !!res.headers.get(h.key),
  }));

  const items: Record<string, unknown>[] = [];
  const service = `Website · ${domain}`;

  // Third-party code that runs on the site.
  const srcs = [...html.matchAll(/<(script|iframe)[^>]+src=["']([^"']+)["']/gi)].map((m) => ({ tag: m[1].toLowerCase(), src: m[2] }));
  const seen = new Set<string>();
  for (const { tag, src } of srcs) {
    let host: string;
    try {
      host = new URL(src, finalUrl).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (!host || root(host) === siteRoot || seen.has(host)) continue;
    seen.add(host);
    const known = KNOWN.find((k) => k.match.test(host));
    items.push({
      id: `site:${domain}:code:${host}`,
      service,
      group: "Outside code on your site",
      direction: "Can reach you",
      type: "Website script",
      name: known?.name ?? host,
      description: `${known ? `${known.what[0].toUpperCase()}${known.what.slice(1)}` : `Runs ${tag === "iframe" ? "an embedded page" : "code"} on your site`} · loaded from ${host}`,
      risk: known?.risk ?? "Medium",
      evidence: "Verified",
      howToRemove: `If you don't use ${known?.name ?? host} anymore, remove its code from your site or disconnect it in your site builder.`,
      link: finalUrl,
    });
  }

  // Secret files anyone can download.
  const files = [
    { path: "/.env", test: /^[A-Z_][A-Z0-9_]*\s*=/m, label: "Environment file (.env)", what: "can contain passwords and API keys" },
    { path: "/.git/config", test: /\[core\]/, label: "Git settings (.git/config)", what: "can expose your code history" },
  ];
  for (const f of files) {
    try {
      const r = await get(`https://${domain}${f.path}`, 5000, "manual");
      if (r.status === 200) {
        const body = (await r.text()).slice(0, 5000);
        if (f.test.test(body) && !/<html/i.test(body)) {
          items.push({
            id: `site:${domain}:file:${f.path}`,
            service,
            group: "Files anyone can download",
            direction: "Can reach you",
            type: "Exposed file",
            name: f.label,
            description: `Anyone can download https://${domain}${f.path}, which ${f.what}`,
            risk: "High",
            evidence: "Verified",
            howToRemove: `Delete ${f.path} from your public site files or block it in your hosting settings, then change any keys it contained.`,
            link: `https://${domain}${f.path}`,
          });
        }
      }
    } catch {
      /* not reachable: treated as not exposed */
    }
  }

  return NextResponse.json({
    domain,
    finalUrl,
    https: finalUrl.startsWith("https://"),
    httpRedirects,
    headers,
    checkedAt: new Date().toISOString(),
    items,
  });
}
