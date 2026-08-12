import { lazy, Suspense, useEffect, useState } from "react";
import { track } from "../lib/analytics";
import { useReveal } from "../lib/useReveal";
import { useSeo } from "../lib/seo";
import { useIndices } from "../lib/hooks";
import { SUPPORT_MAILTO } from "../lib/support";
import GftLogo from "../components/GftLogo";
import MonoChart from "../components/MonoChart";
import PnlPreview from "../components/PnlPreview";
import ProofBlock from "../components/ProofBlock";

// The globe is the product's signature asset — it belongs on the front page.
// Lazy so it never sits on the critical path.
const Globe3D = lazy(() => import("../components/Globe3D"));
import "../styles/landing.css";

/**
 * Public landing page — monochrome rebuild.
 *
 * Direction from ui-ux-pro-max: pattern "Minimal Single Column" (large type,
 * heavy whitespace, three benefits maximum, single CTA focus, no nav clutter)
 * rendered in "Swiss Modernism 2.0" — pure black to white, hairline grid,
 * mathematical spacing, WCAG AAA contrast.
 *
 * The discipline is the design. There is no colour on this page except the
 * market data itself, one entrance animation, one marquee and one chart that
 * draws once. Every element that could not justify its place was deleted
 * rather than restyled — the previous version had six feature cards, two
 * globes and four gradients.
 */
