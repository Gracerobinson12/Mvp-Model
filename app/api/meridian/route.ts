// GC Shield · sync to the Meridian back office (External Object API).
// Env: MERIDIAN_API_KEY (an mk_live_… key acting as Business Owner)
//      MERIDIAN_BASE_URL (optional, default https://dev.lightleap.ai/meridian)
// Access Items are created as "Needs review" first, then updated, so Meridian's
// "Finding on Unauthorized Access" workflow fires on the update inside Meridian.
// The key stays on the server and is never sent to the browser.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = (process.env.MERIDIAN_BASE_URL || "https://dev.lightleap.ai/meridian").replace(/\/$/, "");
const API = `${BASE}/api/ext/v1/objects`;

type Fields = Record<string, string | number | boolean | null>;
type Rec = { id: string; fields: Record<string, unknown> };

type ItemIn = {
  name: string;
  direction: string;
  type: string;
  description: string;
  risk: string;
  howToRemove: string;
  reviewStatus: string;
};

// The body shape Meridian accepted last time (found on first successful write).
let bodyShape: "flat" | "data" | "fields" | "values" | null = null;

function headers() {
  return {
    Authorization: `Bearer ${process.env.MERIDIAN_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function readError(res: Response) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    return `${res.status} ${j.code ?? ""} ${j.detail ?? j.message ?? j.error ?? text}`.trim();
  } catch {
    return `${res.status} ${text.slice(0, 300)}`;
  }
}

async function list(object: string): Promise<Rec[]> {
  const res = await fetch(`${API}/${object}?limit=500`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Couldn't read ${object} from Meridian: ${await readError(res)}`);
  const body = await res.json();
  const rows: unknown[] = Array.isArray(body) ? body : body.records ?? body.data ?? body.items ?? body.rows ?? [];
  return rows.map((r) => {
    const o = r as Record<string, unknown>;
    const id = String(o.id ?? o._id ?? o.recordId ?? "");
    const fields = (o.fields ?? o.values ?? o.data ?? o) as Record<string, unknown>;
    return { id, fields };
  });
}

function wrap(shape: NonNullable<typeof bodyShape>, fields: Fields) {
  return shape === "flat" ? fields : { [shape]: fields };
}

function idFrom(body: unknown): string | null {
  const o = (body ?? {}) as Record<string, unknown>;
  const inner = (o.record ?? o.data ?? o) as Record<string, unknown>;
  const id = inner.id ?? inner._id ?? inner.recordId ?? o.id;
  return id ? String(id) : null;
}

async function write(object: string, fields: Fields, id?: string): Promise<string | null> {
  const shapes = bodyShape ? [bodyShape] : (["flat", "data", "fields", "values"] as const);
  const methods = id ? ["PATCH", "PUT"] : ["POST"];
  let last = "";
  for (const method of methods) {
    for (const shape of shapes) {
      const res = await fetch(id ? `${API}/${object}/${id}` : `${API}/${object}`, {
        method,
        headers: headers(),
        body: JSON.stringify(wrap(shape, fields)),
        cache: "no-store",
      });
      if (res.ok) {
        bodyShape = shape;
        const body = await res.json().catch(() => ({}));
        return idFrom(body) ?? id ?? null;
      }
      last = await readError(res);
      if (res.status === 401 || res.status === 403) throw new Error(`Meridian refused the key: ${last}`);
      if (res.status === 404 || res.status === 405) break; // try the next method
    }
  }
  throw new Error(`Meridian didn't accept the ${object} ${id ? "update" : "record"}: ${last}`);
}

const key = (name: unknown, desc: unknown) => `${String(name ?? "").toLowerCase()}|${String(desc ?? "").toLowerCase()}`;
const today = () => new Date().toISOString().slice(0, 10);

function itemFields(it: ItemIn, reviewStatus: string): Fields {
  return {
    name: it.name,
    direction: it.direction,
    itemType: it.type,
    accessDescription: it.description,
    risk: it.risk,
    evidence: "Verified",
    reviewStatus,
    howToRemove: it.howToRemove,
    removalConfirmed: false,
    lastSeen: today(),
  };
}

const ITEM_TYPES = new Set(["Browser extension", "AI tool", "App", "Bot", "Person", "Token", "Role", "Shared drive"]);
// Map GitHub kinds onto the Item Type options defined in Meridian.
function meridianType(t: string) {
  if (ITEM_TYPES.has(t)) return t;
  if (t === "Deploy key" || t === "SSH key") return "Token";
  if (t === "Webhook") return "App";
  if (t === "Repository" || t === "Organization") return "Role";
  return "App";
}

export async function POST(req: NextRequest) {
  if (!process.env.MERIDIAN_API_KEY) {
    return NextResponse.json({ error: "MERIDIAN_API_KEY is missing. Add your mk_live_ key to the environment variables and redeploy." }, { status: 500 });
  }
  const body = (await req.json()) as { action: string; items?: ItemIn[]; item?: ItemIn; reviewStatus?: string; wifi?: { provider: string | null; ip: string | null; location: string | null; protectedOn: boolean } };

  try {
    if (body.action === "test") {
      const rows = await list("accessItem");
      return NextResponse.json({ ok: true, message: `Connected to Meridian · ${rows.length} Access Items in the back office` });
    }

    if (body.action === "syncItems" || body.action === "setReview") {
      const incoming = body.action === "setReview" && body.item ? [{ ...body.item, reviewStatus: body.reviewStatus ?? body.item.reviewStatus }] : body.items ?? [];
      const existing = await list("accessItem");
      const byKey = new Map(existing.map((r) => [key(r.fields.name, r.fields.accessDescription), r]));
      let created = 0;
      let updated = 0;
      for (const raw of incoming) {
        const it = { ...raw, type: meridianType(raw.type) };
        const k = key(it.name, it.description);
        const found = byKey.get(k);
        if (!found) {
          const id = await write("accessItem", itemFields(it, "Needs review"));
          created++;
          if (it.reviewStatus !== "Needs review" && id) {
            await write("accessItem", { reviewStatus: it.reviewStatus }, id);
            updated++;
          }
        } else if (String(found.fields.reviewStatus ?? "") !== it.reviewStatus) {
          await write("accessItem", { reviewStatus: it.reviewStatus, lastSeen: today() }, found.id);
          updated++;
        }
      }
      return NextResponse.json({ ok: true, created, updated, message: `Synced to Meridian · ${created} new, ${updated} updated` });
    }

    if (body.action === "logWifi" && body.wifi) {
      const w = body.wifi;
      const networkName = w.provider ? `${w.provider}${w.location ? ` · ${w.location}` : ""}` : "Current Wi-Fi";
      const networks = await list("wiFiNetwork");
      let net = networks.find((r) => String(r.fields.networkName ?? r.fields.name ?? "") === networkName);
      let netId = net?.id ?? null;
      if (!netId) {
        netId = await write("wiFiNetwork", {
          networkId: `NET-${Date.now().toString(36).toUpperCase()}`,
          networkName,
          security: "Unknown",
          placeType: "Other",
          trust: "Needs review",
          lastJoined: today(),
        });
      }
      await write("wiFiSession", {
        sessionName: `${networkName} · ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
        started: today(),
        safeWiFiMode: w.protectedOn,
        riskySitesBlocked: 0,
        wiFiNetwork: netId,
      });
      return NextResponse.json({
        ok: true,
        message: w.protectedOn ? "Wi-Fi session saved to Meridian · protection on" : "Wi-Fi session saved to Meridian · protection off, so Meridian flags it",
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Meridian sync failed." }, { status: 502 });
  }
}
