import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxies Senja testimonials so the API key stays server-side.
 * Always answers 200 with a list (empty on any failure) so the landing page
 * never breaks if the key is missing, revoked, or Senja is down.
 */
export async function GET() {
  const key = process.env.SENJA_API_KEY;
  if (!key) return NextResponse.json([]);

  try {
    const res = await fetch("https://api.senja.io/v1/testimonials?limit=9", {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json([]);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data ?? []);
    return NextResponse.json(list.slice(0, 9));
  } catch {
    return NextResponse.json([]);
  }
}
