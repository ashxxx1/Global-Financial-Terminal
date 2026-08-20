export const config = { runtime: "edge" };

/**
 * Dynamic Open Graph card for any page — growth-plan item 96.
 *
 * Generalises api/og-compare.ts, which only ever handled the compare route, so
 * every page can present itself properly when shared. Social CTR is the whole
 * point: a link with a real card gets clicked several times more often than a
 * bare URL, and this is the cheapest distribution work available.
 *
 * SVG rather than a rasteriser: it renders in every card scraper that matters,
 * costs no dependency, and stays legible at any size. Everything is escaped
 * because every value here comes from a query string.
 *
 * GET /api/og?title=...&subtitle=...&value=...&change=1.24&kind=stock
 */

const CLAMP = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** XML-escape. The card is user-supplied text rendered into markup. */
function esc(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] as string));
}

export default async function handler(req: Request): Promise<Response> {
  const p = new URL(req.url).searchParams;

  const title = esc(CLAMP((p.get("title") || "Global Financial Terminal").trim(), 42));
  const subtitle = esc(CLAMP((p.get("subtitle") || "The world's economy, on one screen").trim(), 70));
  const value = esc(CLAMP((p.get("value") || "").trim(), 18));
  const kind = esc(CLAMP((p.get("kind") || "").trim(), 18)).toUpperCase();

  const changeRaw = Number(p.get("change"));
  const hasChange = Number.isFinite(changeRaw);
  const up = changeRaw >= 0;
  const changeText = hasChange ? `${up ? "+" : ""}${changeRaw.toFixed(2)}%` : "";
  const accent = !hasChange ? "#8a8f98" : up ? "#26D07C" : "#FF4D5E";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050506"/>
      <stop offset="100%" stop-color="#0d0f14"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="3" fill="${accent}"/>

  <text x="72" y="104" fill="#8a8f98" font-family="ui-monospace,Menlo,monospace" font-size="20" letter-spacing="6">GFT · TERMINAL${kind ? ` · ${kind}` : ""}</text>

  <text x="72" y="248" fill="#f5f6f7" font-family="Georgia,'Times New Roman',serif" font-size="76" font-weight="700">${title}</text>
  <text x="72" y="312" fill="#a4a9b3" font-family="system-ui,-apple-system,sans-serif" font-size="30">${subtitle}</text>

  ${value ? `<text x="72" y="470" fill="#f5f6f7" font-family="ui-monospace,Menlo,monospace" font-size="86" font-weight="700">${value}</text>` : ""}
  ${changeText ? `<text x="${value ? 72 + value.length * 52 : 72}" y="470" fill="${accent}" font-family="ui-monospace,Menlo,monospace" font-size="42" font-weight="700">${changeText}</text>` : ""}

  <text x="72" y="566" fill="#6b7079" font-family="system-ui,-apple-system,sans-serif" font-size="22">Live markets across 68 countries · every figure states its source</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // Cards are scraped repeatedly by every platform; cache hard.
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
