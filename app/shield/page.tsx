"use client";

// GC Shield by Gratia Core · /shield
// Access Shield: live, read-only scan of your GitHub (via /api/shield/github).
// Wi-Fi Shield: what the network you're on reveals (via /api/shield/network),
// plus your answers about the Wi-Fi and its protection.
// Labels and fields match the Meridian back office (Access Item, Finding).

import { useCallback, useEffect, useMemo, useState } from "react";

type Risk = "Low" | "Medium" | "High";
type Review = "Authorized" | "Unauthorized" | "Needs review";
type Direction = "Can reach you" | "You can reach";

type AccessItem = {
  id: string;
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

type NetData = { ip: string; city: string | null; region: string | null; country: string | null; https: boolean; checkedAt: string };

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

type WifiAnswers = {
  password: "Yes" | "No" | "Not sure" | null;
  place: string;
  protectedOn: boolean;
  checks: Record<string, boolean>;
};

const CHECKS = [
  "AirDrop or nearby sharing limited to contacts",
  "File sharing turned off",
  "Auto-join turned off for public Wi-Fi",
  "Phone and laptop software up to date",
];

const KEYS = { status: "gcshield.status", findings: "gcshield.findings", wifi: "gcshield.wifi" };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state stays in memory */
  }
}

const WEIGHT: Record<Risk, number> = { High: 15, Medium: 8, Low: 3 };
const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");

