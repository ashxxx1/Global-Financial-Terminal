/**
 * Historical precedents for known shock types.
 *
 * Dates and qualitative market reactions are documented public history.
 * Measured returns are attempted from /api/candles and omitted when the
 * source is unavailable — never filled with simulated bars.
 */
import type { ExtractedEvent, Precedent } from "./types";

interface Seed {
  date: string;
  event: string;
  tags: string[];
  kinds: ExtractedEvent["kind"][];
  similarity: string;
  marketReaction: string;
  relevant: string;
  probe: { symbol: string; from: string; to: string }[];
}

const SEEDS: Seed[] = [
  {
    date: "2022-03",
    event: "Brent crude spiked above $120 after Russia’s invasion of Ukraine",
    tags: ["oil", "commodity-shock", "geopolitics"],
    kinds: ["oil-shock", "geopolitics"],
    similarity: "A sudden energy-price shock with a geopolitical trigger.",
    marketReaction: "Energy majors outperformed the broad market in 1Q22; airlines and other fuel-intensive transport lagged as jet-fuel costs jumped.",
    relevant: "Energy vs transportation split is the same mechanism used in the current oil scenario.",
    probe: [
      { symbol: "XOM", from: "2022-02-01", to: "2022-04-15" },
      { symbol: "CVX", from: "2022-02-01", to: "2022-04-15" },
    ],
  },
  {
    date: "2018-H2",
    event: "US–China tariff escalation (Section 301 / retaliatory tariffs)",
    tags: ["tariff", "trade"],
    kinds: ["tariff", "trade-tensions"],
    similarity: "Import tariffs used as industrial policy, with retaliation risk.",
    marketReaction: "Export-oriented manufacturers and globally integrated tech saw higher volatility; some domestic substitutes were discussed as relative beneficiaries. Realised stock paths were mixed because demand and FX moved at the same time.",
    relevant: "Shows why tariff analyses must stay two-sided and why confidence should not be high from the event name alone.",
    probe: [{ symbol: "CAT", from: "2018-06-01", to: "2018-12-31" }],
  },
  {
    date: "2020-03",
    event: "Federal Reserve emergency rate cuts to 0–0.25% during COVID shock",
    tags: ["rates", "monetary-policy"],
    kinds: ["rate-cut"],
    similarity: "A large, front-loaded policy-rate cut — though the 2020 episode was bundled with a demand collapse, so it is not a clean analog.",
    marketReaction: "After the initial risk-off, long-duration growth and housing-linked assets led the recovery. Bank NIMs compressed later in the zero-rate period.",
    relevant: "Directionally useful for ‘who tends to re-rate when the discount rate falls’; not useful as a return forecast.",
    probe: [
      { symbol: "MSFT", from: "2020-03-15", to: "2020-08-31" },
      { symbol: "JPM", from: "2020-03-15", to: "2020-08-31" },
    ],
  },
  {
    date: "2022–2023",
    event: "Federal Reserve hiking cycle / ‘higher for longer’",
    tags: ["rates", "higher-for-longer"],
    kinds: ["rate-hike", "rates-stay-high"],
    similarity: "A sustained restrictive policy-rate regime.",
    marketReaction: "Rate-sensitive growth de-rated in 2022; deposit-funded banks saw NII expand until the 2023 regional-bank stress reminded markets that credit and duration are two-way risks.",
    relevant: "Supports a mixed banks-vs-growth map, and the caveat that NII is not free of credit risk.",
    probe: [
      { symbol: "JPM", from: "2022-01-03", to: "2022-12-30" },
      { symbol: "NVDA", from: "2022-01-03", to: "2022-12-30" },
    ],
  },
  {
    date: "2013 / 2018",
    event: "INR depreciation episodes (taper tantrum; 2018 EM FX pressure)",
    tags: ["fx"],
    kinds: ["fx-move"],
    similarity: "A weaker rupee against the dollar.",
    marketReaction: "IT services exporters typically saw a translation tailwind in INR earnings; oil-importing energy and some auto OEMs faced cost pressure. Equity returns still depended on global tech demand.",
    relevant: "The exporter-vs-importer split is the mechanism used for a rupee-down scenario.",
    probe: [{ symbol: "INFY", from: "2018-04-01", to: "2018-10-31" }],
  },
  {
    date: "2022–2024",
    event: "Generative-AI capex cycle after large-language-model demand became visible",
    tags: ["ai", "semiconductors"],
    kinds: ["ai-cycle", "product-announcement"],
    similarity: "An AI hardware/software spend impulse concentrated in GPUs, foundries and hyperscalers.",
    marketReaction: "Semiconductor designers and foundries with AI exposure dramatically outperformed broader tech; laggards without a product cycle underperformed on a relative basis.",
    relevant: "Supports concentrating ‘beneficiaries’ on the supply chain rather than every technology listing.",
    probe: [
      { symbol: "NVDA", from: "2022-10-01", to: "2024-06-28" },
      { symbol: "MSFT", from: "2022-10-01", to: "2024-06-28" },
    ],
  },
];

function parseDay(iso: string): number {
  return Math.floor(new Date(iso + "T00:00:00Z").getTime() / 1000);
}

async function windowReturn(symbol: string, from: string, to: string): Promise<{ pct: number; note: string } | null> {
  const fromS = parseDay(from);
  const toS = parseDay(to);
  try {
    const r = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${fromS}&to=${toS}`);
    if (!r.ok) return null;
    const body = await r.json() as { candles?: { t: number; c: number }[] };
    const bars = body.candles ?? [];
    if (bars.length < 4) return null;
    const first = bars[0].c;
    const last = bars[bars.length - 1].c;
    if (!(first > 0) && !(last > 0)) return null;
    const pct = ((last - first) / first) * 100;
    return { pct, note: `Live daily candles ${from} → ${to} via /api/candles.` };
  } catch {
    return null;
  }
}

export async function findPrecedents(ev: ExtractedEvent): Promise<Precedent[]> {
  const matched = SEEDS.filter((s) =>
    s.kinds.includes(ev.kind) || s.tags.some((t) => ev.tags.includes(t)),
  ).slice(0, 3);

  const out: Precedent[] = [];
  for (const s of matched) {
    const measured: Precedent["measuredReturns"] = [];
    for (const p of s.probe.slice(0, 3)) {
      const got = await windowReturn(p.symbol, p.from, p.to);
      measured.push({
        symbol: p.symbol,
        window: `${p.from} → ${p.to}`,
        pct: got?.pct ?? null,
        note: got?.note ?? "Candle source unavailable or empty for this listing/window — qualitative precedent only.",
      });
    }
    out.push({
      date: s.date,
      event: s.event,
      similarity: s.similarity,
      marketReaction: s.marketReaction,
      relevant: s.relevant,
      measuredReturns: measured,
      dataAvailable: measured.some((m) => m.pct != null),
    });
  }
  return out;
}
