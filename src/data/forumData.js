// ─── Forum Seed Data ───────────────────────────────────────────────────────────

export const FORUM_CATEGORIES = [
  { id: "market-analysis", label: "Market Analysis", icon: "📊", description: "Deep dives into global market trends and price action", color: "#00ff88", count: 248 },
  { id: "trade-ideas", label: "Trade Ideas", icon: "💡", description: "Share and discuss actionable trade setups", color: "#00aaff", count: 183 },
  { id: "macro-outlook", label: "Macro Outlook", icon: "🌐", description: "Central banks, geopolitics, and macro economic shifts", color: "#aa55ff", count: 156 },
  { id: "country-reports", label: "Country Reports", icon: "🗺️", description: "Emerging and developed market country deep-dives", color: "#ffaa00", count: 94 },
  { id: "crypto-commodities", label: "Crypto & Commodities", icon: "₿", description: "Bitcoin, gold, oil, and alternative assets", color: "#ff6b35", count: 317 },
];

export const FORUM_USERS = [
  { id: "u1", name: "AlexTrade", avatar: "AT", badge: "Analyst", role: "Senior Analyst", posts: 847, joined: "2024-01" },
  { id: "u2", name: "MarketWatcher", avatar: "MW", badge: "Bull", role: "Quant Researcher", posts: 412, joined: "2024-03" },
  { id: "u3", name: "GlobeMacro", avatar: "GM", badge: "Bear", role: "Macro Strategist", posts: 1203, joined: "2023-11" },
  { id: "u4", name: "CryptoFlow", avatar: "CF", badge: "Analyst", role: "DeFi Analyst", posts: 229, joined: "2024-06" },
  { id: "u5", name: "SilkRoadFX", avatar: "SR", badge: "Bull", role: "FX Trader", posts: 567, joined: "2024-02" },
  { id: "u6", name: "PacificRim_K", avatar: "PK", badge: "Analyst", role: "Asia Pacific EM Specialist", posts: 334, joined: "2024-04" },
  { id: "u7", name: "YieldCurve99", avatar: "YC", badge: "Bear", role: "Fixed Income", posts: 891, joined: "2023-12" },
  { id: "u8", name: "NordikCapital", avatar: "NC", badge: "Bull", role: "Nordic Markets", posts: 145, joined: "2024-07" },
];

