/**
 * End-to-end analyzeImpact on the five example questions plus empty input.
 * Network calls to /api/* fail in Node (relative URLs) — that is the failure path.
 */
import { analyzeImpact } from "../src/lib/impact/analyze.ts";

async function main() {
  const qs = [
    "What happens if India increases tariffs on Chinese solar panels?",
    "Oil just crossed $120. What companies could benefit?",
    "The Fed cut rates by 50 bps. What sectors are likely to benefit?",
    "What happens to Indian IT stocks if the rupee falls 5%?",
    "NVIDIA announced a new AI chip. Who are the biggest winners and losers?",
    "Which stocks could be negatively affected if China invades Taiwan?",
    "hi",
  ];
  for (const q of qs) {
    const a = await analyzeImpact(q);
    console.log("---");
    console.log("Q:", q);
    console.log("kind:", a.extracted.kind, "conf:", a.confidence.score, "insufficient:", a.confidence.insufficient);
    console.log("bens:", a.beneficiaries.map((c) => c.symbol).join(",") || "(none)");
    console.log("negs:", a.negatives.map((c) => c.symbol).join(",") || "(none)");
    console.log("chain:", a.chain.length, "precedents:", a.precedents.length, "caveats:", a.caveats.length);
  }
}

void main();
