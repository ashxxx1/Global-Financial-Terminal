/**
 * Broker export adapters.
 *
 * Real auto-sync needs an aggregator (SnapTrade, Plaid Investments) — an
 * account, a contract and a compliance review. Until that exists, the friction
 * worth removing is the file itself: every broker exports a different shape,
 * and a generic parser fails on most of them.
 *
 * So this detects the broker from the header row and applies its quirks. No
 * credentials are involved at any point, which is deliberate and permanent —
 * a chart site has no business holding brokerage logins.
 */

export interface BrokerProfile {
  id: string;
  label: string;
  region: string;
  /** Header fragments that identify this export. All must be present. */
  signature: string[];
  symbolCol: string[];
  qtyCol: string[];
  costCol: string[];
  currencyCol?: string[];
  /** Broker-specific ticker cleanup, applied before universe matching. */
  cleanSymbol?: (raw: string) => string;
  /** Numbers use 1.234,56 rather than 1,234.56. */
  europeanNumbers?: boolean;
  note?: string;
}

/**
 * Ordered most-specific first: Interactive Brokers' export also contains
 * "symbol" and "quantity", so anything with a distinctive signature has to be
 * tested before the generic profiles.
 */
export const BROKERS: BrokerProfile[] = [
  {
    id: "ibkr", label: "Interactive Brokers", region: "Global",
    signature: ["financial instrument information"],
    symbolCol: ["symbol"], qtyCol: ["quantity", "position"], costCol: ["cost basis", "cost price", "average price"],
    currencyCol: ["currency"],
    note: "Export the Portfolio section of an Activity Statement as CSV.",
  },
  {
    id: "schwab", label: "Charles Schwab", region: "US",
    signature: ["quantity", "price", "market value", "cost basis"],
    symbolCol: ["symbol"], qtyCol: ["quantity"], costCol: ["cost basis", "average cost", "cost/share"],
    cleanSymbol: (s) => s.replace(/\s+/g, ""),
  },
  {
    id: "fidelity", label: "Fidelity", region: "US",
    signature: ["account number", "symbol", "quantity"],
    symbolCol: ["symbol"], qtyCol: ["quantity"], costCol: ["average cost basis", "cost basis per share", "average cost"],
  },
  {
    id: "vanguard", label: "Vanguard", region: "US",
    signature: ["investment name", "shares"],
    symbolCol: ["symbol", "ticker"], qtyCol: ["shares"], costCol: ["share price", "average cost"],
  },
  {
    id: "robinhood", label: "Robinhood", region: "US",
    signature: ["instrument", "quantity", "average cost"],
    symbolCol: ["instrument", "symbol"], qtyCol: ["quantity"], costCol: ["average cost"],
  },
  {
    id: "etrade", label: "E*TRADE", region: "US",
    signature: ["symbol", "last price", "quantity"],
    symbolCol: ["symbol"], qtyCol: ["quantity"], costCol: ["price paid", "average price"],
  },
  {
    id: "zerodha", label: "Zerodha", region: "India",
    signature: ["instrument", "qty.", "avg. cost"],
    symbolCol: ["instrument"], qtyCol: ["qty.", "qty"], costCol: ["avg. cost", "avg cost"],
    // Zerodha appends the segment: RELIANCE-EQ, INFY-BE.
    cleanSymbol: (s) => s.replace(/-(EQ|BE|BZ|SM|ST)$/i, ""),
  },
  {
    id: "groww", label: "Groww", region: "India",
    signature: ["stock name", "quantity", "average buy price"],
    symbolCol: ["symbol", "stock name"], qtyCol: ["quantity"], costCol: ["average buy price", "avg buy price"],
  },
  {
    id: "trading212", label: "Trading 212", region: "UK / EU",
    signature: ["ticker", "no. of shares"],
    symbolCol: ["ticker"], qtyCol: ["no. of shares"], costCol: ["price / share", "average price"],
    currencyCol: ["currency (price / share)", "currency"],
  },
  {
    id: "hl", label: "Hargreaves Lansdown", region: "UK",
    signature: ["stock", "units held"],
    symbolCol: ["code", "epic", "stock"], qtyCol: ["units held", "units"], costCol: ["average cost (p)", "average cost"],
    note: "Hargreaves quotes UK holdings in pence; cost is converted on import.",
  },
  {
    id: "degiro", label: "DEGIRO", region: "EU",
    signature: ["product", "isin", "amount"],
    symbolCol: ["ticker", "symbol", "product"], qtyCol: ["amount", "quantity"], costCol: ["closing", "price", "local value"],
    europeanNumbers: true,
  },
  {
    id: "traderepublic", label: "Trade Republic", region: "EU",
    signature: ["isin", "quantity", "average price"],
    symbolCol: ["ticker", "symbol", "name"], qtyCol: ["quantity"], costCol: ["average price"],
    europeanNumbers: true,
  },
  {
    id: "wealthsimple", label: "Wealthsimple", region: "Canada",
    signature: ["symbol", "quantity", "book value"],
    symbolCol: ["symbol"], qtyCol: ["quantity"], costCol: ["book value", "average price"],
  },
  {
    id: "coinbase", label: "Coinbase", region: "Crypto",
    signature: ["asset", "quantity", "cost basis"],
    symbolCol: ["asset"], qtyCol: ["quantity"], costCol: ["cost basis"],
    note: "Only assets the terminal tracks are imported.",
  },
];

