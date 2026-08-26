/**
 * The Node runtime, not edge — deliberately.
 *
 * @vercel/og rasterises through resvg and yoga compiled to WebAssembly. Under
 * the edge runtime that pushed the function past its bundle budget and the
 * deployment failed outright; the Node runtime carries the wasm comfortably.
 * The trade is a slower cold start, which costs nothing here: this endpoint is
 * hit by card scrapers, not by the app, and every response is cached.
 */
export const config = { runtime: "nodejs" };

/**
 * Share card for any page — growth-plan items 96 and 109.
 *
 * Two faults are fixed here, both found by looking at what a scraper actually
 * receives rather than at what the code intended.
 *
 * 1. FORMAT. The card was an SVG. Facebook, X, LinkedIn and Slack all whitelist
 *    raster formats for og:image and ignore SVG, so on the platforms this
 *    exists for, the card rendered as nothing. It is a PNG now.
 *
 * 2. THE NUMBERS CAME FROM THE QUERY STRING. `?value=$0.01&change=-99` rendered
 *    exactly that, on our own domain, over our own branding. Anyone could mint a
 *    convincing screenshot of a false price attributed to us. The card now
 *    resolves the company from our own registry and fetches the quote itself;
 *    no figure in the output comes from the caller.
 *
 * Because it runs per request, the price is live at the moment the card is
 * scraped rather than baked in at build time — the one place a live number is
 * safe, and the reason the prerenderer can point at it without breaking its own
 * no-prices rule. The card stamps the minute it was generated so a stale
 * re-share is legible as one.
 *
 * GET /api/og?symbol=AAPL
 * GET /api/og?title=...&subtitle=...&kind=...
 */

const INK = "#F5F6F7";
const MUTED = "#A4A9B3";
const FAINT = "#6B7079";
const UP = "#26D07C";
const DOWN = "#FF4D5E";

const clamp = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ── layout, as plain element objects (satori reads type/props directly) ──── */

type El = { type: string; props: Record<string, unknown> };
const div = (style: Record<string, unknown>, children: unknown): El =>
  ({ type: "div", props: { style: { display: "flex", ...style }, children } });

function card(opts: {
  kicker: string; title: string; subtitle: string;
  value?: string; change?: number; asOf?: string; foot: string;
}): El {
  const accent = opts.change === undefined ? FAINT : opts.change >= 0 ? UP : DOWN;
  const changeText = opts.change === undefined ? ""
    : `${opts.change >= 0 ? "+" : ""}${opts.change.toFixed(2)}%`;

  return div(
    {
      flexDirection: "column", width: "1200px", height: "630px",
      backgroundColor: "#08090B", color: INK, padding: "68px 72px",
      justifyContent: "space-between", borderTop: `4px solid ${accent}`,
    },
    [
      div({ flexDirection: "column" }, [
        div({ fontSize: 20, color: FAINT, letterSpacing: "6px" }, opts.kicker),
        div({ fontSize: 72, marginTop: "26px", lineHeight: 1.1 }, opts.title),
        div({ fontSize: 30, color: MUTED, marginTop: "16px" }, opts.subtitle),
      ]),
      div({ flexDirection: "column" }, [
        opts.value
          ? div({ alignItems: "flex-end" }, [
              div({ fontSize: 84 }, opts.value),
              changeText ? div({ fontSize: 40, color: accent, marginLeft: "22px", paddingBottom: "12px" }, changeText) : "",
            ])
          : "",
        div({ fontSize: 21, color: FAINT, marginTop: "22px" },
          opts.asOf ? `${opts.foot} · as at ${opts.asOf}` : opts.foot),
      ]),
    ],
  );
}

/** Everything that can fail is loaded inside the handler — see the note in the
 *  catch block at the bottom. */
export default async function handler(req: Request): Promise<Response> {
  try {
    return await render(req);
  } catch (err) {
    // Diagnostics for a failure that only reproduces on the deployed runtime.
    // A card scraper ignores the body; ?debug=1 makes it readable to us.
    if (new URL(req.url).searchParams.get("debug") === "1") {
      return new Response(`og render failed: ${err instanceof Error ? `${err.message}\n${err.stack}` : String(err)}`,
        { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    // Never 500. Every page's og:image points here, and a broken image means no
    // card at all — worse than the generic one this falls back to.
    return Response.redirect(new URL("/og.png", req.url).toString(), 302);
  }
}

async function render(req: Request): Promise<Response> {
  const { listing, country, countryName, quote } = await import("../src/lib/server/listings");
  const p = new URL(req.url).searchParams;
  const sym = (p.get("symbol") || "").toUpperCase().trim();
  const code = (p.get("country") || "").toUpperCase().trim();

  let opts: Parameters<typeof card>[0];
  let ttl = 86400;

  const l = sym ? listing(sym) : undefined;
  const c = code ? country(code) : undefined;

  if (l) {
    const q = l.country === "US" ? await quote(l.ticker) : null;
    opts = {
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
    opts = {
      kicker: "GFT · TERMINAL · COUNTRY",
      title: clamp(`${c.name} markets`, 34),
      subtitle: `${c.marketIndex} · ${c.exchange} · ${c.currency}`,
      foot: "Live markets across 68 countries · every figure states its source",
    };
  } else {
    // Text-only fallback. No number is accepted from the caller — see the note
    // at the top of this file.
    opts = {
      kicker: clamp((p.get("kind") || "GFT · TERMINAL").trim(), 28).toUpperCase(),
      title: clamp((p.get("title") || "Global Financial Terminal").trim(), 34),
      subtitle: clamp((p.get("subtitle") || "The world's economy, on one screen").trim(), 72),
      foot: "Live markets across 68 countries · every figure states its source",
    };
  }

  const { ImageResponse } = await import("@vercel/og");
  return new ImageResponse(card(opts) as unknown as React.ReactElement, {
    width: 1200, height: 630,
    headers: {
      "cache-control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`,
    },
  });
}
