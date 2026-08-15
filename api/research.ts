export const config = { runtime: "edge" };

/**
 * Research data proxy — the retrieval half of the AI research copilot.
 *
 * One endpoint fronting the Finnhub datasets the copilot reasons over, so the
 * key stays server-side and every dataset gets a cache TTL matched to how fast
 * it actually changes. That TTL table is the whole reason this is one endpoint
 * and not six: the research panel can fire five datasets for one question, and
 * at Finnhub's 60/min free cap an uncached panel would rate-limit the live
 * price feed the rest of the terminal depends on.
 *
 * Datasets deliberately absent because the free tier returns 403 for them:
 * price targets, earnings-call transcripts, revenue estimates and EPS
 * estimates. They are not stubbed or faked — the copilot states outright that
 * it cannot see them, which is the difference between a research tool and a
 * confident liar.
 */

const KEY = process.env.FINNHUB_API_KEY || "";
const BASE = "https://finnhub.io/api/v1";

/** How long the edge may serve each dataset. Slow-moving data, long cache. */
const DATASETS: Record<string, { path: (s: string) => string; ttl: number }> = {
  // A company's name and industry do not change; a day is conservative.
  profile: { path: (s) => `/stock/profile2?symbol=${s}`, ttl: 86400 },
  // 133 fundamentals, restated quarterly at most.
  metrics: { path: (s) => `/stock/metric?symbol=${s}&metric=all`, ttl: 3600 },
  // Analyst recommendation counts, revised monthly.
  recommendations: { path: (s) => `/stock/recommendation?symbol=${s}`, ttl: 3600 },
  // Actual-vs-estimate for the last four quarters.
  earnings: { path: (s) => `/stock/earnings?symbol=${s}`, ttl: 3600 },
  // The one genuinely fast-moving dataset here.
  news: { path: (s) => `/company-news?symbol=${s}&from=${daysAgo(14)}&to=${today()}`, ttl: 900 },
  filings: { path: (s) => `/stock/filings?symbol=${s}`, ttl: 3600 },
  peers: { path: (s) => `/stock/peers?symbol=${s}`, ttl: 86400 },
  insider: { path: (s) => `/stock/insider-transactions?symbol=${s}`, ttl: 3600 },
};

function today(): string { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const dataset = (url.searchParams.get("dataset") || "").trim();
  const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();

  const spec = DATASETS[dataset];
  if (!spec) {
    return json({ error: "unknown dataset" }, 400);
  }
  // Finnhub tickers are alphanumerics plus dot/dash. Anything else is someone
  // probing, and interpolating it into an upstream URL would be the bug.
  if (!symbol || !/^[A-Z0-9.\-]{1,12}$/.test(symbol)) {
    return json({ error: "bad symbol" }, 400);
  }
  if (!KEY) {
    return json({ error: "not configured" }, 501);
  }

  try {
    const r = await fetch(`${BASE}${spec.path(symbol)}&token=${KEY}`, {
      headers: { accept: "application/json" },
    });

    // Pass the rate limit through honestly rather than dressing it as empty
    // data — the client backs off, and the copilot says it could not retrieve.
    if (r.status === 429) {
      return json({ error: "rate limited" }, 429, "public, s-maxage=20");
    }
    // 403 means the dataset is a paid feature. Say so precisely: the copilot
    // turns this into a visible caveat rather than a silent gap.
    if (r.status === 403) {
      return json({ error: "premium dataset", dataset }, 403, "public, s-maxage=86400");
    }
    if (!r.ok) {
      return json({ error: `upstream ${r.status}` }, 502);
    }

    const data = await r.json();
    return json(
      { dataset, symbol, data, fetchedAt: Date.now() },
      200,
      `public, s-maxage=${spec.ttl}, stale-while-revalidate=${spec.ttl * 2}`,
    );
  } catch {
    return json({ error: "fetch failed" }, 502);
  }
}

function json(body: unknown, status: number, cache?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...(cache ? { "cache-control": cache } : { "cache-control": "no-store" }),
    },
  });
}
