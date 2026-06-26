export const causalChainData = {
  1: {
    event: { name: "OPEC+ Output Reduction", impact: 94, type: "Event", details: "Unscheduled crude extraction caps triggered across major refinery nodes." },
    sectors: [
      { id: "s-energy", name: "Energy & Exploration", impact: 85, type: "Sector", delta: 12.4 },
      { id: "s-auto", name: "Automotive Manufacturing", impact: -60, type: "Sector", delta: -4.8 },
      { id: "s-aviation", name: "Aviation & Logistics", impact: -75, type: "Sector", delta: -6.2 }
    ],
    companies: [
      { id: "c-xom", name: "ExxonMobil ($XOM)", impact: 90, type: "Company", parent: "s-energy", delta: 8.5, details: "Refinery throughput remains high; margins widening on higher crude pricing." },
      { id: "c-cvx", name: "Chevron ($CVX)", impact: 82, type: "Company", parent: "s-energy", delta: 6.9, details: "Upstream assets benefit immediately from crude index elevation." },
      { id: "c-tsla", name: "Tesla ($TSLA)", impact: -45, type: "Company", parent: "s-auto", delta: -2.3, details: "Increased input costs for battery manufacturing and logistics offset by EV adoption tailwind." },
      { id: "c-dal", name: "Delta Air Lines ($DAL)", impact: -72, type: "Company", parent: "s-aviation", delta: -5.4, details: "Jet fuel spot price increases immediately squeeze operating profit margins." }
    ],
    indices: [
      { id: "i-spx", name: "S&P 500 ($SPX)", impact: -15, type: "Index", delta: -0.8 },
      { id: "i-uso", name: "US Oil Fund ($USO)", impact: 95, type: "Index", delta: 14.2 },
      { id: "i-brent", name: "Brent Crude ($BRENT)", impact: 98, type: "Index", delta: 15.6 }
    ]
  },
  2: {
    event: { name: "Semiconductor Disruption", impact: 76, type: "Event", details: "Taiwan seismic shock triggers halts across major port shipping buffers." },
    sectors: [
      { id: "s-semi", name: "Semiconductor Mfg", impact: -80, type: "Sector", delta: -7.5 },
      { id: "s-tech", name: "Consumer Electronics", impact: -68, type: "Sector", delta: -5.1 },
      { id: "s-cloud", name: "Cloud & AI Infrastructure", impact: -40, type: "Sector", delta: -2.8 }
    ],
    companies: [
      { id: "c-tsm", name: "TSMC ($TSM)", impact: -85, type: "Company", parent: "s-semi", delta: -9.2, details: "Port pauses halt physical wafer shipping. Re-routing adds 14-day delay." },
      { id: "c-nvda", name: "NVIDIA ($NVDA)", impact: -70, type: "Company", parent: "s-semi", delta: -6.4, details: "AI GPU packaging dependent on TSM output. Shipment projections cut for Q3." },
      { id: "c-asml", name: "ASML ($ASML)", impact: -55, type: "Company", parent: "s-semi", delta: -4.1, details: "Duv/Euv tool shipments delayed as gas input supply chains constrain." },
      { id: "c-aapl", name: "Apple ($AAPL)", impact: -50, type: "Company", parent: "s-tech", delta: -3.8, details: "iPhone assembly chips face supply constraints, pushing back production timeline." }
    ],
    indices: [
      { id: "i-soxx", name: "Semiconductors ($SOXX)", impact: -80, type: "Index", delta: -8.4 },
      { id: "i-ndx", name: "Nasdaq 100 ($NDX)", impact: -45, type: "Index", delta: -3.9 }
    ]
  },
  3: {
    event: { name: "ECB Emergency Liquidity Injection", impact: 89, type: "Event", details: "Unprecedented intra-meeting liquidity facilities expanded to stabilize sovereign spreads." },
    sectors: [
      { id: "s-banks", name: "European Financials", impact: 80, type: "Sector", delta: 7.2 },
      { id: "s-bond", name: "Sovereign Debt Markets", impact: -55, type: "Sector", delta: -4.5 }
    ],
    companies: [
      { id: "c-db", name: "Deutsche Bank ($DB)", impact: 78, type: "Company", parent: "s-banks", delta: 6.8, details: "Access to emergency funding cushions short-term liquidity concerns." },
      { id: "c-cbg", name: "Commerzbank", impact: 72, type: "Company", parent: "s-banks", delta: 5.9, details: "Liquidity ratios stabilize on ECB repo window expansion." }
    ],
    indices: [
      { id: "i-dax", name: "DAX Index ($DAX)", impact: 40, type: "Index", delta: 2.1 },
      { id: "i-stoxx", name: "Euro Stoxx 50 ($SX5E)", impact: 52, type: "Index", delta: 3.4 }
    ]
  },
  4: {
    event: { name: "AI Regulatory Framework Draft", impact: 65, type: "Event", details: "Leaked policy drafts raise compliance audit cost forecasts for autonomous LLM agents." },
    sectors: [
      { id: "s-sw", name: "Enterprise Software & SaaS", impact: -62, type: "Sector", delta: -4.9 },
      { id: "s-consult", name: "IT Consulting Services", impact: 45, type: "Sector", delta: 3.1 }
    ],
    companies: [
      { id: "c-msft", name: "Microsoft ($MSFT)", impact: -55, type: "Company", parent: "s-sw", delta: -3.5, details: "Strict liability rules on copilot tools raise legal risk and compliance cost reserves." },
      { id: "c-googl", name: "Alphabet ($GOOGL)", impact: -48, type: "Company", parent: "s-sw", delta: -2.8, details: "Search AI tools compliance audits modeled to extend release cycle by 3 months." },
      { id: "c-meta", name: "Meta ($META)", impact: -60, type: "Company", parent: "s-sw", delta: -4.2, details: "Open-source Llama distribution models face scrutiny under strict safety checks." }
    ],
    indices: [
      { id: "i-ndx", name: "Nasdaq 100 ($NDX)", impact: -28, type: "Index", delta: -1.9 }
    ]
  }
};

export const getCausalChain = (eventId) => {
  // Enforce correct id mapping or match titles
  if (typeof eventId === "string") {
    if (eventId.toLowerCase().includes("opec")) return causalChainData[1];
    if (eventId.toLowerCase().includes("semiconductor") || eventId.toLowerCase().includes("seismic")) return causalChainData[2];
    if (eventId.toLowerCase().includes("ecb")) return causalChainData[3];
    if (eventId.toLowerCase().includes("regulatory") || eventId.toLowerCase().includes("leak")) return causalChainData[4];
  }
  return causalChainData[eventId] || causalChainData[1];
};
