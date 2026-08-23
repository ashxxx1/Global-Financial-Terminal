import type { Anomaly } from "../types/anomaly";
import { clampScore } from "../lib/anomalies/engine";

/**
 * Catalogued investigations covering all six detector categories.
 * Scores are pre-computed from the same z / multiple / divergence maps the
 * engine exposes, then clamped so the UI always receives 0–100 integers.
 */
export const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: "anom-nvda-price",
    tickerOrSector: "NVDA",
    title: "4.7σ session extension versus 60-day realized vol",
    category: "PRICE",
    anomalyScore: clampScore(94),
    timestamp: "2026-08-21T19:42:00.000Z",
    summary: "NVDA printed a −6.8% session against a 1.45% typical Technology 1σ day — a 4.7σ tail move.",
    interpretation:
      "GFT flagged the close because the standardized return sits well outside the name's own 60-day realized-vol envelope, not because the direction is 'wrong'. The tape is extreme relative to the baseline; the job is to find what the baseline missed.",
    factors: [
      { factor: "Session return", normalBaseline: "±1.5% (1σ Technology)", currentObserved: "−6.81%", status: "elevated" },
      { factor: "60-day realized vol (1d)", normalBaseline: "1.42%", currentObserved: "1.45% baseline; move = 4.7σ", status: "broken" },
      { factor: "Intraday range / ATR(14)", normalBaseline: "0.9–1.2× ATR", currentObserved: "2.4× ATR", status: "elevated" },
      { factor: "Close vs VWAP", normalBaseline: "within 0.4%", currentObserved: "−1.9% vs VWAP", status: "divergent" },
    ],
    possibleExplanations: [
      "Block selling or a large options-related hedge into the close",
      "News lag — a filing or supply-chain note not yet in the headline feed",
      "Technical breakdown through a well-watched level triggering systematic flow",
      "Peer or index rebalance that hit the name harder than the sector ETF",
    ],
    primarySymbol: "NVDA",
  },
  {
    id: "anom-xom-rya-corr",
    tickerOrSector: "XOM · RYA",
    title: "Oil up, airlines up — 180-day inverse correlation flipped",
    category: "CORRELATION",
    anomalyScore: clampScore(91),
    timestamp: "2026-08-21T18:10:00.000Z",
    summary: "Exxon +3.4% while Ryanair +2.9% on a day when the 180-day rolling correlation is −0.62.",
    interpretation:
      "Fuel is a primary airline cost. Historically the pair is inverse: crude spikes compress airline margins and the stocks diverge. Both legs printing green on the same session is a correlation breakdown, not a confirmation that the old relationship still holds.",
    factors: [
      { factor: "180d rolling correlation (XOM, RYA)", normalBaseline: "−0.55 to −0.70", currentObserved: "+0.18 (session co-move)", status: "broken" },
      { factor: "XOM session", normalBaseline: "±1.6%", currentObserved: "+3.41%", status: "elevated" },
      { factor: "RYA session", normalBaseline: "typically − when crude +2%+", currentObserved: "+2.88%", status: "divergent" },
      { factor: "Airline vs energy same-day beta", normalBaseline: "negative beta ~−0.4", currentObserved: "same-day beta +0.7", status: "broken" },
    ],
    possibleExplanations: [
      "Demand-shock narrative (traffic / pricing power) overwhelming the fuel-cost channel",
      "Hedge-fund covering a short-airline / long-oil pair",
      "Crude move driven by a dollar or inventory print airlines are ignoring",
      "Index or ETF flow lifting transportation as a factor, independent of oil",
    ],
    primarySymbol: "XOM",
    compareSymbol: "RYA",
  },
  {
    id: "anom-9988-news-price",
    tickerOrSector: "9988",
    title: "Analyst upgrades cluster while Alibaba gaps −4.2%",
    category: "NEWS_PRICE",
    anomalyScore: clampScore(88),
    timestamp: "2026-08-21T13:05:00.000Z",
    summary: "Three net-positive rating changes in 24h against a −4.2% Hong Kong session — news and price are on opposite sides.",
    interpretation:
      "GFT does not treat upgrades as a reason to buy. It treats a dense positive-sentiment cluster coinciding with a large down-print as a divergence: either the tape knows something the notes do not, or the notes have not hit the order book yet. Both are worth checking; neither is a recommendation.",
    factors: [
      { factor: "24h analyst / sentiment score", normalBaseline: "near 0 (mixed)", currentObserved: "+0.71 (bullish cluster)", status: "elevated" },
      { factor: "Session return", normalBaseline: "±1.7% (1σ)", currentObserved: "−4.22%", status: "divergent" },
      { factor: "News-price alignment", normalBaseline: "same sign as 20d median", currentObserved: "opposite sign", status: "broken" },
      { factor: "Headline count (24h)", normalBaseline: "4–8 items", currentObserved: "19 items, 14 tagged positive", status: "elevated" },
    ],
    possibleExplanations: [
      "Undetected local-language news, regulatory note, or ADR/premium dislocation",
      "Position unwinding that ignores the research notes",
      "Upgrades lagging a move that already happened overnight in Hong Kong",
      "Liquidity hole around the US open exaggerating an otherwise ordinary gap",
    ],
    primarySymbol: "9988",
  },
  {
    id: "anom-dxy-eem-macro",
    tickerOrSector: "DXY · EM",
    title: "Dollar and yields up while emerging-market equities rally",
    category: "MACRO",
    anomalyScore: clampScore(86),
    timestamp: "2026-08-21T16:40:00.000Z",
    summary: "DXY +0.62% and US 10Y +8bp with emerging-market equities +1.4% — the usual tightening channel is not showing up in EM beta.",
    interpretation:
      "A firmer dollar plus higher U.S. yields has historically drained EM risk (tighter financial conditions, local-currency debt stress). EM advancing on that mix is a cross-asset pattern break. The flag is that the textbook transmission is not in the tape today.",
    factors: [
      { factor: "DXY session", normalBaseline: "±0.25%", currentObserved: "+0.62%", status: "elevated" },
      { factor: "US 10Y yield", normalBaseline: "unchanged to −2bp on risk-on days", currentObserved: "+8bp", status: "divergent" },
      { factor: "EM equities session", normalBaseline: "typically − when DXY + and yields +", currentObserved: "+1.41%", status: "broken" },
      { factor: "60d DXY–EM correlation", normalBaseline: "−0.45 to −0.65", currentObserved: "session implied +0.22", status: "broken" },
    ],
    possibleExplanations: [
      "Local EM news (China stimulus, commodity windfall) dominating the dollar channel",
      "Positioning squeeze in under-owned EM after a long underweight",
      "Yields rising on growth, not tightening — a different macro regime than the 60-day sample",
      "ETF rebalance or month-end allocation into EM independent of DXY",
    ],
  },
  {
    id: "anom-tsla-volume",
    tickerOrSector: "TSLA",
    title: "Accumulation print at 4.6× 20-day volume with a quiet tape",
    category: "VOLUME",
    anomalyScore: clampScore(82),
    timestamp: "2026-08-21T20:01:00.000Z",
    summary: "TSLA traded 4.6× its 20-day average volume on a −0.4% session — size without a matching price impulse.",
    interpretation:
      "A volume spike that does not move price is a different event from a volume spike that does. GFT flags the former because it often precedes a later move (inventory changing hands) or marks a distribution/accumulation that the close conceals. The close is ordinary; the share count is not.",
    factors: [
      { factor: "Volume vs 20-day average", normalBaseline: "0.8–1.2×", currentObserved: "4.62×", status: "elevated" },
      { factor: "Session return", normalBaseline: "large volume usually ±2%+", currentObserved: "−0.41%", status: "divergent" },
      { factor: "Close location in range", normalBaseline: "upper/lower third on trend days", currentObserved: "mid-range", status: "aligned" },
      { factor: "Block prints vs 20d", normalBaseline: "~12% of volume", currentObserved: "31% of volume", status: "elevated" },
    ],
    possibleExplanations: [
      "Quiet accumulation or distribution through dark pools and blocks",
      "Options expiration / delta-hedge traffic that nets out in the cash close",
      "Index reconstitution or a pair-trade against another auto name",
      "A cancelled or rumoured deal that hit volume but not the last print",
    ],
    primarySymbol: "TSLA",
  },
  {
    id: "anom-xom-energy-sector",
    tickerOrSector: "XOM · Energy",
    title: "XOM −2.9% with XLE +0.8% — name vs sector gap at 3.7pp",
    category: "SECTOR",
    anomalyScore: clampScore(79),
    timestamp: "2026-08-21T17:22:00.000Z",
    summary: "Exxon underperformed the Energy benchmark by 3.7 percentage points, a 3.1σ residual versus its 90-day sector beta.",
    interpretation:
      "Sector divergence is residual risk: after stripping out the Energy factor, XOM's leftover is large. Either the company has an idiosyncratic driver (capex, guidance, legal) or the ETF is being held up by peers. The evidence is the residual, not a view on oil.",
    factors: [
      { factor: "XOM session", normalBaseline: "tracks XLE ±0.6pp", currentObserved: "−2.94%", status: "depressed" },
      { factor: "XLE session", normalBaseline: "n/a", currentObserved: "+0.81%", status: "elevated" },
      { factor: "Name − sector residual", normalBaseline: "±1.2pp (1σ)", currentObserved: "−3.75pp", status: "divergent" },
      { factor: "90d beta to XLE", normalBaseline: "0.92–1.05", currentObserved: "session beta −0.4", status: "broken" },
    ],
    possibleExplanations: [
      "Company-specific legal, tax, or project news not in the sector tape",
      "Rotation from super-majors into E&Ps or refiners inside the same ETF",
      "A large holder reducing a single-name overweight",
      "Earnings-revision cluster hitting XOM while peers catch a bid",
    ],
    primarySymbol: "XOM",
    sectorSlug: "energy",
  },
  {
    id: "anom-jpm-price-watch",
    tickerOrSector: "JPM",
    title: "+2.6% bank print versus 0.9% 1σ — elevated, not extreme",
    category: "PRICE",
    anomalyScore: clampScore(61),
    timestamp: "2026-08-21T15:18:00.000Z",
    summary: "JPM is +2.61% against a 0.9% typical Banking 1σ day (~2.9σ). Flagged as notable, below the severe band.",
    interpretation:
      "The move is large for a money-center bank but sits in a zone where curve, trading-revenue, or a single data print often explains it. GFT keeps it on the tape as a watch item so it can be compared with the rest of the book, not as a tail event.",
    factors: [
      { factor: "Session return", normalBaseline: "±0.9% (1σ Banking)", currentObserved: "+2.61%", status: "elevated" },
      { factor: "Z-score vs sector vol", normalBaseline: "|z| < 2.0", currentObserved: "+2.90σ", status: "elevated" },
      { factor: "XLF session", normalBaseline: "similar sign and scale", currentObserved: "+0.7%", status: "divergent" },
    ],
    possibleExplanations: [
      "Rates or NFP-style data lifting net-interest-margin names",
      "Trading-desk rumor into a known event window",
      "Peer-relative catch-up after a quiet week",
    ],
    primarySymbol: "JPM",
  },
  {
    id: "anom-amd-volume-watch",
    tickerOrSector: "AMD",
    title: "2.3× volume with a +1.1% drift — accumulation watch",
    category: "VOLUME",
    anomalyScore: clampScore(54),
    timestamp: "2026-08-21T19:05:00.000Z",
    summary: "AMD volume is 2.3× the 20-day average on a modest +1.1% close — above average, not a spike.",
    interpretation:
      "This is the lower bound of the volume detector: enough to log, not enough to crowd the top of the board. Useful as a control against the TSLA 4.6× print in the same session.",
    factors: [
      { factor: "Volume vs 20-day average", normalBaseline: "0.8–1.2×", currentObserved: "2.31×", status: "elevated" },
      { factor: "Session return", normalBaseline: "±1.5%", currentObserved: "+1.12%", status: "aligned" },
    ],
    possibleExplanations: [
      "Rebalance or options-related share count without a thesis change",
      "Quiet institutional add that has not yet shown in price",
    ],
    primarySymbol: "AMD",
  },
];
