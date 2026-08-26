/** Sector taxonomy for programmatic SEO pages. */
export interface SectorDef {
  slug: string;
  name: string;
  /** Exact `sector` strings from stocksData */
  match: string[];
  blurb: string;
}

export const SECTORS: SectorDef[] = [
  { slug: "technology", name: "Technology", match: ["Technology"], blurb: "Software, semiconductors, platforms and digital infrastructure." },
  { slug: "banking-finance", name: "Banking & Finance", match: ["Banking & Finance"], blurb: "Banks, payments, asset managers and financial infrastructure." },
  { slug: "energy", name: "Energy", match: ["Energy"], blurb: "Oil, gas, renewables and energy equipment." },
  { slug: "healthcare", name: "Healthcare", match: ["Healthcare"], blurb: "Pharma, biotech, devices and care delivery." },
  { slug: "consumer", name: "Consumer", match: ["Consumer"], blurb: "Retail, staples, discretionary and brands." },
  { slug: "industrial", name: "Industrial", match: ["Industrial"], blurb: "Manufacturing, machinery and industrial services." },
  { slug: "automotive", name: "Automotive", match: ["Automotive"], blurb: "OEMs, auto suppliers and mobility." },
  { slug: "defence", name: "Defence", match: ["Defence"], blurb: "Aerospace & defence contractors." },
  { slug: "telecom", name: "Telecom", match: ["Telecom"], blurb: "Carriers and communications infrastructure." },
  { slug: "utilities", name: "Utilities", match: ["Utilities"], blurb: "Power, water and regulated utilities." },
  { slug: "real-estate", name: "Real Estate", match: ["Real Estate"], blurb: "REITs and property companies." },
  { slug: "mining-resources", name: "Mining & Resources", match: ["Mining & Resources"], blurb: "Metals, mining and materials." },
  { slug: "media", name: "Media", match: ["Media"], blurb: "Broadcasters, streaming, publishing and information services." },
  { slug: "transportation", name: "Transportation", match: ["Transportation"], blurb: "Logistics, airlines, shipping and rails." },
];

export function sectorBySlug(slug: string): SectorDef | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

export function sectorSlugForName(name: string): string | undefined {
  return SECTORS.find((s) => s.match.includes(name))?.slug;
}
