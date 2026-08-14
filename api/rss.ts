/**
 * Server-side RSS proxy.
 *
 * Google News RSS serves fine over HTTP but sends no CORS headers, so the
 * browser cannot read it directly. The app previously leaned on a public
 * rss2json proxy, which is a single point of failure — and it is currently
 * returning 500 for these feeds, which is why the news panels sat empty.
 *
 * Fetching it from our own origin removes both the CORS problem and the
 * third-party dependency.
 *
 * GET /api/rss?url=<encoded feed url>
 */

export const config = { runtime: "edge" };

/** Only proxy feeds we actually publish — an open proxy is an abuse vector. */
const ALLOWED_HOSTS = new Set([
  "news.google.com",
  "feeds.reuters.com",
  "feeds.bbci.co.uk",
  "www.ft.com",
  "rss.cnn.com",
]);

interface Item {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

/** Pull the fields we need out of RSS/Atom without an XML dependency. */
function parseItems(xml: string, limit: number): Item[] {
  const out: Item[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);

  const pick = (block: string, tag: string): string => {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
    const m = re.exec(block);
    if (!m) return "";
    return m[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();
  };

  for (const block of blocks) {
    const title = pick(block, "title");
    if (!title) continue;
    out.push({
      title,
      link: pick(block, "link"),
      pubDate: pick(block, "pubDate") || pick(block, "published"),
      description: pick(block, "description"),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  const count = Math.min(40, Number(searchParams.get("count") || 20));

  if (!target) {
    return Response.json({ status: "error", message: "missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ status: "error", message: "bad url" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return Response.json({ status: "error", message: "host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GFT-Terminal/1.0)" },
      signal: AbortSignal.timeout(9000),
    });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);

    const xml = await upstream.text();
    const items = parseItems(xml, count);

    return new Response(JSON.stringify({ status: "ok", items }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Feeds update slowly; a short shared cache keeps us well inside limits.
        "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    return Response.json(
      { status: "error", message: err instanceof Error ? err.message : "fetch failed", items: [] },
      { status: 502 },
    );
  }
}
