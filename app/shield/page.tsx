"use client";

// GC Shield by Gratia Core · /shield
// Access Shield: live, read-only scan of your GitHub (via /api/shield/github),
// shown service first (GitHub), then grouped by repository.
// Wi-Fi Shield: the network you're on right now, as every website sees it
// (via /api/shield/network), plus your answers about the Wi-Fi.
// Labels and fields match the Meridian back office (Account, Access Item, Wi-Fi Network, Finding).

import { useCallback, useEffect, useMemo, useState } from "react";

type Risk = "Low" | "Medium" | "High";
type Review = "Authorized" | "Unauthorized" | "Needs review";
type Direction = "Can reach you" | "You can reach";

type AccessItem = {
  id: string;
  service: string;
  group: string;
  direction: Direction;
  type: string;
  name: string;
  description: string;
  risk: Risk;
  evidence: "Verified";
  howToRemove: string;
  link: string;
};

type GithubData = {
  login: string;
  checkedAt: string;
  reposChecked: number;
  notChecked: { collaborators: number; deployKeys: number; webhooks: number; sshKeys: boolean };
  items: AccessItem[];
};

type SiteData = {
  domain: string;
  finalUrl?: string;
  https?: boolean;
  httpRedirects?: boolean | null;
  headers?: { key: string; label: string; why: string; present: boolean }[];
  checkedAt?: string;
  items: AccessItem[];
  error?: string;
  loading?: boolean;
};

type NetData = {
  ip: string | null;
  provider: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  relayLikely: boolean | null;
  https: boolean;
  checkedAt: string;
};

type StoredFinding = { state: "Open" | "Fixing" | "Confirmed"; title: string; detail: string; note?: string; at?: string };

type Finding = {
  id: string;
  severity: Risk;
  source: "Access Shield" | "Wi-Fi Shield";
  title: string;
  detail: string;
  state: "Open" | "Fixing" | "Confirmed";
  note?: string;
  link?: string;
  canFix: boolean;
};

type WifiAnswers = { protectedOn: boolean };

type MeridianState = { state: "off" | "syncing" | "ok" | "error"; message: string; at?: string };

const NOT_CONNECTED = [
  { name: "Google", sub: "Apps and AI tools connected to Gmail, Drive and Calendar" },
  { name: "Vercel", sub: "Tokens and team members on your projects" },
  { name: "Stripe", sub: "Team members and connected apps on your payments" },
];

const KEYS = { status: "gcshield.status", findings: "gcshield.findings", wifi: "gcshield.wifi", sites: "gcshield.sites" };
const SITE = "Website · ";
const EMPTY_WIFI: WifiAnswers = { protectedOn: false };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback;
  } catch {
    return fallback;
  }
}
function loadList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state stays in memory */
  }
}

function toMeridian(it: AccessItem, review: Review) {
  return {
    service: it.service,
    name: it.name,
    direction: it.direction,
    type: it.type,
    description: `${it.description} (${it.service} · ${it.group})`,
    risk: it.risk,
    howToRemove: it.howToRemove,
    reviewStatus: review,
  };
}

const WEIGHT: Record<Risk, number> = { High: 15, Medium: 8, Low: 3 };
const RANK: Record<Risk, number> = { High: 0, Medium: 1, Low: 2 };
const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");

