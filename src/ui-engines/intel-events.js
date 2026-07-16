// Global intelligence events — curated, geolocated, categorized. Each event is
// BOTH a glowing marker on the globe AND a card in the left intelligence feed,
// so clicking a marker highlights its feed card and vice-versa.
// All content is SIMULATED for demo purposes.

// category → { color, glyph, label }
export const CATEGORIES = {
  centralbank: { color: "#3ec6ff", glyph: "◈", label: "Central Bank" },
  ma:          { color: "#39d6a3", glyph: "⇄", label: "M&A" },
  ipo:         { color: "#8ee06b", glyph: "▲", label: "IPO" },
  sanctions:   { color: "#ff5b68", glyph: "⊘", label: "Sanctions" },
  election:    { color: "#c9a4ff", glyph: "◆", label: "Election" },
  conflict:    { color: "#ff3b4e", glyph: "✦", label: "Conflict" },
  trade:       { color: "#5bd1c4", glyph: "⇌", label: "Trade" },
  supply:      { color: "#e5aa52", glyph: "⬡", label: "Supply Chain" },
  commodity:   { color: "#f0b64a", glyph: "◉", label: "Commodity" },
  disaster:    { color: "#ff7a45", glyph: "⚠", label: "Disaster" },
  corporate:   { color: "#7fa8ff", glyph: "■", label: "Corporate" },
};

// sentiment → dot color
export const SENTIMENT = {
  positive: "#39d6a3",
  negative: "#ff5b68",
  neutral:  "#5b93d6",
  critical: "#ff2d40",
};

// impact 1..5 (5 = market-moving)
export const EVENTS = [
  { id:"e01", cat:"centralbank", city:"Washington", country:"United States", flag:"🇺🇸", lat:38.90, lon:-77.04,
    headline:"Federal Reserve signals possible rate cut at next meeting",
    summary:"Minutes reveal a dovish tilt; futures now price a 62% chance of easing.",
    source:"Meridian Wire", sentiment:"positive", impact:5, mins:4 },
  { id:"e02", cat:"commodity", city:"Riyadh", country:"Saudi Arabia", flag:"🇸🇦", lat:24.71, lon:46.68,
    headline:"Oil climbs 3.4% after unexpected supply disruption",
    summary:"Brent breaks $92 as a key export terminal halts loadings.",
    source:"Energy Desk", sentiment:"negative", impact:4, mins:11 },
  { id:"e03", cat:"trade", city:"Brussels", country:"Belgium", flag:"🇧🇪", lat:50.85, lon:4.35,
    headline:"EU and Mercosur finalize landmark trade agreement",
    summary:"Tariff schedule to phase out over seven years across 12 sectors.",
    source:"Trade Monitor", sentiment:"positive", impact:4, mins:19 },
  { id:"e04", cat:"ma", city:"New York", country:"United States", flag:"🇺🇸", lat:40.71, lon:-74.01,
    headline:"$28B cross-border merger clears final antitrust review",
    summary:"Combined entity becomes the third-largest player in its category.",
    source:"Deal Flow", sentiment:"positive", impact:3, mins:27 },
  { id:"e05", cat:"election", city:"New Delhi", country:"India", flag:"🇮🇳", lat:28.61, lon:77.21,
    headline:"State election results tilt reform-friendly, rupee firms",
    summary:"Investors read the outcome as continuity for capital-market policy.",
    source:"Politik", sentiment:"positive", impact:3, mins:33 },
  { id:"e06", cat:"ipo", city:"Shanghai", country:"China", flag:"🇨🇳", lat:31.23, lon:121.47,
    headline:"Semiconductor group files for $6B dual-listing",
    summary:"Pricing range implies a 34% premium to nearest listed peer.",
    source:"Primary Markets", sentiment:"neutral", impact:3, mins:41 },
  { id:"e07", cat:"sanctions", city:"Moscow", country:"Russia", flag:"🇷🇺", lat:55.75, lon:37.62,
    headline:"New sanctions package targets shadow-fleet financing",
    summary:"Measures extend to insurers and three regional lenders.",
    source:"Compliance Wire", sentiment:"critical", impact:4, mins:52 },
  { id:"e08", cat:"conflict", city:"Red Sea", country:"Yemen", flag:"🌐", lat:15.35, lon:42.00,
    headline:"Shipping insurers widen war-risk premiums on key route",
    summary:"Rerouting adds an estimated 11 days to Asia–Europe transit.",
    source:"Maritime Risk", sentiment:"critical", impact:4, mins:63 },
  { id:"e09", cat:"supply", city:"Kaohsiung", country:"Taiwan", flag:"🇹🇼", lat:22.63, lon:120.30,
    headline:"Port congestion eases as backlog clears ahead of schedule",
    summary:"Container dwell times fall to a nine-month low.",
    source:"Logistics", sentiment:"positive", impact:2, mins:74 },
  { id:"e10", cat:"corporate", city:"Tokyo", country:"Japan", flag:"🇯🇵", lat:35.68, lon:139.69,
    headline:"Electronics giant lifts full-year guidance on AI demand",
    summary:"Operating margin outlook raised 140bps; buyback expanded.",
    source:"Earnings", sentiment:"positive", impact:3, mins:88 },
  { id:"e11", cat:"centralbank", city:"Frankfurt", country:"Germany", flag:"🇩🇪", lat:50.11, lon:8.68,
    headline:"ECB holds rates, flags data-dependence into next quarter",
    summary:"President stresses inflation path 'not yet decisively' anchored.",
    source:"Meridian Wire", sentiment:"neutral", impact:4, mins:96 },
  { id:"e12", cat:"disaster", city:"Manila", country:"Philippines", flag:"🇵🇭", lat:14.60, lon:120.98,
    headline:"Typhoon disrupts manufacturing corridor, output slips",
    summary:"Insurers begin preliminary loss assessment across three provinces.",
    source:"Cat Risk", sentiment:"negative", impact:3, mins:112 },
  { id:"e13", cat:"commodity", city:"London", country:"United Kingdom", flag:"🇬🇧", lat:51.51, lon:-0.13,
    headline:"Copper hits 14-month high on tightening warehouse stocks",
    summary:"LME inventories down 22% quarter-to-date.",
    source:"Metals Desk", sentiment:"neutral", impact:3, mins:129 },
  { id:"e14", cat:"ma", city:"São Paulo", country:"Brazil", flag:"🇧🇷", lat:-23.55, lon:-46.63,
    headline:"Regional fintech acquired in largest LatAm deal of the year",
    summary:"All-cash offer values the platform at 9.2x forward revenue.",
    source:"Deal Flow", sentiment:"positive", impact:2, mins:144 },
  { id:"e15", cat:"trade", city:"Singapore", country:"Singapore", flag:"🇸🇬", lat:1.29, lon:103.85,
    headline:"ASEAN digital-trade pact adds cross-border data provisions",
    summary:"Framework covers e-invoicing and paperless customs by 2027.",
    source:"Trade Monitor", sentiment:"positive", impact:2, mins:158 },
  { id:"e16", cat:"corporate", city:"Sydney", country:"Australia", flag:"🇦🇺", lat:-33.87, lon:151.21,
    headline:"Mining major approves $4B expansion of flagship project",
    summary:"First production targeted for late 2028; board cites demand outlook.",
    source:"Earnings", sentiment:"neutral", impact:2, mins:173 },
];

export function fmtAgo(mins) {
  if (mins < 60) return mins + "m ago";
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h < 24) return m ? `${h}h ${m}m ago` : `${h}h ago`;
  return Math.floor(h / 24) + "d ago";
}
