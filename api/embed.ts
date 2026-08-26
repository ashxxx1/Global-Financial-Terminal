export const config = { runtime: "edge" };

/**
 * Embeddable widget — growth-plan item 111, and the B2B product behind 137–139.
 *
 * A complete, self-contained HTML document served straight from the edge rather
 * than a route in the SPA. An embed lands on somebody else's page, where our
 * bundle size becomes their page-speed problem: this is about 5 kB with no
 * framework, no fonts to fetch and no third-party requests.
 *
 * ── What an embed is and is not good for ────────────────────────────────────
 * The usual pitch is that embeds build backlinks. They do not: search engines
 * do not attribute a link inside an iframe to the page hosting the iframe, so
 * the anchor below earns brand exposure and referral clicks, not link equity.
 * The static badge snippet offered next to this one in the app is the version
 * that is a real backlink. Saying so is cheaper than having a customer discover
 * it later.
 *
 * The quote is fetched server-side at request time and the card carries the
 * minute it was generated, so an embed that has gone stale on someone's page is
 * legible as stale rather than passing for live. It refreshes itself every 60
 * seconds while the page is visible.
 *
 * GET /embed/stock/AAPL     (rewritten to /api/embed?kind=stock&id=AAPL)
 * GET /embed/country/JP
 */
import { listing, country, countryName, quote } from "../src/lib/server/listings";

const SITE = process.env.SITE_URL || "https://global-financial-terminal-eight.vercel.app";

const esc = (s: string): string =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c] as string));

const ID_RE = /^[A-Za-z0-9.\-]{1,12}$/;

interface Card {
  href: string; kicker: string; title: string; subtitle: string;
  value: string | null; change: number | null; foot: string;
}

function page(c: Card, themeParam: string): string {
  const dark = themeParam !== "light";
  const ground = dark ? "#0B0C0E" : "#FFFFFF";
  const ink = dark ? "#F2F3F5" : "#15161A";
  const muted = dark ? "#9AA0AC" : "#5C606B";
  const faint = dark ? "#6B7079" : "#868B96";
  const line = dark ? "#22262D" : "#E4E6EB";
  const up = dark ? "#3ECF8E" : "#1F7A52";
  const down = dark ? "#FF6B7A" : "#C13040";
  const accent = c.change === null ? faint : c.change >= 0 ? up : down;
  const changeText = c.change === null ? "" : `${c.change >= 0 ? "+" : ""}${c.change.toFixed(2)}%`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(c.title)} — GFT Terminal</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:${ground};color:${ink};
    font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  a.card{display:flex;flex-direction:column;gap:2px;padding:14px 16px;text-decoration:none;color:inherit;
    border:1px solid ${line};border-top:2px solid ${accent};min-height:100%}
  a.card:hover{border-color:${faint}}
  a.card:focus-visible{outline:2px solid ${accent};outline-offset:-2px}
  .kicker{font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:${faint};text-transform:uppercase}
  .title{font-size:15px;font-weight:650;margin-top:7px;letter-spacing:-.01em}
  .sub{font-size:12px;color:${muted}}
  .row{display:flex;align-items:baseline;gap:9px;margin-top:9px}
  .val{font:600 24px/1 ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums}
  .chg{font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:${accent}}
  .foot{margin-top:auto;padding-top:10px;font-size:10.5px;color:${faint};display:flex;justify-content:space-between;gap:8px}
  /* Muted, not the accent: tying the wordmark to the day's direction made the
     brand itself turn red whenever the stock was down. */
  .brand{color:${muted};white-space:nowrap;font-weight:600}
  a.card:hover .brand{color:${ink}}
</style>
</head><body>
<a class="card" href="${esc(c.href)}" target="_blank" rel="noopener">
  <span class="kicker">${esc(c.kicker)}</span>
  <span class="title">${esc(c.title)}</span>
  <span class="sub">${esc(c.subtitle)}</span>
  ${c.value ? `<span class="row"><span class="val" id="v">${esc(c.value)}</span>${changeText ? `<span class="chg" id="c">${changeText}</span>` : ""}</span>` : ""}
  <span class="foot"><span>${esc(c.foot)}</span><span class="brand">GFT Terminal ↗</span></span>
</a>
<script>
// Refresh while the host page is visible. An embed that never updates is a
// screenshot, and a screenshot of a price is the thing this product refuses.
(function(){
  var url = location.href;
  function tick(){
    if (document.hidden) return;
    fetch(url, { headers: { "accept": "application/json" } })
      .then(function(r){ return r.json(); })
      .then(function(j){
        var v = document.getElementById("v"), c = document.getElementById("c");
        if (v && j.value) v.textContent = j.value;
        if (c && typeof j.change === "number") c.textContent = (j.change >= 0 ? "+" : "") + j.change.toFixed(2) + "%";
      })
      .catch(function(){ /* a failed refresh leaves the last good figure and its timestamp */ });
  }
  setInterval(tick, 60000);
})();
</script>
</body></html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const p = url.searchParams;
  // The rewrite passes kind/id; a direct call to /api/embed may too.
  const kind = (p.get("kind") || "stock").toLowerCase();
  const id = (p.get("id") || "").toUpperCase().trim();
  const theme = (p.get("theme") || "dark").toLowerCase();

  if (!ID_RE.test(id)) {
    return new Response("Unknown instrument.", { status: 400, headers: { "content-type": "text/plain" } });
  }

  let card: Card;
  let ttl = 3600;

  if (kind === "country") {
    const c = country(id);
    if (!c) return new Response("Unknown market.", { status: 404, headers: { "content-type": "text/plain" } });
    card = {
      href: `${SITE}/country/${id}`,
      kicker: "GFT · MARKET",
      title: c.name,
      subtitle: `${c.marketIndex} · ${c.exchange} · ${c.currency}`,
      value: null, change: null,
      foot: c.tradingHours,
    };
  } else {
    const l = listing(id);
    if (!l) return new Response("Unknown symbol.", { status: 404, headers: { "content-type": "text/plain" } });
    const q = l.country === "US" ? await quote(l.ticker) : null;
    card = {
      href: `${SITE}/stock/${l.ticker}`,
      kicker: `GFT · ${l.sector.toUpperCase()}`,
      title: l.name,
      subtitle: `${l.ticker} · ${countryName(l.country)}`,
      value: q ? `${l.currency}${q.price.toFixed(2)}` : null,
      change: q ? q.changePct : null,
      foot: q ? `Delayed · ${new Date().toISOString().slice(11, 16)} UTC` : "No live feed for this listing",
    };
    if (q) ttl = 60;
  }

  // The widget's own refresh asks for JSON; browsers and crawlers get the page.
  if ((req.headers.get("accept") || "").includes("application/json")) {
    return Response.json(
      { value: card.value, change: card.change, foot: card.foot },
      { headers: { "cache-control": `public, s-maxage=${ttl}`, "access-control-allow-origin": "*" } },
    );
  }

  return new Response(page(card, theme), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 10}`,
    },
  });
}