export default function ShieldPage() {
  const [gh, setGh] = useState<GithubData | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [net, setNet] = useState<NetData | null>(null);
  const [tab, setTab] = useState<"reach-you" | "you-reach" | "findings" | "wifi">("reach-you");
  const [status, setStatus] = useState<Record<string, Review>>({});
  const [stored, setStored] = useState<Record<string, StoredFinding>>({});
  const [wifi, setWifi] = useState<WifiAnswers>({ password: null, place: "Coffee shop", protectedOn: false, checks: {} });

  useEffect(() => {
    setStatus(load(KEYS.status, {}));
    setStored(load(KEYS.findings, {}));
    setWifi(load(KEYS.wifi, { password: null, place: "Coffee shop", protectedOn: false, checks: {} }));
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
      return body as GithubData;
    } catch {
      setGhError("Couldn't reach the Shield server. Check your connection and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/shield/network", { cache: "no-store" });
      setNet((await res.json()) as NetData);
    } catch {
      setNet(null);
    }
  }, []);

  useEffect(() => {
    scan();
    checkNetwork();
  }, [scan, checkNetwork]);

  const items = gh?.items ?? [];
  const reviewOf = (id: string): Review => status[id] ?? "Needs review";

  function setReview(item: AccessItem, value: Review) {
    const next = { ...status, [item.id]: value };
    setStatus(next);
    save(KEYS.status, next);
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
    const fresh = await scan();
    if (!fresh) return;
    const ids = new Set(fresh.items.map((i) => i.id));
    const next = { ...stored };
    for (const [fid, f] of Object.entries(stored)) {
      if (f.state !== "Fixing") continue;
      const itemId = fid.slice(2);
      next[fid] = ids.has(itemId)
        ? { ...f, state: "Open", note: "Still on GitHub at the last check." }
        : { ...f, state: "Confirmed", note: `Confirmed gone from GitHub at ${time(fresh.checkedAt)}.`, at: fresh.checkedAt };
    }
    setStored(next);
    save(KEYS.findings, next);
  }

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
    if (wifi.password) {
      const open = wifi.password === "No";
      const unsure = wifi.password === "Not sure";
      if ((open || unsure) && !wifi.protectedOn) {
        list.push({
          id: "wifi",
          severity: open ? "High" : "Medium",
          source: "Wi-Fi Shield",
          title: `Risky Wi-Fi: ${open ? "open" : "unknown"} network at a ${wifi.place.toLowerCase()} with no protection`,
          detail: "Turn on a VPN, iCloud Private Relay or private DNS before signing in to anything. Avoid entering passwords until it's on.",
          state: "Open",
          canFix: false,
        });
      } else if (open && wifi.protectedOn) {
        list.push({
          id: "wifi",
          severity: "Low",
          source: "Wi-Fi Shield",
          title: `Open Wi-Fi at a ${wifi.place.toLowerCase()}, protection on`,
          detail: "Keep protection on while you're here, and turn off auto-join for this network.",
          state: "Open",
          canFix: false,
        });
      }
    }
    const order: Record<Risk, number> = { High: 0, Medium: 1, Low: 2 };
    return list.sort((a, b) => (a.state === "Confirmed" ? 1 : 0) - (b.state === "Confirmed" ? 1 : 0) || order[a.severity] - order[b.severity]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status, stored, wifi]);

  const counts = useMemo(() => {
    const c = { Authorized: 0, Unauthorized: 0, "Needs review": 0 } as Record<Review, number>;
    for (const it of items) c[reviewOf(it.id)]++;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status]);

  const openFindings = findings.filter((f) => f.state !== "Confirmed");
  const score = Math.max(0, 100 - openFindings.reduce((s, f) => s + WEIGHT[f.severity], 0) - 4 * counts["Needs review"]);

  function exportCsv() {
    const head = ["Name", "Direction", "Item Type", "Access Description", "Risk", "Evidence", "Review Status", "How To Remove", "Removal Confirmed", "Last Seen"];
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = items.map((it) =>
      [it.name, it.direction, it.type, it.description, it.risk, it.evidence, reviewOf(it.id), it.howToRemove, "No", gh?.checkedAt.slice(0, 10) ?? ""].map(q).join(",")
    );
    const blob = new Blob([[head.map(q).join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gc-shield-access-items.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const shown = items.filter((i) => i.direction === (tab === "you-reach" ? "You can reach" : "Can reach you"));
  const location = net && (net.city || net.region || net.country) ? [net.city, net.region, net.country].filter(Boolean).join(", ") : null;

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
          <button type="button" className="gcs-btn gcs-btn-quiet" onClick={exportCsv} disabled={!items.length}>
            Export to Meridian (CSV)
          </button>
        </div>
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
          <button key={id} type="button" aria-pressed={tab === id} className="gcs-tab" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {(tab === "reach-you" || tab === "you-reach") && (
        <section className="gcs-list" aria-label={tab === "reach-you" ? "Can reach you" : "You can reach"}>
          <p className="gcs-hint">
            {tab === "reach-you"
              ? "People, servers, services and computers with access to your GitHub."
              : "Other people's repositories and organizations you can still change."}
          </p>
          {!loading && !ghError && shown.length === 0 && (
            <p className="gcs-empty">
              Nothing found here. {tab === "you-reach" ? "A fine-grained key only sees repositories you own, so this list may stay empty." : ""}
            </p>
          )}
          {shown.map((it) => {
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
                    <span className="gcs-chip gcs-chip-evidence">Verified · GitHub</span>
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
                      Open on GitHub ↗
                    </a>
                  </div>
                )}
              </article>
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
                    Open on GitHub ↗
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
            <p className="gcs-eyebrow">What this Wi-Fi reveals to every site you visit</p>
            <dl>
              <dt>Public IP address</dt>
              <dd>{net?.ip ?? "Checking…"}</dd>
              <dt>Location from that IP</dt>
              <dd>{location ?? "Shows once deployed on Vercel"}</dd>
              <dt>This page&apos;s connection</dt>
              <dd>{net ? (net.https ? "Encrypted (HTTPS)" : "Not encrypted") : "Checking…"}</dd>
            </dl>
            <button type="button" className="gcs-btn gcs-btn-quiet" onClick={checkNetwork}>
              Check this network again
            </button>
          </div>

          <div className="gcs-q">
            <h3>Did this Wi-Fi ask for a password to join?</h3>
            <div className="gcs-seg" role="group" aria-label="Wi-Fi password">
              {(["Yes", "No", "Not sure"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={wifi.password === v} onClick={() => updateWifi({ password: v })}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="gcs-q">
            <label htmlFor="gcs-place">
              <h3>Where are you?</h3>
            </label>
            <select id="gcs-place" value={wifi.place} onChange={(e) => updateWifi({ place: e.target.value })}>
              {["Coffee shop", "Library", "Airport", "Hotel", "Office", "Home"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="gcs-toggle-row">
            <div>
              <h3>Protection on this network</h3>
              <p>A VPN, iCloud Private Relay or private DNS is turned on. Added by you.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={wifi.protectedOn}
              className="gcs-switch"
              onClick={() => updateWifi({ protectedOn: !wifi.protectedOn })}
            >
              <span>{wifi.protectedOn ? "On" : "Off"}</span>
            </button>
          </div>

          <div className="gcs-q">
            <h3>Device checklist</h3>
            {CHECKS.map((c, i) => (
              <label key={c} className="gcs-check" htmlFor={`gcs-check-${i}`}>
                <input
                  id={`gcs-check-${i}`}
                  type="checkbox"
                  checked={!!wifi.checks[c]}
                  onChange={(e) => updateWifi({ checks: { ...wifi.checks, [c]: e.target.checked } })}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>

          <p className="gcs-note">
            A website can&apos;t read your Wi-Fi name or settings, so the questions above are answered by you. The Wi-Fi Shield download checks the
            network and turns on protection automatically.
          </p>
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
.gcs h1,.gcs h3{margin:0;color:var(--red)}
.gcs h1{font-family:Unbounded,Figtree,system-ui,sans-serif;font-size:2rem;letter-spacing:-0.02em}
.gcs h3{font-size:1rem}
.gcs p{margin:0;line-height:1.5}
.gcs-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.gcs-brand{display:flex;align-items:center;gap:12px}
.gcs-dot{width:40px;height:40px;border-radius:50%;background:var(--red);box-shadow:inset -10px -10px 0 0 var(--red2)}
.gcs-eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--red2)}
.gcs-pill{padding:6px 14px;border-radius:999px;background:var(--tint);color:var(--red2);font-weight:700;font-size:.85rem}
.gcs-lead{max-width:62ch;color:var(--ink)}
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
.gcs-btn:focus-visible,.gcs-tab:focus-visible,.gcs-seg button:focus-visible,.gcs-switch:focus-visible{outline:3px solid var(--red2);outline-offset:2px}
.gcs-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:4px;border:2px solid var(--line);border-radius:28px}
.gcs-tab{flex:1;min-width:130px;min-height:44px;border:0;border-radius:22px;background:transparent;color:var(--red);font:inherit;font-weight:700;cursor:pointer}
.gcs-tab[aria-pressed="true"]{background:var(--red);color:#fff}
.gcs-list{display:flex;flex-direction:column;gap:12px}
.gcs-hint{color:var(--red2);font-weight:600}
.gcs-empty{padding:20px;border:2px dashed var(--line);border-radius:20px;color:var(--red2)}
.gcs-item,.gcs-finding,.gcs-q,.gcs-toggle-row,.gcs-exposed{border:2px solid var(--line);border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:12px}
.gcs-item-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.gcs-item-text{min-width:0;flex:1 1 280px;display:flex;flex-direction:column;gap:4px}
.gcs-item-text p{color:var(--ink);overflow-wrap:anywhere}
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
.gcs-exposed dl{display:grid;grid-template-columns:minmax(0,190px) minmax(0,1fr);gap:8px 16px;margin:0}
.gcs-exposed dt{font-weight:700;color:var(--red)}
.gcs-exposed dd{margin:0;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.gcs-exposed .gcs-btn{align-self:flex-start}
.gcs-q select{min-height:44px;border-radius:22px;border:2px solid var(--line);padding:0 14px;font:inherit;color:var(--ink);background:var(--paper);max-width:280px}
.gcs-toggle-row{flex-direction:row;align-items:center;justify-content:space-between;gap:16px}
.gcs-toggle-row>div{min-width:0;display:flex;flex-direction:column;gap:4px}
.gcs-switch{min-width:88px;min-height:44px;border-radius:22px;border:2px solid var(--red);background:var(--paper);color:var(--red);font:inherit;font-weight:700;cursor:pointer;flex-shrink:0}
.gcs-switch[aria-checked="true"]{background:var(--red);color:#fff}
.gcs-check{display:flex;gap:10px;align-items:center;min-height:44px;cursor:pointer}
.gcs-check input{width:22px;height:22px;accent-color:var(--red)}
.gcs-foot{font-size:.8rem;color:var(--red2);text-align:center;padding-top:8px}
@media (max-width:520px){.gcs-counts{grid-template-columns:repeat(3,minmax(0,1fr));min-width:0}.gcs-score{width:110px;height:110px}.gcs-exposed dl{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.gcs *{transition:none!important}}
`;