/** Generic fallback — the aliases most exports use regardless of broker. */
export const GENERIC: BrokerProfile = {
  id: "generic", label: "Generic CSV", region: "—",
  signature: [],
  symbolCol: ["symbol", "ticker", "instrument", "asset", "stock", "security", "code"],
  qtyCol: ["shares", "quantity", "qty", "units", "no. of shares", "position", "amount"],
  costCol: ["cost per share", "average cost", "avg cost", "cost basis", "price paid", "average price", "avg. cost", "price", "cost"],
  currencyCol: ["currency", "ccy"],
};

/** Which broker produced this file, judged from the header row alone. */
export function detectBroker(headers: string[]): BrokerProfile {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const joined = lower.join("|");
  for (const b of BROKERS) {
    if (b.signature.every((sig) => joined.includes(sig))) return b;
  }
  return GENERIC;
}

/** Index of the first header matching any alias, or -1. */
export function findCol(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  // Exact match first: "price" should not win over "cost per share".
  for (const a of aliases) {
    const i = lower.indexOf(a);
    if (i >= 0) return i;
  }
  for (const a of aliases) {
    const i = lower.findIndex((h) => h.includes(a));
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Parse a number from an export.
 *
 * Brokers disagree about separators: "1,234.56" in the US, "1.234,56" across
 * much of Europe, and both appear with currency symbols and stray spaces
 * attached. Stripping every non-digit — which the first version did — turns
 * "1.234,56" into 123456.
 */
export function parseNumber(raw: string, european = false): number {
  if (!raw) return NaN;
  let s = raw.replace(/[^\d.,-]/g, "").trim();
  if (!s) return NaN;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const decimalIsComma = european || (lastComma > lastDot && lastComma >= 0);

  if (decimalIsComma) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  return Number(s);
}

/** Columns that may carry a human-readable instrument name, as a fallback. */
export const NAME_ALIASES = ["product", "name", "description", "stock name", "instrument", "security", "investment name"];

/** Rows that are not holdings: subtotals, cash lines, blank spacers. */
export function isNonHolding(symbol: string, rawLine: string): boolean {
  const s = symbol.toLowerCase().trim();
  if (!s) return true;
  if (/^(total|subtotal|grand total|cash|cash & cash investments|account total|balance)$/.test(s)) return true;
  if (/^(usd|eur|gbp|inr|cad|aud)$/.test(s) && /cash|balance|sweep/i.test(rawLine)) return true;
  return false;
}

/**
 * Is this cost column a TOTAL for the position, or a per-share figure?
 *
 * Brokers use the same words for both. Schwab's "Cost Basis" is the total for
 * the lot; Fidelity's "Average Cost Basis" is per share. Getting it wrong is
 * not a cosmetic error — a total read as a per-share cost turned a 72% gain
 * into a reported 93% loss in testing.
 *
 * Decided from the header text rather than per broker, because the same broker
 * offers both columns depending on which report you export. Any mention of an
 * average or an explicit per-share unit wins; otherwise "basis", "book value"
 * or "total" means the whole position.
 */
export function costIsTotal(header: string): boolean {
  const h = (header || "").toLowerCase();
  if (/aver|avg|per share|\/ ?share|per unit/.test(h)) return false;
  return /basis|book value|total|value/.test(h);
}

/** An ISIN, which identifies a security but is not a ticker we can match. */
export const looksLikeIsin = (s: string): boolean => /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(s.trim().toUpperCase());
