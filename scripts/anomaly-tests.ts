/**
 * Anomaly detector checks (scoring + catalog + service).
 *   npx tsx scripts/anomaly-tests.ts
 */
import { runAnomalySelftest } from "../src/lib/anomalies/selftest.ts";

const rows = runAnomalySelftest();
let failed = 0;
for (const r of rows) {
  console.log(`${r.ok ? "ok" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  if (!r.ok) failed++;
}
if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log(`\n${rows.length} passed`);
