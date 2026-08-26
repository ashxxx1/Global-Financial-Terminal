export const config = { runtime: "edge" };

/**
 * Share card for any page — growth-plan items 96 and 109.
 *
 * ── The fault this fixes ────────────────────────────────────────────────────
 * The card used to take its numbers from the query string. `?value=$0.01&
 * change=-99` rendered exactly that, on our own domain, over our own branding:
 * anyone could mint a convincing image of a false price and attribute it to us.
 * It now resolves the company from our own registry and fetches the quote
 * itself. No figure in the output comes from the caller.
 *
 * Because it renders per request, the price is live at the moment the image is
 * loaded rather than baked in at build time — the one place a live number is
 * safe, and the reason the prerenderer can reference it without breaking its
 * own no-prices rule. The card stamps the minute it was generated.
 *
 * ── Why SVG, and what that costs ────────────────────────────────────────────
 * Browsers render SVG images natively, so this works wherever it appears in a
 * normal page — which is what the embed badge snippet needs.
 *
 * It is NOT enough for `og:image`. Facebook, X, LinkedIn and Slack whitelist
 * raster formats and ignore SVG, so a per-page card served this way would show
 * as no card at all — worse than the generic PNG. Rasterising at request time
 * was attempted and abandoned; docs/OPEN-QUESTIONS.md records what was ruled
 * out. Until that is solved, og:image stays on the static card.
 *
 * GET /api/og?symbol=AAPL · ?country=JP · ?title=…&subtitle=…&kind=…
 */
import { listing, country, countryName, quote } from "../src/lib/server/listings";

const clamp = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** XML-escape: everything below is rendered into markup. */
const esc = (s: string): string =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] as string));

interface Card {
  kicker: string; title: string; subtitle: string;
  value?: string; change?: number; asOf?: string; foot: string;
}

function svg(c: Card): string {
  const accent = c.change === undefined ? "#6B7079" : c.change >= 0 ? "#26D07C" : "#FF4D5E";
  const changeText = c.change === undefined ? "" : `${c.change >= 0 ? "+" : ""}${c.change.toFixed(2)}%`;
  const foot = c.asOf ? `${c.foot} · as at ${c.asOf}` : c.foot;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#050506"/><stop offset="100%" stop-color="#0d0f14"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="${accent}"/>
  <text x="72" y="104" fill="#6B7079" font-family="ui-monospace,Menlo,monospace" font-size="20" letter-spacing="6">${esc(c.kicker)}</text>
  <text x="72" y="252" fill="#F5F6F7" font-family="Georgia,'Times New Roman',serif" font-size="74" font-weight="700">${esc(c.title)}</text>
  <text x="72" y="312" fill="#A4A9B3" font-family="system-ui,-apple-system,sans-serif" font-size="30">${esc(c.subtitle)}</text>
  ${c.value ? `<text x="72" y="474" fill="#F5F6F7" font-family="ui-monospace,Menlo,monospace" font-size="84" font-weight="700">${esc(c.value)}</text>` : ""}
  ${changeText ? `<text x="${72 + (c.value ? c.value.length * 51 : 0)}" y="474" fill="${accent}" font-family="ui-monospace,Menlo,monospace" font-size="40" font-weight="700">${changeText}</text>` : ""}
  <text x="72" y="566" fill="#6B7079" font-family="system-ui,-apple-system,sans-serif" font-size="22">${esc(foot)}</text>
</svg>`;
}

export default async function handler(req: Request): Promise<Response> {
  const p = new URL(req.url).searchParams;
  const sym = (p.get("symbol") || "").toUpperCase().trim();
  const code = (p.get("country") || "").toUpperCase().trim();

  let card: Card;
  let ttl = 86400;

  const l = sym ? listing(sym) : undefined;
  const c = code ? country(code) : undefined;

  if (l) {
    const q = l.country === "US" ? await quote(l.ticker) : null;
    card = {
      kicker: `GFT · TERMINAL · ${l.sector.toUpperCase()}`,
      title: clamp(l.name, 34),
      subtitle: `${l.ticker} · ${countryName(l.country)}`,
      value: q ? `${l.currency}${q.price.toFixed(2)}` : undefined,
      change: q ? q.changePct : undefined,
      asOf: q ? `${new Date().toISOString().slice(11, 16)} UTC` : undefined,
      foot: q ? "Delayed quote · every figure on the page states its source"
        : "No live feed reaches this listing — the page says why, rather than showing a number",
    };
    // A card carrying a price may only be cached for as long as the price is
    // worth trusting. An identity card has nothing to go stale.
    if (q) ttl = 300;
  } else if (c) {
    card = {
      kicker: "GFT · TERMINAL · COUNTRY",
      title: clamp(`${c.name} markets`, 34),
      subtitle: `${c.marketIndex} · ${c.exchange} · ${c.currency}`,
      foot: "Live markets across 68 countries · every figure states its source",
    };
  } else {
    // Text-only fallback. No number is accepted from the caller — see above.
    card = {
      kicker: clamp((p.get("kind") || "GFT · TERMINAL").trim(), 28).toUpperCase(),
      title: clamp((p.get("title") || "Global Financial Terminal").trim(), 34),
      subtitle: clamp((p.get("subtitle") || "The world's economy, on one screen").trim(), 72),
      foot: "Live markets across 68 countries · every figure states its source",
    };
  }

  return new Response(svg(card), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`,
    },
  });
}
