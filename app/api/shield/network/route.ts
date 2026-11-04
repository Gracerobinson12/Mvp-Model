// GC Shield · Wi-Fi Shield network check.
// Shows what any website can see about the network you're on:
// your public IP address and the approximate location it gives away.
// City, region and country come from Vercel's request headers, so they
// appear once the site is deployed on Vercel (not on localhost).
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

export async function GET(req: NextRequest) {
  const forwarded = header(req, "x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : null) || header(req, "x-real-ip") || "Not available on localhost";

  return NextResponse.json({
    ip,
    city: header(req, "x-vercel-ip-city"),
    region: header(req, "x-vercel-ip-country-region"),
    country: header(req, "x-vercel-ip-country"),
    https: (header(req, "x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https",
    checkedAt: new Date().toISOString(),
  });
}
