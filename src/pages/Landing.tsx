import { lazy, Suspense } from "react";
import { track } from "../lib/analytics";
import { useSeo } from "../lib/seo";

// The globe is the pitch, but it is also the heaviest thing in the bundle —
// lazy-load it so the landing's text and CTAs paint immediately.
const Globe3D = lazy(() => import("../components/Globe3D"));

/**
 * Public landing page.
 *
 * This is the growth surface: the first thing an anonymous visitor and every
 * search crawler sees. The whole app used to sit behind the auth wall, which
 * meant zero shareable/indexable content. The value is shown here first; the
 * wall comes after the pitch, not before it.
 */
export default function Landing({ onGetStarted }: { onGetStarted: (mode?: "signin" | "signup") => void }) {
  useSeo({
    title: "GFT Terminal — The World's Economy, On One Screen",
    description:
      "A living 3D map of global markets and the news that moves them. Live indices, FX and crypto across 68 countries. Free to explore.",
    path: "/",
  });

  const start = (mode: "signin" | "signup", placement: string) => {
    track("upgrade_clicked", { placement });
    onGetStarted(mode);
  };

  return (
    <div className="lp">
      <div className="auth-aurora" aria-hidden />

      {/* top bar */}
      <header className="lp-nav">
        <div className="auth-brand">
          <span className="auth-mark" aria-hidden />
          GFT<span style={{ color: "var(--gold)" }}>·</span>TERMINAL
        </div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <button className="lp-nav-signin" onClick={() => start("signin", "nav")}>Sign in</button>
          <button className="btn-primary sm" onClick={() => start("signup", "nav")}>Get started</button>
        </nav>
      </header>

      {/* hero */}
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <div className="lp-badge">
            <span className="pulse-dot" style={{ background: "var(--up)" }} />
            LIVE · 68 COUNTRIES
          </div>
          <h1 className="lp-h1">
            <span className="hero-shine">The world's economy,</span><br />
            <span className="live-glow">on one screen.</span>
          </h1>
          <p className="lp-lead">
            A living 3D map of global markets — indices, FX, crypto and the news
            that moves them, mapped to the countries and sectors they hit. Built
            for people who want to <em>understand</em> markets, not just stare at
            candles.
          </p>
          <div className="lp-cta">
            <button className="btn-primary" onClick={() => start("signup", "hero")}>
              Start free →
            </button>
            <button className="btn-ghost" onClick={() => start("signin", "hero")}>
              I have an account
            </button>
          </div>
          <div className="lp-trust">
            No card required · Free forever tier · Your watchlist syncs everywhere
          </div>
        </div>

        <div className="lp-hero-globe" aria-hidden>
          <Suspense fallback={<div className="lp-globe-skeleton" />}>
            <Globe3D overlay="market" quakes={[]} onHover={() => {}} onCountryClick={() => {}} />
          </Suspense>
          <div className="lp-globe-fade" />
        </div>
      </section>

      {/* features */}
      <section className="lp-section" id="features">
        <div className="lp-section-head">
          <h2>Markets you can actually read at a glance.</h2>
        </div>
        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div className="lp-card" key={f.title}>
              <div className="lp-card-icon" style={{ color: f.color }}><FeatureIcon name={f.icon} /></div>
              <b>{f.title}</b>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section className="lp-section" id="pricing">
        <div className="lp-section-head">
          <h2>Free to explore. Upgrade when it earns its keep.</h2>
        </div>
        <div className="lp-pricing">
          {PLANS.map((p) => (
            <div className={`lp-plan ${p.featured ? "featured" : ""}`} key={p.name}>
              {p.featured && <div className="lp-plan-tag">MOST POPULAR</div>}
              <div className="lp-plan-name">{p.name}</div>
              <div className="lp-plan-price">
                {p.price}<span>{p.per}</span>
              </div>
              <ul>
                {p.perks.map((perk) => <li key={perk}>{perk}</li>)}
              </ul>
              <button
                className={p.featured ? "btn-primary" : "btn-ghost"}
                onClick={() => start("signup", `pricing-${p.name.toLowerCase()}`)}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="lp-note">
          Pro is coming soon — start on Free today and you'll be first in line.
        </p>
      </section>

      {/* honesty */}
      <section className="lp-honesty">
        <p>
          <b>Straight talk on data.</b> Crypto and FX are live. Equity and index
          prices are delayed or illustrative, and anything marked <em>DEMO</em> is
          a simulation of a feature we're building, not real analysis. We'd rather
          tell you than have you find out. Nothing here is investment advice.
        </p>
      </section>

      {/* final CTA */}
      <section className="lp-final">
        <h2>See the whole world's economy move.</h2>
        <button className="btn-primary lg" onClick={() => start("signup", "footer")}>
          Create your free terminal →
        </button>
        <footer className="lp-footer">
          © {new Date().getFullYear()} GFT Terminal · Informational only, not investment advice
        </footer>
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: "globe", color: "var(--blue)", title: "A living globe", body: "Every market, plotted on a 3D Earth you can spin. See where money is moving — and where it isn't — in one glance." },
  { icon: "signal", color: "var(--gold)", title: "News → signals", body: "Headlines mapped to the sectors and stocks they actually move, so you see the 'so what', not just the story." },
  { icon: "sessions", color: "var(--cyan)", title: "Market sessions & breadth", body: "Who's trading right now, and whether a move is broad or three megacaps carrying the index." },
  { icon: "star", color: "var(--up)", title: "Watchlist that follows you", body: "Star anything; it syncs to your account across every device, not one browser's memory." },
  { icon: "heatmap", color: "#a08cff", title: "Sector heat map", body: "The whole market's mood in a single grid — which sectors are hot, which are bleeding, updated live." },
  { icon: "bell", color: "var(--down)", title: "Price alerts", body: "Get told the moment a level breaks — by toast now, by email soon — instead of finding out after." },
];

/**
 * Feature icons — drawn line icons in one consistent 1.6 stroke, replacing the
 * unicode glyphs (◍ ⚡ ◔ …) that read as placeholder rather than iconography.
 */
function FeatureIcon({ name }: { name: string }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "globe": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.6 2.5 4 5.7 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.7-4-9s1.4-6.5 4-9Z" /></svg>);
    case "signal": return (<svg {...p}><path d="M3 15l5-6 4 4 6-8" /><path d="M18 5h3v3" /></svg>);
    case "sessions": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>);
    case "star": return (<svg {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z" /></svg>);
    case "heatmap": return (<svg {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="1.4" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4" /></svg>);
    case "bell": return (<svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>);
    default: return null;
  }
}

const PLANS = [
  {
    name: "Free", price: "$0", per: "/forever", featured: false, cta: "Start free",
    perks: ["The full 3D globe", "Live crypto & FX", "News-to-signal feed", "3-symbol watchlist", "In-app alerts"],
  },
  {
    // $15, not $9 — see GROWTH-PLAN.md Decision 1. At a realistic 3% conversion,
    // 20K MAU yields ~600 subscribers; $9 caps that at $65K ARR and misses the
    // $100K target, $15 clears it at $108K.
    name: "Pro", price: "$15", per: "/mo", featured: true, cta: "Get started",
    perks: ["Everything in Free", "Unlimited watchlist", "Email & push alerts", "Daily market digest", "Portfolio tracking", "No delay on data"],
  },
  {
    name: "Embed", price: "Let's talk", per: "", featured: false, cta: "Contact us",
    perks: ["The globe as a widget", "For blogs & brokers", "Your branding", "Usage analytics", "Priority support"],
  },
];