export const FORUM_THREADS = [
  {
    id: "t1",
    categoryId: "market-analysis",
    title: "Fed dot plot divergence — rate cuts are being priced in too aggressively",
    body: `The market is pricing in 3 rate cuts for H2 2026, but the actual dot plot median only supports 1.5 cuts. This gap is creating a dangerous asymmetry.

Here's the breakdown:
- **PCE inflation**: Still running at 2.8% core — well above the 2% target
- **Labor market**: NFP prints averaging 180k/month, not showing the cooling the Fed needs
- **Terminal rate expectations**: Futures pricing ~4.25% by year-end vs Fed's own 4.75% guidance

What this means for $SPX: We're likely to see a repricing event in Q3 when the Fed pushes back. Watch the July FOMC meeting as the key catalyst.

The options market is suspiciously calm — IV is suppressed, which tells me smart money is quietly loading puts. Historical precedent: every time the market diverged from the dot plot by >75bps, we saw a 5-8% correction within 60 days.

Position: Long $VIX calls, short $IEF (20yr treasuries), selective long $UUP.`,
    author: "u7",
    upvotes: 187,
    downvotes: 12,
    replyCount: 34,
    views: 2847,
    createdAt: "2026-06-22T06:00:00Z",
    tags: ["$SPX", "$VIX", "$IEF", "FED", "RATES"],
    pinned: true,
    hot: true,
    replies: [
      {
        id: "r1",
        threadId: "t1",
        author: "u2",
        body: "Strong analysis. The 2s10s inversion is finally starting to steepen — typically 12-18 months before recession. Your dot plot divergence thesis ties in perfectly with this. I'd add $SRVR as a short if rates stay higher — datacenter REITs are massively vulnerable.",
        upvotes: 67,
        downvotes: 3,
        createdAt: "2026-06-22T07:15:00Z",
        parentId: null,
      },
      {
        id: "r2",
        threadId: "t1",
        author: "u1",
        body: "Counterpoint: services inflation is rolling over fast. Core PCE ex-housing is already at 1.9% — the lag effect of shelter OER is keeping headline high. Powell knows this. I think the market is actually RIGHT and the dot plot is the lagging indicator, not the market.",
        upvotes: 43,
        downvotes: 8,
        createdAt: "2026-06-22T08:30:00Z",
        parentId: null,
      },
      {
        id: "r3",
        threadId: "t1",
        author: "u7",
        body: "@AlexTrade Fair point on OER lag, but even stripping that out, super-core services (ex-housing, ex-energy) is still 3.4% — that's the stickiest component and it's not budging. Fed won't cut into that.",
        upvotes: 28,
        downvotes: 2,
        createdAt: "2026-06-22T09:00:00Z",
        parentId: "r2",
      },
    ],
  },
  {
    id: "t2",
    categoryId: "trade-ideas",
    title: "Long $ASML — semiconductor capital equipment supercycle has 3 years left",
    body: `ASML is the only company in the world that can manufacture EUV lithography machines. This is a moat so deep it's practically a monopoly with a 10-year backlog.

**The Setup:**
- Backlog: €40.6bn — 2.5x annual revenue
- AI semiconductor demand driving next-gen node adoption
- TSMC, Samsung, Intel all committing to 2nm/1.4nm fabs — all require ASML EUV

**Valuation:**
- Currently trading at 28x forward earnings — historically this trades 35-45x during cycle peaks
- Revenue CAGR: 25% expected through 2028
- Net margin expanding from 28% → 34% as high-margin EUV mix increases

**Risks:**
- China export controls (already priced in — ASML has guided for this)
- Geopolitical escalation (tail risk only)
- Longer-than-expected AI capex pullback

**Target**: €1,050 (12-month), €1,400 (24-month)
**Stop**: €680 (below 200-day MA)

$ASML $NVDA $TSM`,
    author: "u1",
    upvotes: 143,
    downvotes: 8,
    replyCount: 22,
    views: 1923,
    createdAt: "2026-06-21T14:00:00Z",
    tags: ["$ASML", "$NVDA", "$TSM", "SEMICONDUCTORS", "LONG"],
    pinned: false,
    hot: true,
    replies: [
      {
        id: "r4",
        threadId: "t2",
        author: "u5",
        body: "Solid thesis. One thing I'd add: the FX tailwind is real. ASML reports in EUR but earns heavily in USD/TWD. EUR weakness would be additional alpha. Currently EUR/USD at 1.07 — any further dollar strength is free money.",
        upvotes: 38,
        downvotes: 1,
        createdAt: "2026-06-21T15:30:00Z",
        parentId: null,
      },
      {
        id: "r5",
        threadId: "t2",
        author: "u3",
        body: "I'm bearish on the timeline. Macro headwinds in Europe + China sanctions uncertainty = multiple compression risk. The backlog is real, but execution risk on 2nm ramp is being underestimated. EUV yield rates at cutting edge nodes are historically poor for first 18 months.",
        upvotes: 21,
        downvotes: 4,
        createdAt: "2026-06-21T16:45:00Z",
        parentId: null,
      },
    ],
  },
  {
    id: "t3",
    categoryId: "macro-outlook",
    title: "China's property sector endgame — why Evergrande was just the beginning",
    body: `Three years after Evergrande's collapse, China's property sector is still unwinding and most Western investors are dangerously underestimating the systemic risk.

**The Numbers:**
- Real estate = 25-30% of Chinese GDP (direct + indirect)
- Outstanding developer debt: ¥12 trillion
- Pre-sold but undelivered homes: 3.2 million units (est.)
- Local government financing vehicles (LGFVs): ¥60 trillion in total debt, mostly collateralized with land

**Why this matters for global markets:**
1. **Commodity demand destruction**: China consumes 55% of global iron ore, 50% of copper. A prolonged property downturn means structurally lower commodity prices
2. **CNY pressure**: Capital outflows accelerating, PBOC defending 7.30 — if this breaks, EM contagion follows
3. **Deflationary export**: China is exporting deflation through cheap manufactured goods — this is suppressing inflation globally but creating overcapacity crises in Europe

**My view**: The government will not do a "big bang" stimulus — they've learned from Japan's mistake. Instead, expect slow, grinding deleveraging over 5-10 years. Equities will chop sideways.

Short: $FXI, Long: $GLD, $DBA (agriculture ETF)`,
    author: "u3",
    upvotes: 234,
    downvotes: 31,
    replyCount: 58,
    views: 4102,
    createdAt: "2026-06-20T10:00:00Z",
    tags: ["$FXI", "$GLD", "CHINA", "MACRO", "PROPERTY"],
    pinned: false,
    hot: true,
    replies: [
      {
        id: "r6",
        threadId: "t3",
        author: "u6",
        body: "As someone who covers EM Asia daily — this is the most accurate public take I've seen. I'd add that the LGFV problem is the real hidden bomb. Local governments are essentially insolvent but the central government is pretending it doesn't exist. When that unwinds, the contagion hits $EWY (Korea) and $EWT (Taiwan) hard via supply chain exposure.",
        upvotes: 89,
        downvotes: 4,
        createdAt: "2026-06-20T11:30:00Z",
        parentId: null,
      },
    ],
  },
  {
    id: "t4",
    categoryId: "crypto-commodities",
    title: "Bitcoin ETF flows analysis — institutional accumulation at these levels is unprecedented",
    body: `Since the Bitcoin spot ETF approval, institutional flow data tells a completely different story than retail sentiment.

**ETF Flow Data (past 30 days):**
- BlackRock IBIT: +$2.8bn net inflow
- Fidelity FBTC: +$1.2bn net inflow
- Total spot BTC ETF AUM: $87bn (surpassed gold ETFs in year 1)

**On-chain signals:**
- Exchange reserves at 5-year low (BTC leaving exchanges = accumulation)
- Whale wallets (1000+ BTC) increasing for 8 consecutive weeks
- Long-term holder supply: 78% of all BTC hasn't moved in 1+ year

**Macro context:**
- Post-halving supply shock: only 450 BTC/day new issuance
- Central bank rate cuts = favorable for hard assets
- Potential US Strategic Bitcoin Reserve (executive order in draft)

**Price target**: $95k-$120k cycle top (12-18 months)
**Key risk**: Regulatory action, exchange hack, macro risk-off event

$BTC $ETH $MSTR`,
    author: "u4",
    upvotes: 312,
    downvotes: 67,
    replyCount: 89,
    views: 7234,
    createdAt: "2026-06-19T08:00:00Z",
    tags: ["$BTC", "$ETH", "$MSTR", "BITCOIN", "CRYPTO", "ETF"],
    pinned: false,
    hot: true,
    replies: [
      {
        id: "r7",
        threadId: "t4",
        author: "u2",
        body: "The ETF flow data is compelling. What concerns me is the derivatives market — open interest is at cycle highs which historically precedes volatility. The spot ETF buyers are real, but leveraged longs are building too. Could be a violent shakeout before the real move.",
        upvotes: 78,
        downvotes: 6,
        createdAt: "2026-06-19T09:15:00Z",
        parentId: null,
      },
      {
        id: "r8",
        threadId: "t4",
        author: "u3",
        body: "I remain skeptical of Bitcoin as 'digital gold'. The correlation to risk assets in drawdowns has been ~0.7 historically. It doesn't hedge macro risk, it amplifies it. That said, if you're just trend-trading the halving cycle, the thesis is reasonable.",
        upvotes: 45,
        downvotes: 22,
        createdAt: "2026-06-19T10:00:00Z",
        parentId: null,
      },
    ],
  },
  {
    id: "t5",
    categoryId: "country-reports",
    title: "India 2026 — The decade's most compelling EM story and how to position",
    body: `India is executing a once-in-a-generation economic transformation. Here's the comprehensive positioning guide.

**Why India is different from previous EM rallies:**
- Working-age population peak: 2040 (vs China's peak: 2015)
- Digital infrastructure: UPI processes 14bn transactions/month — more than Visa + Mastercard combined
- Manufacturing FDI: $85bn in 2025, up 140% from 2022 (China+1 strategy beneficiary)
- Services exports: $340bn — IT, pharma, back-office growing 15% YoY

**Sectors with highest conviction:**
1. **Banks**: Credit penetration at 15% vs 150% in developed markets — massive runway
2. **Renewables**: 500GW target by 2030, ₹10 trillion capex
3. **Defense**: India's domestic defense program — Rs 1.5 lakh crore budget, import substitution
4. **Consumer**: 400mn middle class, aspiring to branded goods

**Key risks:**
- Monsoon dependency (15% of GDP agriculture)
- Oil import vulnerability (energy current account)
- High valuations (Nifty at 22x forward — expensive vs peers)

**ETF plays**: $INDA, $PIN, $SMIN (small cap India)
**ADR plays**: $INFY, $WIT, $HDB, $IBN

12-month target: Nifty 50 → 27,000`,
    author: "u6",
    upvotes: 178,
    downvotes: 14,
    replyCount: 31,
    views: 2876,
    createdAt: "2026-06-18T12:00:00Z",
    tags: ["$INDA", "$INFY", "INDIA", "EM", "NIFTY"],
    pinned: false,
    hot: false,
    replies: [
      {
        id: "r9",
        threadId: "t5",
        author: "u5",
        body: "Great write-up. From FX perspective, INR/USD has been remarkably stable at 83-85 range due to RBI intervention. The moment oil spikes or USD strengthens materially, the INR story gets complicated. Worth hedging FX exposure if taking large positions.",
        upvotes: 42,
        downvotes: 2,
        createdAt: "2026-06-18T13:30:00Z",
        parentId: null,
      },
    ],
  },
  {
    id: "t6",
    categoryId: "market-analysis",
    title: "Small caps ($IWM) coiling for breakout — the rotation thesis explained",
    body: `The Russell 2000 has massively underperformed the S&P 500 for 2 years. Historical mean reversion analysis suggests we're at a major inflection point.

**The valuation gap:**
- $IWM P/E: 14.2x vs $SPY P/E: 22.1x — widest gap in 25 years
- Small caps have 40% revenue exposure to domestic US economy vs 38% international for large caps
- Rate sensitivity: 70% of Russell 2000 debt is floating rate — so any Fed cut is immediate EPS boost

**Technical setup:**
- 2+ year base forming at $185-$215 range
- Accumulation patterns on weekly chart
- Relative strength vs $SPY at multi-year low (mean reversion target)

**Catalyst timeline:**
- Fed cut #1 → September 2026 → small cap re-rating begins
- Fiscal stimulus → domestic revenue companies benefit
- M&A wave → large caps hunting undervalued small cap targets

**Trade**: Long $IWM, Long $TNA (3x leveraged), Short $QQQ as hedge`,
    author: "u2",
    upvotes: 94,
    downvotes: 7,
    replyCount: 18,
    views: 1456,
    createdAt: "2026-06-17T15:00:00Z",
    tags: ["$IWM", "$TNA", "$QQQ", "SMALLCAP", "ROTATION"],
    pinned: false,
    hot: false,
    replies: [],
  },
  {
    id: "t7",
    categoryId: "macro-outlook",
    title: "The end of dollar dominance? De-dollarization update Q2 2026",
    body: `Every quarter I do a de-dollarization tracker. Here's the Q2 2026 update.

**What's actually happening (not hype):**
- Dollar share of global FX reserves: 58.4% (down from 72% in 2001 — slow but real decline)
- BRICS settlement in local currencies: 28% of BRICS trade now non-dollar
- Central bank gold buying: 1,037 tonnes in 2025 — second highest on record
- Saudi Arabia: selling 10% of oil in CNY, rest still USD

**What's NOT happening:**
- Dollar collapse (Dollar Index still at 103)
- Yuan as reserve currency (CNY = 2.4% of reserves — unchanged from 2020)
- End of dollar dominance (still 42% of SWIFT transactions)

**The real story**: Multipolar currency system emerging — not dollar collapse but dollar dilution. This is a 10-20 year process.

**Investable implications:**
- Long gold (central bank demand structural)
- Long CNH-denominated bonds (diversification demand)
- Selective long: currencies of neutral nations (CHF, SGD, AED)
- Watch: DXY technical support at 100 — break would be significant`,
    author: "u3",
    upvotes: 267,
    downvotes: 23,
    replyCount: 47,
    views: 5891,
    createdAt: "2026-06-15T09:00:00Z",
    tags: ["$DXY", "$GLD", "DEDOLLARIZATION", "MACRO", "BRICS"],
    pinned: false,
    hot: false,
    replies: [
      {
        id: "r10",
        threadId: "t7",
        author: "u5",
        body: "The DXY at 100 support level is the chart everyone should have on their screen right now. Last time it broke that level (March 2022), it was a false break but triggered massive volatility. A clean close below 99.50 would be a paradigm shift for global FX.",
        upvotes: 56,
        downvotes: 3,
        createdAt: "2026-06-15T10:30:00Z",
        parentId: null,
      },
    ],
  },
  {
    id: "t8",
    categoryId: "crypto-commodities",
    title: "Gold breakout thesis — why $3,500 is the next target",
    body: `Gold just broke out of a 4-year consolidation range on enormous volume. This is not a head-fake.

**Why this breakout is different:**
1. Central bank buying at record levels (not retail FOMO)
2. Real yields starting to fall (gold loves negative real rates)
3. Geopolitical risk premium being re-rated permanently
4. De-dollarization creating alternative reserve demand
5. Supply: gold mine production has been flat for 8 years

**Technical analysis:**
- Breakout above $2,400 resistance (now support)
- Cup & handle pattern (12 months) with measured move to $3,200-$3,500
- Weekly RSI: 68 (room to run — not overbought yet)
- Volume: 40% above 200-day average on breakout candle

**Positioning:**
- Physical: Allocated via $GLD or $IAU
- Miners: $GDX (ETF), $NEM, $AEM (leverage to gold price)
- Royalty: $RGLD, $WPM (best risk-adjusted exposure)

Gold miners at 0.4x book value historically = screaming buy.`,
    author: "u8",
    upvotes: 198,
    downvotes: 19,
    replyCount: 43,
    views: 3421,
    createdAt: "2026-06-14T11:00:00Z",
    tags: ["$GLD", "$GDX", "$NEM", "GOLD", "COMMODITIES"],
    pinned: false,
    hot: false,
    replies: [],
  },
];

export function getThreadsByCategory(categoryId) {
  return FORUM_THREADS.filter((t) => t.categoryId === categoryId);
}

export function getThreadById(id) {
  return FORUM_THREADS.find((t) => t.id === id);
}

export function getUserById(id) {
  return FORUM_USERS.find((u) => u.id === id);
}

export function getTrendingThreads(limit = 5) {
  return [...FORUM_THREADS]
    .sort((a, b) => b.upvotes + b.replyCount * 3 - (a.upvotes + a.replyCount * 3))
    .slice(0, limit);
}
