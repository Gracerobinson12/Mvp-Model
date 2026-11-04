// GC Shield · Wi-Fi Shield network check.
// Looks at the network you're on right now, the way every website sees it:
// the public IP of this Wi-Fi, who provides that connection, the location it
// gives away, and whether traffic seems to leave through a VPN or relay.
// Provider lookup uses ipinfo.io (works without a key for light use; set
// IPINFO_TOKEN for more). Vercel's location headers are the fallback.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function header(req: NextRequest, name: string) {
  const v = req.headers.get(name);
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const PRIVATE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd|localhost)/i;
// Networks that usually mean a VPN, iCloud Private Relay or a cloud egress, not a venue's own internet.
const RELAY = /(cloudflare|akamai|fastly|apple|mullvad|nord|express ?vpn|proton|surfshark|private internet access|m247|datacamp|digitalocean|amazon|google cloud|microsoft|ovh|hetzner|linode|vultr|zscaler)/i;

type IpInfo = { ip?: string; city?: string; region?: string; country?: string; org?: string };

export async function GET(req: NextRequest) {
  const forwarded = header(req, "x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : null) || header(req, "x-real-ip") || null;

  let info: IpInfo | null = null;
  if (ip && !PRIVATE.test(ip)) {
    try {
      const token = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : "";
      const res = await fetch(`https://ipinfo.io/${ip}/json${token}`, { cache: "no-store" });
      if (res.ok) info = (await res.json()) as IpInfo;
    } catch {
      info = null;
    }
  }

  const provider = info?.org ? info.org.replace(/^AS\d+\s+/, "") : null;

  return NextResponse.json({
    ip: ip && !PRIVATE.test(ip) ? ip : null,
    provider,
    city: info?.city ?? header(req, "x-vercel-ip-city"),
    region: info?.region ?? header(req, "x-vercel-ip-country-region"),
    country: info?.country ?? header(req, "x-vercel-ip-country"),
    relayLikely: provider ? RELAY.test(provider) : null,
    https: (header(req, "x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https",
    checkedAt: new Date().toISOString(),
  });
}
