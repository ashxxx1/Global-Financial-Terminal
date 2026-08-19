/**
 * Impact copilot checks (extraction + ranking). No live network required.
 *   npx tsx scripts/impact-tests.ts
 */
import { runImpactSelftest } from "../src/lib/impact/selftest.ts";

const rows = runImpactSelftest();
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
