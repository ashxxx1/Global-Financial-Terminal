export interface Fundamentals {
  marketCap: string;
  peRatio: string;
  eps: string;
  divYield: string;
  high52w: string;
  low52w: string;
  beta: string;
  avgVolume: string;
}

function hashSymbol(sym: string): number {
  let hash = 0;
  for (let i = 0; i < sym.length; i++) {
    hash = sym.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function generateFundamentals(symbol: string, currentPrice: number): Fundamentals {
  const h = hashSymbol(symbol);
  
  // Deterministic seed values
  const seedPE = 10 + (h % 50) + ((h % 100) / 100);
  const seedYield = (h % 50) === 0 ? 0 : (h % 6) + ((h % 100) / 100);
  const seedBeta = 0.5 + ((h % 150) / 100);
  
  const mcapBillions = 5 + (h % 2000);
  const eps = currentPrice / seedPE;
  
  const spreadHigh = 1.05 + ((h % 20) / 100);
  const spreadLow = 0.60 + ((h % 30) / 100);
  const high52 = currentPrice * spreadHigh;
  const low52 = currentPrice * spreadLow;
  
  const avgVol = 1 + (h % 50);

  return {
    marketCap: `$${mcapBillions >= 1000 ? (mcapBillions / 1000).toFixed(2) + "T" : mcapBillions + "B"}`,
    peRatio: seedPE.toFixed(2),
    eps: `$${eps.toFixed(2)}`,
    divYield: seedYield === 0 ? "N/A" : `${seedYield.toFixed(2)}%`,
    high52w: `$${high52.toFixed(2)}`,
    low52w: `$${low52.toFixed(2)}`,
    beta: seedBeta.toFixed(2),
    avgVolume: `${avgVol.toFixed(1)}M`,
  };
}
