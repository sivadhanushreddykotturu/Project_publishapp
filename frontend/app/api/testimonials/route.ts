import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxies Senja testimonials so the API key stays server-side.
 * Always answers 200 with a list (empty on any failure) so the landing page
 * never breaks if the key is missing, revoked, or Senja is down.
 */
const PUNCHY_QUOTES: Record<string, string> = {
  "daafbc1f-dfc6-4ca2-a567-1e8e15b0f0b6":
    "Nandha Kishore helped get our app live on the Play Store. His testing community found critical bugs and UI issues we had missed, giving us total confidence before making it live. Highly recommended!",
  "6675168d-0cbf-4d7f-a467-85b5197386a3":
    "I run a software agency and needed continuous app testing and publishing support. Nandha made the whole process seamless, reliable, and guided us quickly through the entire rollout.",
  "54d38480-0795-4555-902e-aef2b8fba37f":
    "Google Play previously rejected us for weak engagement. With UXOS, testers sent full QA reports with screenshots. Google granted production approval, and One Sport is now live!",
  "c948e08c-ad69-488e-8b4a-992d8a624843":
    "They conducted closed testing plus UX testing and shared detailed bug reports, catching critical issues we'd overlooked. It gave us a much stronger foundation for retention after launch.",
};

function cleanQuote(id: string, rawText: string): string {
  if (PUNCHY_QUOTES[id]) return PUNCHY_QUOTES[id];
  if (!rawText) return "";
  const firstPara = rawText.split(/\n+/)[0].trim();
  if (firstPara.length > 200) {
    const end = firstPara.indexOf(". ", 120);
    if (end !== -1 && end < 220) return firstPara.slice(0, end + 1);
    return firstPara.slice(0, 190).trim() + "...";
  }
  return firstPara;
}

export async function GET() {
  const key = process.env.SENJA_API_KEY || "Kocgk8v90Z0tQT04rChy9l218JJm";

  try {
    const res = await fetch("https://api.senja.io/v1/testimonials?limit=20", {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json([]);
    const json = await res.json();
    const rawList = Array.isArray(json)
      ? json
      : Array.isArray(json.testimonials)
      ? json.testimonials
      : Array.isArray(json.data)
      ? json.data
      : [];

    const list = rawList.map((t: any) => {
      const titleParts = [t.customer_tagline, t.customer_company].filter(Boolean);
      const rawContent = t.text || t.form_responses?.[0]?.answer || "";
      return {
        id: t.id,
        content: cleanQuote(t.id, rawContent),
        rating: typeof t.rating === "number" ? t.rating : 5,
        author_name: t.customer_name || t.endorser?.name || "Verified Client",
        author_title: titleParts.length > 0 ? titleParts.join(" · ") : (t.endorser?.tagline || "Product Owner"),
        author_avatar: t.customer_avatar || t.endorser?.avatar || null,
        company_logo: t.customer_company_logo || null,
        company_url: t.customer_url || t.endorser?.url || null,
        date: t.date || t.created_at,
        public_url: t.links?.public || null,
      };
    });

    return NextResponse.json(list.slice(0, 9));
  } catch {
    return NextResponse.json([]);
  }
}
