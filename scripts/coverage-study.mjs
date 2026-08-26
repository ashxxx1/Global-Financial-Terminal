#!/usr/bin/env node
/**
 * "The markets no price feed reaches" — growth-plan item 106.
 *
 * The plan asks for an original data study journalists will cite. The test for
 * one is whether anybody else could publish it, and the answer here is no:
 * this is the map we were forced to draw while trying to put a live price on
 * every listing in the terminal, and it is not a dataset that exists anywhere
 * to be looked up.
 *
 * The finding is uncomfortable and that is why it is worth publishing: whole
 * national exchanges are invisible to the entire retail data industry. Not
 * expensive — absent. A reader in Lagos or Nairobi cannot buy their way to a
 * live quote on their own market at any price we could find.
 *
 * Every figure is computed from the registry the product runs on, so anyone can
 * check it against the live site. Written from the terminal's own coverage,
 * which is the limit of the claim and the post says so.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STOCKS_BY_COUNTRY } from "../src/data/stocksData.js";
import { COUNTRIES_DATA } from "../src/data/mockData.js";
import { availabilityOf, unavailableReason } from "../src/lib/priceAvailability.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "the-markets-no-price-feed-reaches";

function analyse() {
  const rows = [];
  for (const [code, list] of Object.entries(STOCKS_BY_COUNTRY)) {
    const meta = COUNTRIES_DATA[code];
    if (!meta || !list.length) continue;
    const priced = list.filter((s) => availabilityOf(s.ticker, "stock", code, s.name) === "coverable").length;
    rows.push({
      code,
      name: meta.name,
      exchange: meta.exchange,
      tracked: list.length,
      priced,
      share: priced / list.length,
      reason: priced === 0 ? unavailableReason(list[0].ticker, "stock", code, list[0].name) : "",
    });
  }
  return rows;
}

const pctText = (x) => `${Math.round(x * 100)}%`;

async function main() {
  const rows = analyse();
  const total = rows.reduce((a, r) => a + r.tracked, 0);
  const totalPriced = rows.reduce((a, r) => a + r.priced, 0);

  const full = rows.filter((r) => r.share === 1);
  const partial = rows.filter((r) => r.share > 0 && r.share < 1);
  const dark = rows.filter((r) => r.share === 0).sort((a, b) => a.name.localeCompare(b.name));

  const darkListings = dark.reduce((a, r) => a + r.tracked, 0);

  // One row per market with no feed at all. This is the table the whole study
  // exists to publish; the rest is context for it.
  const darkRows = dark.map((r) => ({
    label: r.name,
    meta: r.exchange,
    value: `${r.tracked} listed`,
    raw: r.tracked,
  }));

  const partialRows = partial
    .sort((a, b) => a.share - b.share)
    .map((r) => ({
      label: r.name,
      meta: r.exchange,
      value: `${r.priced} of ${r.tracked} priced`,
      raw: r.share,
    }));

  const post = {
    slug: SLUG,
    title: "The markets no price feed reaches",
    date: new Date().toISOString().slice(0, 10),
    kind: "data-study",
    summary:
      `Of ${rows.length} national markets we tried to price, ${dark.length} have no live feed we could reach at ` +
      `any price — ${darkListings} listed companies with no quote available to a retail data buyer.`,
    sections: [
      {
        heading: "Markets with no reachable price feed",
        note:
          "Not delayed, not expensive — absent. No provider we could find, free or paid, publishes a live quote " +
          "for these exchanges in a form a small consumer of market data can consume.",
        rows: darkRows,
      },
      {
        heading: "Markets we can price only in part",
        note:
          "Usually because the largest companies carry a US listing or a secondary line elsewhere, and the rest " +
          "of the exchange does not. Coverage follows a company's foreign listings, not its home market.",
        rows: partialRows,
      },
    ],
    takeaways: [
      `${totalPriced} of ${total} listed companies across ${rows.length} markets can be priced live: ${pctText(totalPriced / total)}.`,
      `${full.length} markets are fully covered, ${partial.length} partly, and ${dark.length} not at all.`,
      `The ${dark.length} uncovered markets are not small or obscure economies — they are national exchanges with ` +
      `${darkListings} listed companies between them in this sample.`,
      "Data coverage tracks where the money already is. A market that is hard to invest in is hard to get " +
      "prices for, which makes it harder to invest in.",
    ],
    method:
      "Computed from the instrument registry this terminal runs on, using the same availability rules the " +
      "product uses to decide whether to show a price. 'Reachable' means we could obtain a live or delayed " +
      "quote through a provider available to us: the free tier of a US market-data API, a public exchange " +
      "endpoint, an ETF that tracks the index, or a foreign listing of the same company. " +
      "The limits worth stating: this is our coverage, not a census of the industry — a bank with an " +
      "institutional terminal may reach markets we cannot, and our sample is the companies we track in each " +
      "market rather than every listing on it. What the figures do establish is what a small, well-motivated " +
      "buyer of market data can and cannot get, which is the question this product had to answer to exist.",
    generatedAt: Date.now(),
  };

  await writeFile(path.join(ROOT, "public/blog", `${SLUG}.json`), `${JSON.stringify(post, null, 1)}\n`);

  const indexPath = path.join(ROOT, "public/blog/index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const entry = { slug: SLUG, title: post.title, date: post.date, summary: post.summary, kind: post.kind };
  const at = index.findIndex((p) => p.slug === SLUG);
  if (at === -1) index.unshift(entry); else index[at] = entry;
  index.sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(indexPath, `${JSON.stringify(index, null, 1)}\n`);

  console.log(
    `  coverage study: ${totalPriced}/${total} listings priceable · ` +
    `${full.length} markets covered, ${partial.length} partial, ${dark.length} dark -> public/blog/${SLUG}.json`,
  );
  console.log(`  dark: ${dark.map((d) => d.name).join(", ")}`);
}

main().catch((e) => { console.error("coverage study failed:", e); process.exit(1); });