export default function ShieldPage() {
  const [gh, setGh] = useState<GithubData | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [net, setNet] = useState<NetData | null>(null);
  const [netLoading, setNetLoading] = useState(true);
  const [connType, setConnType] = useState<string | null>(null);
  const [tab, setTab] = useState<"reach-you" | "you-reach" | "findings" | "wifi">("reach-you");
  const [openService, setOpenService] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, Review>>({});
  const [stored, setStored] = useState<Record<string, StoredFinding>>({});
  const [wifi, setWifi] = useState<WifiAnswers>(EMPTY_WIFI);
  const [meridian, setMeridian] = useState<MeridianState>({ state: "off", message: "Not synced yet" });
  const [sites, setSites] = useState<string[]>([]);
  const [siteData, setSiteData] = useState<Record<string, SiteData>>({});
  const [adding, setAdding] = useState(false);
  const [newSite, setNewSite] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(load(KEYS.status, {}));
    setStored(load(KEYS.findings, {}));
    setWifi(load(KEYS.wifi, EMPTY_WIFI));
    const c = (navigator as Navigator & { connection?: { type?: string } }).connection;
    if (c?.type) setConnType(c.type);
  }, []);

  // Meridian back office: every call goes through /api/shield/meridian (the key stays on the server).
  const callMeridian = useCallback(async (payload: Record<string, unknown>) => {
    setMeridian((m) => ({ ...m, state: "syncing", message: "Syncing to Meridian…" }));
    try {
      const res = await fetch("/api/shield/meridian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Meridian sync failed.");
      setMeridian({ state: "ok", message: body.message, at: new Date().toISOString() });
    } catch (e) {
      setMeridian({ state: "error", message: e instanceof Error ? e.message : "Meridian sync failed." });
    }
  }, []);

  const scan = useCallback(async (): Promise<GithubData | null> => {
    setLoading(true);
    try {
      const res = await fetch("/api/shield/github", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) {
        setGhError(body.error ?? "Couldn't load GitHub.");
        return null;
      }
      setGh(body as GithubData);
      setGhError(null);
      const saved = load<Record<string, Review>>(KEYS.status, {});
      void callMeridian({
        action: "syncItems",
        items: (body as GithubData).items.map((it) => toMeridian(it, saved[it.id] ?? "Needs review")),
      });
      return body as GithubData;
    } catch {
      setGhError("Couldn't reach the Shield server. Check your connection and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [callMeridian]);

  const checkNetwork = useCallback(async () => {
    setNetLoading(true);
    try {
      const res = await fetch("/api/shield/network", { cache: "no-store" });
      setNet((await res.json()) as NetData);
    } catch {
      setNet(null);
    } finally {
      setNetLoading(false);
    }
  }, []);

  const scanSite = useCallback(
    async (domain: string): Promise<SiteData> => {
      setSiteData((d) => ({ ...d, [domain]: { ...(d[domain] ?? { domain, items: [] }), loading: true } }));
      let data: SiteData;
      try {
        const res = await fetch(`/api/shield/website?domain=${encodeURIComponent(domain)}`, { cache: "no-store" });
        const body = await res.json();
        data = res.ok ? { ...(body as SiteData), loading: false } : { domain, items: [], error: body.error ?? "Couldn't check this website.", loading: false };
      } catch {
        data = { domain, items: [], error: "Couldn't reach the Shield server.", loading: false };
      }
      setSiteData((d) => ({ ...d, [domain]: data }));
      if (!data.error && data.items.length) {
        const saved = load<Record<string, Review>>(KEYS.status, {});
        void callMeridian({ action: "syncItems", items: data.items.map((it) => toMeridian(it, saved[it.id] ?? "Needs review")) });
      }
      return data;
    },
    [callMeridian]
  );

  useEffect(() => {
    scan();
    checkNetwork();
    const saved = loadList(KEYS.sites);
    setSites(saved);
    saved.forEach((d) => void scanSite(d));
  }, [scan, checkNetwork, scanSite]);

  async function addSite() {
    const d = newSite.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0];
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(d)) {
      setAddError("Enter a website address like gratiacore.com.");
      return;
    }
    setAdding(false);
    setNewSite("");
    setAddError(null);
    setTab("reach-you");
    setOpenService(SITE + d);
    if (!sites.includes(d)) {
      const next = [...sites, d];
      setSites(next);
      save(KEYS.sites, next);
    }
    await scanSite(d);
  }

  function removeSite(d: string) {
    const next = sites.filter((x) => x !== d);
    setSites(next);
    save(KEYS.sites, next);
    setOpenService(null);
  }

  const items = [...(gh?.items ?? []), ...sites.flatMap((d) => siteData[d]?.items ?? [])];
  const reviewOf = (id: string): Review => status[id] ?? "Needs review";

  function setReview(item: AccessItem, value: Review) {
    const next = { ...status, [item.id]: value };
    setStatus(next);
    save(KEYS.status, next);
    void callMeridian({ action: "setReview", item: toMeridian(item, value), reviewStatus: value });
  }

  function updateWifi(patch: Partial<WifiAnswers>) {
    const next = { ...wifi, ...patch };
    setWifi(next);
    save(KEYS.wifi, next);
  }

  function setFinding(id: string, f: StoredFinding) {
    const next = { ...stored, [id]: f };
    setStored(next);
    save(KEYS.findings, next);
  }

  // "Check again": rescan GitHub and confirm removals for real.
  async function checkAgain() {
    const [fresh, siteResults] = await Promise.all([scan(), Promise.all(sites.map((d) => scanSite(d)))]);
    const ids = new Set([...(fresh?.items ?? []), ...siteResults.flatMap((r) => r.items)].map((i) => i.id));
    const checkedAt = fresh?.checkedAt ?? new Date().toISOString();
    const next = { ...stored };
    for (const [fid, f] of Object.entries(stored)) {
      if (f.state !== "Fixing") continue;
      const itemId = fid.slice(2);
      if (!fresh && !itemId.startsWith("site:")) continue; // GitHub didn't answer: don't guess
      next[fid] = ids.has(itemId)
        ? { ...f, state: "Open", note: "Still there at the last check." }
        : { ...f, state: "Confirmed", note: `Confirmed gone at ${time(checkedAt)}.`, at: checkedAt };
    }
    setStored(next);
    save(KEYS.findings, next);
  }

  const isProtected = wifi.protectedOn || net?.relayLikely === true;
  const location = net && (net.city || net.region || net.country) ? [net.city, net.region, net.country].filter(Boolean).join(", ") : null;

  const findings: Finding[] = useMemo(() => {
    const list: Finding[] = [];
    const live = new Set(items.map((i) => i.id));
    for (const it of items) {
      const r = reviewOf(it.id);
      if (r === "Unauthorized") {
        const fid = `f:${it.id}`;
        const s = stored[fid];
        list.push({
          id: fid,
          severity: "High",
          source: "Access Shield",
          title: `Unauthorized: ${it.name}`,
          detail: it.howToRemove,
          state: s?.state === "Fixing" ? "Fixing" : "Open",
          note: s?.note,
          link: it.link,
          canFix: true,
        });
      } else if (r === "Needs review" && it.risk === "High") {
        list.push({
          id: `r:${it.id}`,
          severity: "Medium",
          source: "Access Shield",
          title: `Needs review: ${it.name}`,
          detail: `${it.description}. Decide whether this should keep access.`,
          state: "Open",
          link: it.link,
          canFix: false,
        });
      }
    }
    for (const [fid, s] of Object.entries(stored)) {
      if (s.state === "Confirmed" && !live.has(fid.slice(2))) {
        list.push({ id: fid, severity: "High", source: "Access Shield", title: s.title, detail: s.detail, state: "Confirmed", note: s.note, canFix: false });
      }
    }
    for (const d of sites) {
      const sd = siteData[d];
      if (!sd?.headers) continue;
      const missing = sd.headers.filter((h) => !h.present);
      if (missing.length) {
        list.push({
          id: `site-headers:${d}`,
          severity: missing.length >= 3 ? "Medium" : "Low",
          source: "Access Shield",
          title: `${d} is missing ${missing.length} security ${missing.length === 1 ? "protection" : "protections"}`,
          detail: missing.map((h) => `${h.label}: ${h.why}`).join(" "),
          state: "Open",
          link: sd.finalUrl,
          canFix: false,
        });
      }
      if (sd.httpRedirects === false) {
        list.push({
          id: `site-http:${d}`,
          severity: "Medium",
          source: "Access Shield",
          title: `${d} doesn't force HTTPS`,
          detail: "Visitors who type the address without https can land on an unencrypted page. Turn on HTTPS redirects in your hosting settings.",
          state: "Open",
          link: sd.finalUrl,
          canFix: false,
        });
      }
    }
    if (net && !netLoading) {
      const where = net.provider ? `${net.provider} Wi-Fi` : "this Wi-Fi";
      if (!isProtected) {
        list.push({
          id: "wifi",
          severity: "Medium",
          source: "Wi-Fi Shield",
          title: `Unprotected on ${where}`,
          detail: `Whoever runs this network can see which sites you visit, and every site sees your IP${location ? ` and your location (${location})` : ""}. Turn on a VPN, iCloud Private Relay or private DNS, then check the network again.`,
          state: "Open",
          canFix: false,
        });
      } else if (wifi.protectedOn && net.relayLikely === false) {
        list.push({
          id: "wifi",
          severity: "Low",
          source: "Wi-Fi Shield",
          title: "Protection on, but not detected yet",
          detail: `You turned protection on, but sites still see ${where}. Wait for your VPN or Private Relay to connect, then check the network again.`,
          state: "Open",
          canFix: false,
        });
      }
    }
    return list.sort(
      (a, b) => (a.state === "Confirmed" ? 1 : 0) - (b.state === "Confirmed" ? 1 : 0) || RANK[a.severity] - RANK[b.severity]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status, stored, wifi, isProtected, net, netLoading, location, sites, siteData]);

  const counts = useMemo(() => {
    const c = { Authorized: 0, Unauthorized: 0, "Needs review": 0 } as Record<Review, number>;
    for (const it of items) c[reviewOf(it.id)]++;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status]);

  const openFindings = findings.filter((f) => f.state !== "Confirmed");
  const score = Math.max(0, 100 - openFindings.reduce((s, f) => s + WEIGHT[f.severity], 0) - 4 * counts["Needs review"]);

  function exportCsv() {
    const head = ["Name", "Account", "Group", "Direction", "Item Type", "Access Description", "Risk", "Evidence", "Review Status", "How To Remove", "Removal Confirmed", "Last Seen"];
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = items.map((it) =>
      [it.name, it.service, it.group, it.direction, it.type, it.description, it.risk, it.evidence, reviewOf(it.id), it.howToRemove, "No", gh?.checkedAt.slice(0, 10) ?? ""]
        .map(q)
        .join(",")
    );
    const blob = new Blob([[head.map(q).join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gc-shield-access-items.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const direction: Direction = tab === "you-reach" ? "You can reach" : "Can reach you";
  const shown = items.filter((i) => i.direction === direction);

  const groups = useMemo(() => {
    const map = new Map<string, AccessItem[]>();
    for (const it of shown.filter((i) => i.service === openService)) {
      map.set(it.group, [...(map.get(it.group) ?? []), it]);
    }
    return [...map.entries()]
      .map(([name, list]) => ({
        name,
        list: [...list].sort((a, b) => RANK[a.risk] - RANK[b.risk]),
        review: list.filter((i) => reviewOf(i.id) === "Needs review").length,
        unauth: list.filter((i) => reviewOf(i.id) === "Unauthorized").length,
        top: list.reduce<Risk>((t, i) => (RANK[i.risk] < RANK[t] ? i.risk : t), "Low"),
      }))
      .sort((a, b) => RANK[a.top] - RANK[b.top] || b.review - a.review || a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, openService, status]);

  const ghShown = shown.filter((i) => i.service === "GitHub");
  const ghReview = ghShown.filter((i) => reviewOf(i.id) === "Needs review").length;
  const ghHigh = ghShown.filter((i) => i.risk === "High").length;
  const repoCount = new Set(ghShown.map((i) => i.group)).size;


  return (
    <main className="gcs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="gcs-top">
        <div className="gcs-brand">
          <span className="gcs-dot" aria-hidden="true" />
          <div>
            <p className="gcs-eyebrow">Gratia Core · GC Protect</p>
            <h1>GC Shield</h1>
          </div>
        </div>
        <span className="gcs-pill">View only</span>
      </header>

      <p className="gcs-lead">
        See who can reach your accounts, and what the network you&apos;re on gives away. Shield looks and tells you. It uses a read-only key, so it
        can&apos;t change anything and can&apos;t be used against you.
      </p>

      <section className="gcs-summary" aria-label="Summary">
        <div className="gcs-score">
          <strong>{loading && !gh ? "…" : score}</strong>
          <span>Shield score</span>
        </div>
        <div className="gcs-counts">
          <div className="gcs-count gcs-count-strong">
            <strong>{counts["Needs review"]}</strong>
            <span>Needs review</span>
          </div>
          <div className="gcs-count">
            <strong>{counts.Unauthorized}</strong>
            <span>Unauthorized</span>
          </div>
          <div className="gcs-count gcs-count-quiet">
            <strong>{counts.Authorized}</strong>
            <span>Authorized</span>
          </div>
        </div>
      </section>

      <div className="gcs-source">
        <span>
          {ghError
            ? ghError
            : gh
            ? `Live from GitHub as @${gh.login} · ${gh.reposChecked} repos checked · ${time(gh.checkedAt)}`
            : "Connecting to GitHub…"}
        </span>
        <div className="gcs-source-actions">
          <button type="button" className="gcs-btn" onClick={checkAgain} disabled={loading}>
            {loading ? "Checking…" : "Check again"}
          </button>
          <button
            type="button"
            className="gcs-btn gcs-btn-quiet"
            onClick={() => callMeridian({ action: "syncItems", items: items.map((it) => toMeridian(it, reviewOf(it.id))) })}
            disabled={!items.length || meridian.state === "syncing"}
          >
            {meridian.state === "syncing" ? "Syncing…" : "Sync to Meridian"}
          </button>
        </div>
      </div>
      <div className={`gcs-meridian gcs-meridian-${meridian.state}`} role="status">
        <strong>Meridian back office</strong>
        <span>
          {meridian.message}
          {meridian.at ? ` · ${time(meridian.at)}` : ""}
        </span>
        <button type="button" className="gcs-link" onClick={exportCsv} disabled={!items.length}>
          Download CSV
        </button>
      </div>

      <nav className="gcs-tabs" aria-label="Shield views">
        {(
          [
            ["reach-you", "Can reach you"],
            ["you-reach", "You can reach"],
            ["findings", `Findings · ${openFindings.length}`],
            ["wifi", "Wi-Fi Shield"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            className="gcs-tab"
            onClick={() => {
              setTab(id);
              setOpenService(null);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {(tab === "reach-you" || tab === "you-reach") && !openService && (
        <section className="gcs-list" aria-label="Services">
          <p className="gcs-hint">
            {tab === "reach-you" ? "Pick a service to see who and what can reach it." : "Pick a service to see what you can still reach through it."}
          </p>
          <button type="button" className="gcs-service" onClick={() => setOpenService("GitHub")} disabled={!gh}>
            <span className="gcs-service-mark" aria-hidden="true">
              GH
            </span>
            <span className="gcs-service-text">
              <strong>GitHub</strong>
              <span>
                {gh
                  ? `Connected as @${gh.login} · ${ghShown.length} ${ghShown.length === 1 ? "item" : "items"} across ${repoCount} ${
                      repoCount === 1 ? "group" : "groups"
                    }`
                  : ghError ?? "Connecting…"}
              </span>
            </span>
            <span className="gcs-chips">
              {ghHigh > 0 && <span className="gcs-chip gcs-risk-high">{ghHigh} high risk</span>}
              {ghReview > 0 && <span className="gcs-chip gcs-risk-medium">{ghReview} need review</span>}
              <span className="gcs-chip gcs-chip-evidence">Verified · live</span>
            </span>
            <span className="gcs-chevron" aria-hidden="true">
              ›
            </span>
          </button>
          {sites.map((d) => {
            const sd = siteData[d];
            const svc = SITE + d;
            const its = shown.filter((i) => i.service === svc);
            const rev = its.filter((i) => reviewOf(i.id) === "Needs review").length;
            const hi = its.filter((i) => i.risk === "High").length;
            return (
              <button key={d} type="button" className="gcs-service" onClick={() => setOpenService(svc)}>
                <span className="gcs-service-mark" aria-hidden="true">
                  WEB
                </span>
                <span className="gcs-service-text">
                  <strong>{d}</strong>
                  <span>
                    {sd?.loading
                      ? "Checking the website…"
                      : sd?.error ??
                        `Website · ${its.length} outside ${its.length === 1 ? "service" : "services"} found${sd?.checkedAt ? ` · ${time(sd.checkedAt)}` : ""}`}
                  </span>
                </span>
                <span className="gcs-chips">
                  {hi > 0 && <span className="gcs-chip gcs-risk-high">{hi} high risk</span>}
                  {rev > 0 && <span className="gcs-chip gcs-risk-medium">{rev} need review</span>}
                  <span className="gcs-chip gcs-chip-evidence">Verified · live</span>
                </span>
                <span className="gcs-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            );
          })}

          {!adding ? (
            <button
              type="button"
              className="gcs-add"
              onClick={() => {
                setAdding(true);
                setAddError(null);
              }}
            >
              + Add a service
            </button>
          ) : (
            <form
              className="gcs-addform"
              onSubmit={(e) => {
                e.preventDefault();
                void addSite();
              }}
            >
              <h3>Add a service</h3>
              <div className="gcs-addopts">
                <div className="gcs-addopt is-on">
                  <strong>Website</strong>
                  <span>Any site you run. No key needed.</span>
                </div>
                <div className="gcs-addopt">
                  <strong>GitHub</strong>
                  <span>{gh ? "Already connected" : "Uses your read-only key"}</span>
                </div>
                <div className="gcs-addopt is-off">
                  <strong>Google, Vercel, Stripe</strong>
                  <span>Coming next</span>
                </div>
              </div>
              <label htmlFor="gcs-new-site">Website address</label>
              <div className="gcs-addrow">
                <input
                  id="gcs-new-site"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="gratiacore.com"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                />
                <button type="submit" className="gcs-btn">
                  Add and check
                </button>
                <button type="button" className="gcs-btn gcs-btn-quiet" onClick={() => setAdding(false)}>
                  Cancel
                </button>
              </div>
              {addError && <p className="gcs-note">{addError}</p>}
            </form>
          )}

          {NOT_CONNECTED.map((s) => (
            <div key={s.name} className="gcs-service gcs-service-off">
              <span className="gcs-service-mark" aria-hidden="true">
                {s.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="gcs-service-text">
                <strong>{s.name}</strong>
                <span>{s.sub}</span>
              </span>
              <span className="gcs-chips">
                <span className="gcs-chip">Not connected · coming next</span>
              </span>
            </div>
          ))}
        </section>
      )}

      {(tab === "reach-you" || tab === "you-reach") && openService && (
        <section className="gcs-list" aria-label={`${openService} · ${direction}`}>
          <button type="button" className="gcs-crumb" onClick={() => setOpenService(null)}>
            ‹ All services
          </button>
          <h2 className="gcs-h2">
            {openService} · {direction}
          </h2>
          {openService.startsWith(SITE) &&
            (() => {
              const d = openService.slice(SITE.length);
              const sd = siteData[d];
              return (
                <div className="gcs-sitecheck">
                  {sd?.loading && <p>Checking {d}…</p>}
                  {sd?.error && <p className="gcs-note">{sd.error}</p>}
                  {sd?.headers && (
                    <>
                      <p className="gcs-eyebrow">Site protections · checked {time(sd.checkedAt)}</p>
                      <ul>
                        <li className={sd.https ? "is-ok" : "is-bad"}>
                          <strong>{sd.https ? "On" : "Missing"}</strong> Encrypted connection (HTTPS)
                        </li>
                        {sd.httpRedirects !== null && sd.httpRedirects !== undefined && (
                          <li className={sd.httpRedirects ? "is-ok" : "is-bad"}>
                            <strong>{sd.httpRedirects ? "On" : "Missing"}</strong> Sends http visitors to https
                          </li>
                        )}
                        {sd.headers.map((h) => (
                          <li key={h.key} className={h.present ? "is-ok" : "is-bad"}>
                            <strong>{h.present ? "On" : "Missing"}</strong> {h.label}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <button type="button" className="gcs-link" onClick={() => removeSite(d)}>
                    Remove this website
                  </button>
                </div>
              );
            })()}
          {!loading && groups.length === 0 && (
            <p className="gcs-empty">
              Nothing found here.{" "}
              {tab === "you-reach" ? "A fine-grained key only sees repositories you own, so this list may stay empty." : ""}
            </p>
          )}
          {groups.map((g) => {
            const open = !!openGroups[g.name];
            return (
              <div key={g.name} className="gcs-group">
                <button
                  type="button"
                  className="gcs-group-head"
                  aria-expanded={open}
                  onClick={() => setOpenGroups({ ...openGroups, [g.name]: !open })}
                >
                  <span className="gcs-group-name">
                    <strong>{g.name}</strong>
                    <span>
                      {g.list.length} {g.list.length === 1 ? "item" : "items"}
                      {g.review ? ` · ${g.review} need review` : ""}
                      {g.unauth ? ` · ${g.unauth} unauthorized` : ""}
                    </span>
                  </span>
                  <span className={`gcs-chip gcs-risk-${g.top.toLowerCase()}`}>Top risk: {g.top}</span>
                  <span className="gcs-chevron" aria-hidden="true">
                    {open ? "–" : "+"}
                  </span>
                </button>
                {open &&
                  g.list.map((it) => {
                    const r = reviewOf(it.id);
                    return (
                      <article key={it.id} className="gcs-item">
                        <div className="gcs-item-head">
                          <div className="gcs-item-text">
                            <h3>{it.name}</h3>
                            <p>{it.description}</p>
                          </div>
                          <div className="gcs-chips">
                            <span className="gcs-chip">{it.type}</span>
                            <span className={`gcs-chip gcs-risk-${it.risk.toLowerCase()}`}>{it.risk} risk</span>
                            <span className="gcs-chip gcs-chip-evidence">{it.service === "GitHub" ? "Verified · GitHub" : "Verified · live check"}</span>
                          </div>
                        </div>
                        <div className="gcs-seg" role="group" aria-label={`Review ${it.name}`}>
                          {(["Authorized", "Unauthorized", "Needs review"] as const).map((v) => (
                            <button key={v} type="button" aria-pressed={r === v} onClick={() => setReview(it, v)}>
                              {v}
                            </button>
                          ))}
                        </div>
                        {r === "Unauthorized" && (
                          <div className="gcs-remove">
                            <strong>Shield won&apos;t change this. To remove it yourself:</strong>
                            <span>{it.howToRemove}</span>
                            <a href={it.link} target="_blank" rel="noreferrer">
                              {it.service === "GitHub" ? "Open on GitHub ↗" : "Open ↗"}
                            </a>
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            );
          })}
          {gh && (gh.notChecked.collaborators || gh.notChecked.deployKeys || gh.notChecked.webhooks || gh.notChecked.sshKeys) ? (
            <p className="gcs-note">
              Not checked: some repos or keys weren&apos;t readable with this token
              {gh.notChecked.webhooks ? ` (webhooks on ${gh.notChecked.webhooks})` : ""}
              {gh.notChecked.deployKeys ? ` (deploy keys on ${gh.notChecked.deployKeys})` : ""}
              {gh.notChecked.collaborators ? ` (collaborators on ${gh.notChecked.collaborators})` : ""}
              {gh.notChecked.sshKeys ? " (your SSH keys)" : ""}. They aren&apos;t shown as safe.
            </p>
          ) : null}
        </section>
      )}

      {tab === "findings" && (
        <section className="gcs-list" aria-label="Findings">
          <p className="gcs-hint">Every alert from Access Shield and Wi-Fi Shield, most serious first.</p>
          {findings.length === 0 && <p className="gcs-empty">No findings. Mark something Unauthorized or run the Wi-Fi check to see one appear.</p>}
          {findings.map((f) => (
            <article key={f.id} className={`gcs-finding ${f.state === "Confirmed" ? "is-done" : ""}`}>
              <div className="gcs-chips">
                <span className={`gcs-chip gcs-risk-${f.severity.toLowerCase()}`}>{f.severity}</span>
                <span className="gcs-chip">{f.source}</span>
                <span className="gcs-chip gcs-chip-evidence">{f.state}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.detail}</p>
              {f.note && <p className="gcs-note">{f.note}</p>}
              <div className="gcs-finding-actions">
                {f.link && f.state !== "Confirmed" && (
                  <a className="gcs-btn gcs-btn-quiet" href={f.link} target="_blank" rel="noreferrer">
                    {f.link.includes("github.com") ? "Open on GitHub ↗" : "Open ↗"}
                  </a>
                )}
                {f.canFix && f.state === "Open" && (
                  <button type="button" className="gcs-btn" onClick={() => setFinding(f.id, { state: "Fixing", title: f.title, detail: f.detail })}>
                    I removed it
                  </button>
                )}
                {f.canFix && f.state === "Fixing" && (
                  <button type="button" className="gcs-btn" onClick={checkAgain} disabled={loading}>
                    {loading ? "Checking GitHub…" : "Check again"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "wifi" && (
        <section className="gcs-list" aria-label="Wi-Fi Shield">
          <div className="gcs-exposed">
            <div className="gcs-exposed-head">
              <p className="gcs-eyebrow">The network you&apos;re on right now</p>
              <span className="gcs-chip gcs-chip-evidence">Verified · live check {net ? time(net.checkedAt) : ""}</span>
            </div>
            <dl>
              <dt>Internet provider</dt>
              <dd>{netLoading ? "Checking…" : net?.provider ?? "Couldn't look up the provider (works once deployed)"}</dd>
              <dt>Public IP address</dt>
              <dd>{netLoading ? "Checking…" : net?.ip ?? "Not available on localhost"}</dd>
              <dt>Location it gives away</dt>
              <dd>{netLoading ? "Checking…" : location ?? "Shows once deployed"}</dd>
              <dt>VPN or relay</dt>
              <dd>
                {netLoading
                  ? "Checking…"
                  : net?.relayLikely === true
                  ? `Likely on: traffic leaves through ${net.provider}, not the venue's own internet`
                  : net?.relayLikely === false
                  ? "Not detected: websites see this Wi-Fi's own connection"
                  : "Unknown"}
              </dd>
              {connType && (
                <>
                  <dt>Device connection</dt>
                  <dd>{connType === "wifi" ? "Wi-Fi" : connType}</dd>
                </>
              )}
            </dl>
            <p className="gcs-note">
              This is the Wi-Fi&apos;s connection to the internet, seen the same way any website sees it. Browsers don&apos;t let websites read the
              Wi-Fi&apos;s name or password settings, so Shield judges the network by what it exposes.
            </p>
            <button type="button" className="gcs-btn gcs-btn-quiet" onClick={checkNetwork} disabled={netLoading}>
              {netLoading ? "Checking…" : "Check this network again"}
            </button>
          </div>

          <div className="gcs-protect">
            <div className="gcs-protect-head">
              <div>
                <h3>Protection on this network</h3>
                <p>
                  {net?.relayLikely === true
                    ? `Verified: sites now see ${net.provider}, not this Wi-Fi.`
                    : wifi.protectedOn
                    ? "Added by you. Check the network again to confirm it's working."
                    : "Off. Turn it on after you switch on a VPN, iCloud Private Relay or private DNS."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={wifi.protectedOn}
                aria-label="Protection on this network"
                className="gcs-switch gcs-switch-big"
                onClick={() => updateWifi({ protectedOn: !wifi.protectedOn })}
              >
                <span>{wifi.protectedOn ? "On" : "Off"}</span>
              </button>
            </div>
            <div className="gcs-means">
              <div className={!isProtected ? "is-now" : ""}>
                <strong>Off means</strong>
                <span>Whoever runs this Wi-Fi can see which sites you visit. Every site sees this IP and the location it gives away.</span>
              </div>
              <div className={isProtected ? "is-now" : ""}>
                <strong>On means</strong>
                <span>Your traffic is encrypted through a VPN or relay. The Wi-Fi owner can&apos;t see where you browse, and sites see the relay&apos;s location instead of yours.</span>
              </div>
            </div>
            <div className="gcs-finding-actions">
              <button
                type="button"
                className="gcs-btn"
                onClick={() =>
                  callMeridian({ action: "logWifi", wifi: { provider: net?.provider ?? null, ip: net?.ip ?? null, location, protectedOn: isProtected } })
                }
                disabled={meridian.state === "syncing" || netLoading}
              >
                Save this session to Meridian
              </button>
            </div>
          </div>
        </section>
      )}

      <footer className="gcs-foot">GC Shield by Gratia Core · back office built with Meridian</footer>
    </main>
  );
}

const CSS = `
.gcs{--red:#D7141A;--red2:#9E0B10;--ink:#5E080C;--tint:#FDECEC;--line:#F4C7C9;--paper:#FFFFFF;
  max-width:880px;margin:0 auto;padding-block:32px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));
  background:var(--paper);color:var(--ink);font-family:Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column;gap:20px}
.gcs h1,.gcs h2,.gcs h3{margin:0;color:var(--red)}
.gcs h1{font-family:Unbounded,Figtree,system-ui,sans-serif;font-size:2rem;letter-spacing:-0.02em}
.gcs-h2{font-size:1.25rem}
.gcs h3{font-size:1rem}
.gcs p{margin:0;line-height:1.5}
.gcs-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.gcs-brand{display:flex;align-items:center;gap:12px}
.gcs-dot{width:40px;height:40px;border-radius:50%;background:var(--red);box-shadow:inset -10px -10px 0 0 var(--red2)}
.gcs-eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--red2)}
.gcs-pill{padding:6px 14px;border-radius:999px;background:var(--tint);color:var(--red2);font-weight:700;font-size:.85rem}
.gcs-lead{max-width:62ch}
.gcs-summary{display:flex;gap:16px;align-items:stretch;flex-wrap:wrap}
.gcs-score{width:132px;height:132px;border-radius:50%;background:var(--red);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
.gcs-score strong{font-family:Unbounded,Figtree,sans-serif;font-size:2.4rem;line-height:1;font-variant-numeric:tabular-nums}
.gcs-score span{font-size:.8rem;font-weight:600;margin-top:6px}
.gcs-counts{flex:1;min-width:240px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.gcs-count{border:2px solid var(--red);border-radius:20px;padding:14px;display:flex;flex-direction:column;justify-content:center;gap:4px;color:var(--red)}
.gcs-count strong{font-family:Unbounded,Figtree,sans-serif;font-size:1.6rem;font-variant-numeric:tabular-nums}
.gcs-count span{font-size:.85rem;font-weight:600}
.gcs-count-strong{background:var(--red);color:#fff}
.gcs-count-quiet{border-color:var(--line)}
.gcs-source{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-radius:16px;background:var(--tint);font-size:.9rem;font-weight:600;color:var(--red2)}
.gcs-source-actions{display:flex;gap:8px;flex-wrap:wrap}
.gcs-btn{min-height:44px;padding:0 18px;border-radius:22px;border:2px solid var(--red);background:var(--red);color:#fff;font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none}
.gcs-btn:disabled{opacity:.55;cursor:default}
.gcs-btn-quiet{background:var(--paper);color:var(--red)}
.gcs button:focus-visible,.gcs a:focus-visible,.gcs input:focus-visible,.gcs select:focus-visible{outline:3px solid var(--red2);outline-offset:2px}
.gcs-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:4px;border:2px solid var(--line);border-radius:28px}
.gcs-tab{flex:1;min-width:130px;min-height:44px;border:0;border-radius:22px;background:transparent;color:var(--red);font:inherit;font-weight:700;cursor:pointer}
.gcs-tab[aria-pressed="true"]{background:var(--red);color:#fff}
.gcs-list{display:flex;flex-direction:column;gap:12px}
.gcs-hint{color:var(--red2);font-weight:600}
.gcs-empty{padding:20px;border:2px dashed var(--line);border-radius:20px;color:var(--red2)}
.gcs-service{box-sizing:border-box;display:flex;align-items:center;gap:14px;flex-wrap:wrap;width:100%;text-align:left;padding:16px;border:2px solid var(--red);border-radius:22px;background:var(--paper);color:var(--ink);font:inherit;cursor:pointer}
.gcs-service:disabled{cursor:default}
.gcs-service-off{border-color:var(--line);cursor:default;opacity:.8}
.gcs-service-mark{width:48px;height:48px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0}
.gcs-service-off .gcs-service-mark{background:var(--tint);color:var(--red2)}
.gcs-service-text{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:2px}
.gcs-service-text strong{color:var(--red);font-size:1.1rem}
.gcs-chevron{font-size:1.6rem;font-weight:700;color:var(--red);line-height:1}
.gcs-crumb{align-self:flex-start;min-height:44px;padding:0 4px;border:0;background:transparent;color:var(--red);font:inherit;font-weight:700;cursor:pointer}
.gcs-group{display:flex;flex-direction:column;gap:10px}
.gcs-group-head{box-sizing:border-box;display:flex;align-items:center;gap:12px;flex-wrap:wrap;width:100%;text-align:left;min-height:64px;padding:12px 16px;border:2px solid var(--line);border-radius:20px;background:var(--tint);color:var(--ink);font:inherit;cursor:pointer}
.gcs-group-head[aria-expanded="true"]{border-color:var(--red)}
.gcs-group-name{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:2px;overflow-wrap:anywhere}
.gcs-group-name strong{color:var(--red)}
.gcs-item,.gcs-finding,.gcs-q,.gcs-toggle-row,.gcs-exposed{border:2px solid var(--line);border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:12px}
.gcs-group .gcs-item{margin-left:16px}
.gcs-item-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.gcs-item-text{min-width:0;flex:1 1 280px;display:flex;flex-direction:column;gap:4px}
.gcs-item-text p{overflow-wrap:anywhere}
.gcs-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.gcs-chip{padding:4px 10px;border-radius:999px;border:2px solid var(--line);font-size:.78rem;font-weight:700;color:var(--red2);white-space:nowrap}
.gcs-chip-evidence{background:var(--tint);border-color:var(--tint)}
.gcs-risk-high{background:var(--red);border-color:var(--red);color:#fff}
.gcs-risk-medium{border-color:var(--red);color:var(--red)}
.gcs-risk-low{border-color:var(--line)}
.gcs-seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.gcs-seg button{min-height:44px;border-radius:22px;border:2px solid var(--line);background:var(--paper);color:var(--red);font:inherit;font-weight:700;cursor:pointer}
.gcs-seg button[aria-pressed="true"]{background:var(--red);border-color:var(--red);color:#fff}
.gcs-remove{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:2px dashed var(--red);border-radius:16px;font-size:.92rem}
.gcs-remove strong{color:var(--red)}
.gcs-remove a{color:var(--red);font-weight:700}
.gcs-note{font-size:.88rem;color:var(--red2)}
.gcs-finding.is-done{opacity:.75}
.gcs-finding-actions{display:flex;gap:8px;flex-wrap:wrap}
.gcs-exposed{background:var(--tint);border-color:var(--tint)}
.gcs-exposed-head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center}
.gcs-exposed dl{display:grid;grid-template-columns:minmax(0,190px) minmax(0,1fr);gap:8px 16px;margin:0}
.gcs-exposed dt{font-weight:700;color:var(--red)}
.gcs-exposed dd{margin:0;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.gcs-exposed .gcs-btn{align-self:flex-start}
.gcs-q input[type="text"],.gcs-q select{min-height:44px;border-radius:22px;border:2px solid var(--line);padding:0 16px;font:inherit;color:var(--ink);background:var(--paper);max-width:360px;width:100%}
.gcs-toggle-row{flex-direction:row;align-items:center;justify-content:space-between;gap:16px}
.gcs-toggle-row>div{min-width:0;display:flex;flex-direction:column;gap:4px}
.gcs-switch{min-width:88px;min-height:44px;border-radius:22px;border:2px solid var(--red);background:var(--paper);color:var(--red);font:inherit;font-weight:700;cursor:pointer;flex-shrink:0}
.gcs-switch[aria-checked="true"]{background:var(--red);color:#fff}
.gcs-check{display:flex;gap:10px;align-items:center;min-height:44px;cursor:pointer}
.gcs-check input{width:22px;height:22px;accent-color:var(--red)}
.gcs-meridian{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 16px;border-radius:16px;border:2px solid var(--line);font-size:.9rem}
.gcs-meridian strong{color:var(--red)}
.gcs-meridian span{flex:1 1 240px;min-width:0;overflow-wrap:anywhere}
.gcs-meridian-ok{border-color:var(--red)}
.gcs-meridian-error{border-style:dashed;border-color:var(--red);color:var(--red)}
.gcs-link{min-height:44px;border:0;background:transparent;color:var(--red);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
.gcs-protect{border:2px solid var(--red);border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:14px}
.gcs-protect-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
.gcs-protect-head>div{min-width:0;display:flex;flex-direction:column;gap:4px}
.gcs-switch-big{min-width:110px;min-height:56px;border-radius:28px;font-size:1.1rem}
.gcs-means{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.gcs-means>div{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:16px;border:2px solid var(--line);font-size:.92rem}
.gcs-means>div.is-now{border-color:var(--red);background:var(--tint)}
.gcs-means strong{color:var(--red)}
@media (max-width:520px){.gcs-means{grid-template-columns:1fr}.gcs-protect-head{flex-direction:column;align-items:flex-start}}
.gcs-add{box-sizing:border-box;width:100%;min-height:64px;border-radius:22px;border:2px dashed var(--red);background:var(--paper);color:var(--red);font:inherit;font-size:1.05rem;font-weight:800;cursor:pointer}
.gcs-addform{border:2px solid var(--red);border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:12px}
.gcs-addform label{font-weight:700;color:var(--red)}
.gcs-addopts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gcs-addopt{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:16px;border:2px solid var(--line);font-size:.88rem}
.gcs-addopt strong{color:var(--red)}
.gcs-addopt.is-on{border-color:var(--red);background:var(--tint)}
.gcs-addopt.is-off{opacity:.65}
.gcs-addrow{display:flex;gap:8px;flex-wrap:wrap}
.gcs-addrow input{flex:1 1 220px;min-width:0;min-height:44px;border-radius:22px;border:2px solid var(--line);padding:0 16px;font:inherit;color:var(--ink);background:var(--paper)}
.gcs-sitecheck{border:2px solid var(--line);border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:10px}
.gcs-sitecheck ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.gcs-sitecheck li{display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:14px;border:2px solid var(--line);font-size:.92rem}
.gcs-sitecheck li strong{min-width:64px;text-align:center;padding:2px 8px;border-radius:999px;font-size:.78rem}
.gcs-sitecheck li.is-ok strong{background:var(--tint);color:var(--red2)}
.gcs-sitecheck li.is-bad{border-color:var(--red)}
.gcs-sitecheck li.is-bad strong{background:var(--red);color:#fff}
.gcs-sitecheck .gcs-link{align-self:flex-start}
@media (max-width:520px){.gcs-addopts,.gcs-sitecheck ul{grid-template-columns:1fr}}
.gcs-foot{font-size:.8rem;color:var(--red2);text-align:center;padding-top:8px}
@media (max-width:520px){.gcs-score{width:110px;height:110px}.gcs-exposed dl{grid-template-columns:1fr}.gcs-group .gcs-item{margin-left:0}}
`;
