/**
 * Dynamic OG card for compare shares.
 * GET /api/og-compare?a=AAPL&b=MSFT  → image/svg+xml
 */
export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const a = (searchParams.get("a") || "AAPL").toUpperCase().slice(0, 12);
  const b = (searchParams.get("b") || "MSFT").toUpperCase().slice(0, 12);
  const safe = (s: string) => s.replace(/[^A-Z0-9.\-]/g, "");

  const left = safe(a) || "AAPL";
  const right = safe(b) || "MSFT";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#070B14"/>
      <stop offset="100%" stop-color="#121A2B"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="48" y="48" width="1104" height="534" rx="18" fill="#0E1626" stroke="#2A3A55" stroke-width="2"/>
  <text x="80" y="120" fill="#E7B429" font-family="ui-monospace, Menlo, monospace" font-size="28" letter-spacing="6">GFT TERMINAL</text>
  <text x="80" y="180" fill="#8B9BB4" font-family="ui-monospace, Menlo, monospace" font-size="22" letter-spacing="4">CHART COMPARE</text>
  <text x="80" y="320" fill="#2DE2E6" font-family="ui-monospace, Menlo, monospace" font-size="96" font-weight="700">${left}</text>
  <text x="520" y="300" fill="#5C6B82" font-family="ui-monospace, Menlo, monospace" font-size="36" letter-spacing="8">VS</text>
  <text x="640" y="320" fill="#E7B429" font-family="ui-monospace, Menlo, monospace" font-size="96" font-weight="700">${right}</text>
  <text x="80" y="420" fill="#939DB1" font-family="Inter, system-ui, sans-serif" font-size="28">Normalized % performance · shareable pair</text>
  <text x="80" y="520" fill="#5C6B82" font-family="ui-monospace, Menlo, monospace" font-size="20">global-financial-terminal-eight.vercel.app/compare/${left}/${right}</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
