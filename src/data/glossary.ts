/**
 * Educational glossary — growth-plan item 103.
 *
 * Definition pages are the cheapest durable organic traffic in finance: the
 * queries are evergreen, the intent is informational, and the competition is
 * mostly thin content farms. Each entry becomes its own indexable route.
 *
 * Written to actually answer the question rather than to hit a keyword. Every
 * entry has a plain definition, a worked example with real numbers, and — where
 * it matters — the misunderstanding that sends people wrong. Thin programmatic
 * pages get penalised (item 100); these are the opposite of thin.
 */

export interface Term {
  slug: string;
  term: string;
  short: string;
  body: string;
  example: string;
  /** The common mistake. Often the most useful line on the page. */
  pitfall?: string;
  related: string[];
  category: "Markets" | "Analysis" | "Instruments" | "Risk";
}

export const GLOSSARY: Term[] = [
  {
    slug: "market-breadth",
    term: "Market breadth",
    category: "Markets",
    short: "How many stocks are participating in a move, rather than how far the index went.",
    body: "Breadth counts advancers against decliners. An index can rise while most of its members fall, if a handful of very large companies carry it. Breadth is what tells you which of those two things happened, and it is the reason two identical index moves can mean completely different things.",
    example: "The index closes +0.8%, but 380 members are down and only 120 are up. The gain came from a few megacaps; the average stock had a bad day.",
    pitfall: "Treating a green index as a green market. Narrow rallies are historically more fragile than broad ones.",
    related: ["advance-decline-line", "market-capitalisation"],
  },
  {
    slug: "advance-decline-line",
    term: "Advance–decline line",
    category: "Markets",
    short: "A running total of advancing minus declining stocks.",
    body: "Each day you add the number of risers and subtract the fallers, then plot the cumulative total. Because every stock counts once regardless of size, it describes the typical company rather than the largest ones.",
    example: "Over ten sessions the index makes new highs while the A/D line drifts lower — fewer and fewer names are doing the work.",
    pitfall: "Reading the absolute level. Only the direction and its agreement with the index carry information.",
    related: ["market-breadth"],
  },
  {
    slug: "bid-ask-spread",
    term: "Bid–ask spread",
    category: "Markets",
    short: "The gap between the best price to sell and the best price to buy.",
    body: "The bid is the highest price a buyer will pay; the ask is the lowest a seller will accept. The spread is the difference, and it is a real cost you pay on entry and again on exit. It widens when liquidity thins — overnight, in small companies, and during stress.",
    example: "Bid 100.02, ask 100.06. The spread is 4 cents, so a round trip costs roughly 8 cents per share before commission.",
    pitfall: "Comparing quoted prices between instruments without checking the spread. A cheaper headline price can be more expensive to trade.",
    related: ["liquidity", "market-order"],
  },
  {
    slug: "liquidity",
    term: "Liquidity",
    category: "Risk",
    short: "How much you can trade without moving the price against yourself.",
    body: "A liquid instrument absorbs size quietly; an illiquid one moves as soon as you arrive. Liquidity is not a fixed property — it evaporates precisely when everyone wants it, which is what turns an ordinary drawdown into a disorderly one.",
    example: "Selling 1,000 shares of a megacap barely registers. The same order in a small-cap moves the price several percent.",
    pitfall: "Assuming yesterday's liquidity will be there tomorrow. It is a condition, not a guarantee.",
    related: ["bid-ask-spread", "volatility"],
  },
  {
    slug: "volatility",
    term: "Volatility",
    category: "Risk",
    short: "How much a price moves around, not which direction it moves.",
    body: "Usually the standard deviation of returns, annualised. High volatility means large swings in both directions; it says nothing about whether you will make money. It matters because position sizing should scale to it — the same number of shares in two instruments is not the same amount of risk.",
    example: "A stock with 40% annualised volatility routinely moves ±2.5% a day. One at 12% rarely moves more than ±0.75%.",
    pitfall: "Equating volatility with risk of loss. A steadily declining asset can be low-volatility and still ruinous.",
    related: ["standard-deviation", "drawdown"],
  },
  {
    slug: "drawdown",
    term: "Drawdown",
    category: "Risk",
    short: "The fall from a peak to the trough that follows it.",
    body: "Maximum drawdown is the worst such fall over a period. It is the most honest single risk number because it describes the experience of holding, not the arithmetic of the average return — and recovery is asymmetric.",
    example: "A portfolio peaks at 120, bottoms at 78, then recovers. The maximum drawdown is 35%, and it needs +54% to get back to 120.",
    pitfall: "Underestimating the asymmetry. A 50% loss requires a 100% gain to break even.",
    related: ["volatility"],
  },
  {
    slug: "market-capitalisation",
    term: "Market capitalisation",
    category: "Instruments",
    short: "Share price multiplied by the number of shares outstanding.",
    body: "The market's price for the whole equity of a company. Most major indices weight members by it, which is why a handful of the largest companies can dominate the index's behaviour.",
    example: "2 billion shares at $150 is a $300bn market capitalisation, whatever the share price alone suggests.",
    pitfall: "Comparing share prices between companies. A $500 share is not 'expensive' relative to a $20 one — only the multiples are comparable.",
    related: ["market-breadth", "price-earnings-ratio"],
  },
  {
    slug: "price-earnings-ratio",
    term: "Price/earnings ratio",
    category: "Analysis",
    short: "Share price divided by earnings per share.",
    body: "Roughly, the number of years of current earnings you are paying for. It is a shorthand for expectations: a high P/E means the market expects growth, not that the company is 'bad value'. It is only meaningful against a peer group and the company's own history.",
    example: "$60 share, $3 earnings per share → a P/E of 20.",
    pitfall: "Comparing P/E across industries. Utilities and software do not trade on the same multiples and never have.",
    related: ["market-capitalisation", "earnings-per-share"],
  },
  {
    slug: "earnings-per-share",
    term: "Earnings per share",
    category: "Analysis",
    short: "Net profit divided by shares outstanding.",
    body: "Profit attributable to each share. Watch whether a figure is basic or diluted (diluted includes options and convertibles), and whether it is adjusted — 'adjusted' EPS excludes items management considers unrepresentative, which is sometimes fair and sometimes flattering.",
    example: "$1.2bn profit over 400m shares is $3.00 of earnings per share.",
    pitfall: "Comparing adjusted EPS from one company with reported EPS from another.",
    related: ["price-earnings-ratio"],
  },
  {
    slug: "basis-point",
    term: "Basis point",
    category: "Markets",
    short: "One hundredth of a percentage point.",
    body: "Used wherever small percentage changes matter enough to need unambiguous language — interest rates, yields, and fees. 100 basis points is 1%. It exists because 'the rate rose by 0.5%' is genuinely ambiguous: half a point, or half a percent of the existing rate?",
    example: "A policy rate moving from 5.00% to 5.25% has risen 25 basis points.",
    related: ["yield"],
  },
  {
    slug: "yield",
    term: "Yield",
    category: "Instruments",
    short: "Income from an asset as a percentage of its price.",
    body: "For a bond, coupon divided by price; for a share, dividend divided by price. Yield moves inversely to price: if the payment is fixed and the price falls, the yield rises. A very high yield is usually the market pricing in a cut, not a bargain.",
    example: "A bond paying $40 a year, priced at $800, yields 5%. If the price falls to $500, the yield is 8%.",
    pitfall: "Chasing the highest yield. It is frequently a warning rather than an opportunity.",
    related: ["basis-point"],
  },
  {
    slug: "standard-deviation",
    term: "Standard deviation",
    category: "Analysis",
    short: "How far values typically sit from their average.",
    body: "The most common measure of dispersion, and the basis of most volatility figures. In markets it is applied to returns, with the caveat that returns are not normally distributed — extreme moves happen far more often than the maths predicts.",
    example: "Daily returns averaging 0% with a 1.5% standard deviation put roughly two thirds of days inside ±1.5%.",
    pitfall: "Assuming a normal distribution. Financial tails are fat; 'six-sigma' days arrive every few years.",
    related: ["volatility"],
  },
  {
    slug: "market-order",
    term: "Market order",
    category: "Markets",
    short: "An instruction to trade immediately at whatever price is available.",
    body: "It prioritises certainty of execution over certainty of price. In a liquid instrument during normal hours the difference is trivial; in a thin one, or at the open, it can be substantial. A limit order is the opposite trade-off: your price, no guarantee of a fill.",
    example: "You send a market buy; the best ask is 50.10, so you pay 50.10 — or worse, if size is thin.",
    pitfall: "Using market orders outside regular hours, where spreads are widest.",
    related: ["bid-ask-spread", "liquidity"],
  },
];

export const glossaryBySlug = (slug: string): Term | undefined =>
  GLOSSARY.find((t) => t.slug === slug);