export default function Landing({ onGetStarted }: { onGetStarted: (mode?: "signin" | "signup") => void }) {
  useSeo({
    title: "GFT Terminal — The World's Economy, On One Screen",
    description:
      "A living map of global markets and the news that moves them. Live crypto, FX and delayed equities across 68 countries. Free to explore.",
    path: "/",
  });

  const [lit, setLit] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLit(true), 90); return () => clearTimeout(t); }, []);

  const threeRef = useReveal<HTMLDivElement>(".lpx-cell");
  const chartRef = useReveal<HTMLDivElement>();
  const plansRef = useReveal<HTMLDivElement>(".lpx-plan");
  const whyRef = useReveal<HTMLDivElement>(".why-row");

  const start = (mode: "signin" | "signup", placement: string) => {
    track("upgrade_clicked", { placement });
    onGetStarted(mode);
  };

  return (
    <div className="lpx lp">
      <nav className="lpx-nav">
        <span className="lpx-brand">
          <GftLogo size={22} animated={lit} />
          <span className="lpx-brand-full">Global Financial Terminal</span>
          <span className="lpx-brand-short">GFT</span>
        </span>
        <span className="lpx-nav-right">
          <button className="lpx-link" onClick={() => start("signin", "nav")}>Sign in</button>
          <button className="lpx-btn sm" onClick={() => start("signup", "nav")}>Start free</button>
        </span>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      {/* Rendered in greyscale so the signature asset returns without
          breaking the monochrome rule — the globe becomes a sphere of light
          rather than a colour illustration. */}
      <div className="lpx-globe" aria-hidden>
        <Suspense fallback={null}>
          <Globe3D overlay="market" quakes={[]} onHover={() => {}} onCountryClick={() => {}} />
        </Suspense>
      </div>

      <header className="lpx-inner lpx-hero">
        <div className="lpx-kicker"><span className="dot" />Live · 68 countries</div>
        <h1 className={`lpx-h1 ${lit ? "lpx-reveal" : ""}`}>
          {["The", "world's", "economy,"].map((w, i) => (
            <span key={w} className="lpx-word" style={{ animationDelay: `${0.05 + i * 0.07}s` }}>{w + " "}</span>
          ))}
          <em className="lpx-word" style={{ animationDelay: "0.26s" }}>on one screen.</em>
        </h1>
        <p className="lpx-lead">
          Markets, currencies and the headlines that move them — mapped to the
          countries and sectors they actually hit. Built to be understood at a
          glance, not decoded.
        </p>
        <div className="lpx-actions">
          <button className="lpx-btn" onClick={() => start("signup", "hero")}>
            Start free
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="lpx-link" onClick={() => start("signin", "hero")}>I have an account</button>
        </div>
        <p className="lpx-note">No card required · Free forever tier</p>
      </header>

      {/* ── The tape: one thin line of live truth ─────────────── */}
      <Tape />

      {/* ── One chart. Real data. Draws once. ─────────────────── */}
      <section className="lpx-inner lpx-section" ref={chartRef}>
        <div className="lpx-eyebrow">Real series, not a mockup</div>
        <h2 className="lpx-h2">The same engine that runs the terminal.</h2>
        <div className="lpx-split">
          <MonoChart symbol="AAPL" range="3M" height={240} label="AAPL · Apple Inc." />
          <PnlPreview />
        </div>
      </section>

      {/* ── Three benefits. Three. ────────────────────────────── */}
      <div className="lpx-three" ref={threeRef}>
        {THREE.map((t, i) => (
          <article className="lpx-cell" key={t.title}>
            <span className="lpx-cell-n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
          </article>
        ))}
      </div>

      {/* ── Proof: what's covered, and the scored record ─────── */}
      <section className="lpx-inner lpx-section" id="proof">
        <div className="lpx-eyebrow">What you're actually getting</div>
        <h2 className="lpx-h2">Every call is published before the outcome.</h2>
        <ProofBlock />
      </section>

      {/* ── Why anyone pays ──────────────────────────────────── */}
      <section className="lpx-inner lpx-section" id="why">
        <div className="lpx-eyebrow">Why people upgrade</div>
        <h2 className="lpx-h2">Six things the free tier can't do.</h2>
        <div className="why" ref={whyRef}>
          {WHY.map((w, i) => (
            <div className="why-row" key={w.t}>
              <span className="why-n">{String(i + 1).padStart(2, "0")}</span>
              <div className="why-body">
                <b>{w.t}</b>
                <p>{w.b}</p>
              </div>
              <span className={`why-metric ${w.tone}`}>{w.m}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section className="lpx-inner lpx-section" id="pricing">
        <div className="lpx-eyebrow">Pricing</div>
        <h2 className="lpx-h2">Free to explore. Pay when it earns it.</h2>
        <div className="lpx-plans" ref={plansRef} style={{ marginTop: 40 }}>
          {PLANS.map((p) => (
            <div className={`lpx-plan ${p.on ? "on" : ""}`} key={p.name}>
              <span className="lpx-plan-name">{p.name}</span>
              <div className="lpx-plan-price">{p.price}<span>{p.per}</span></div>
              <ul>{p.perks.map((k) => <li key={k}>{k}</li>)}</ul>
              <button
                className={`lpx-btn ${p.on ? "" : "ghost"}`}
                onClick={() => start("signup", `pricing-${p.name.toLowerCase()}`)}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Honesty + footer ──────────────────────────────────── */}
      <div className="lpx-inner">
        <p className="lpx-honesty">
          <b>On the data.</b> Crypto and FX are live. Equities are delayed, index
          levels are illustrative, and anything marked DEMO is a feature still
          being built — not analysis. Every number on screen carries its own
          source label. Nothing here is investment advice.
        </p>
        <footer className="lpx-foot">
          <span>© {new Date().getFullYear()} Global Financial Terminal</span>
          <span style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <a href="/data-sources">Data sources</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href={SUPPORT_MAILTO}>Contact</a>
          </span>
        </footer>
      </div>
    </div>
  );
}

/** The live tape. Duplicated once so the marquee loop is seamless. */
function Tape() {
  const all = useIndices();
  const rows = all.slice(0, 14);
  if (rows.length === 0) return <div className="lpx-tape" style={{ height: 49 }} aria-hidden />;
  const loop = [...rows, ...rows];

  return (
    <div className="lpx-tape" aria-label="Live market tape">
      <div className="lpx-tape-track">
        {loop.map((q, i) => (
          <span className="lpx-tape-item" key={`${q.symbol}-${i}`}>
            <span className="lpx-tape-sym">{q.name}</span>
            <span className="lpx-tape-px">{q.display}</span>
            <span className={`lpx-tape-chg ${q.changePct >= 0 ? "up" : "down"}`}>
              {Math.abs(q.changePct).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const THREE = [
  { title: "One map, every market",
    body: "68 countries on a single surface — indices, currencies and crypto in one place, so you see the whole picture instead of eleven browser tabs." },
  { title: "Headlines with consequences",
    body: "Every story mapped to the sectors and tickers it actually touches. The 'so what' arrives with the news, not an hour later." },
  { title: "It tells you what's real",
    body: "Live, delayed and simulated are labelled everywhere, on every number. You always know exactly what you're looking at." },
];

const WHY = [
  { t: "Track what you actually own", b: "Positions, cost basis and unrealised P&L, marked against live prices — not a watchlist pretending to be a portfolio.", m: "P&L", tone: "up" },
  { t: "Alerts that reach you", b: "Email and push the moment a level breaks, so you find out while you can still act rather than the next morning.", m: "24/7", tone: "" },
  { t: "The morning brief", b: "One email before the open: your holdings, what moved overnight, and the headlines attached to each.", m: "06:30", tone: "" },
  { t: "No delay on quotes", b: "Real-time equity data instead of the delayed free-tier feed. The difference matters most exactly when it matters.", m: "0s", tone: "up" },
  { t: "Unlimited watchlists", b: "Group by thesis, sector or client instead of squeezing everything into three symbols.", m: "∞", tone: "" },
  { t: "Export everything", b: "CSV and API access for your own models. Your data leaves as easily as it arrived — no lock-in.", m: "CSV", tone: "" },
];

const PLANS = [
  { name: "Free", price: "$0", per: "/forever", on: false, cta: "Start free",
    perks: ["The full world map", "Live crypto & FX", "News-to-signal feed", "3-symbol watchlist"] },
  // $15, not $9 — GROWTH-PLAN.md Decision 1: at 3% conversion, 20K MAU is ~600
  // subscribers; $9 caps that at $65K ARR, $15 clears the $100K target.
  { name: "Pro", price: "$15", per: "/month", on: true, cta: "Get started",
    perks: ["Everything in Free", "Unlimited watchlist", "Email & push alerts", "Daily market digest", "Portfolio tracking"] },
  { name: "Team", price: "$39", per: "/month", on: false, cta: "Start trial",
    perks: ["Everything in Pro", "5 seats included", "Shared watchlists", "Consolidated billing"] },
  { name: "Embed", price: "Talk", per: "", on: false, cta: "Contact us",
    perks: ["The map as a widget", "For blogs & brokers", "Your branding", "Priority support"] },
];
