import { lazy, Suspense } from "react";
import { track } from "../lib/analytics";
import { useReveal } from "../lib/useReveal";
import { useSeo } from "../lib/seo";
import { SUPPORT_MAILTO } from "../lib/support";
import LiveMarketStrip from "../components/LiveMarketStrip";
import LandingStage from "../components/LandingStage";

// The globe is the pitch and the heaviest thing in the bundle — lazy-load it so
// the headline and CTAs paint immediately.
const Globe3D = lazy(() => import("../components/Globe3D"));

/**
 * Public landing page.
 *
 * Redesigned around ui-ux-pro-max's "Immersive/Interactive Experience" pattern:
 * full-screen interactive element → guided tour → benefits → CTA. The previous
 * version was the standard template — copy left, boxed screenshot right, six
 * identical feature cards, pricing — which described a 3D markets terminal
 * without ever showing one.
 *
 * The globe is now the page: full-bleed behind the headline, then pinned while
 * a scroll-driven tour repaints it (see LandingStage). Benefits land afterwards
 * as a bento of unequal tiles rather than a six-up grid, so the eye has a path
 * through them instead of six things shouting equally.
 */
export default function Landing({ onGetStarted }: { onGetStarted: (mode?: "signin" | "signup") => void }) {
  useSeo({
    title: "GFT Terminal — The World's Economy, On One Screen",
    description:
      "A living 3D map of global markets and the news that moves them. Live indices, FX and crypto across 68 countries. Free to explore.",
    path: "/",
  });

  const bentoRef = useReveal<HTMLDivElement>(".bento-tile");
  const pricingRef = useReveal<HTMLDivElement>(".lp-plan");
  const finalRef = useReveal<HTMLElement>();

  const start = (mode: "signin" | "signup", placement: string) => {
    track("upgrade_clicked", { placement });
    onGetStarted(mode);
  };

  return (
    <div className="lp lp2">
      {/* ── Act I — the world, full bleed ───────────────────────────── */}
      <section className="hero2">
        <div className="hero2-globe" aria-hidden>
          <Suspense fallback={<div className="lp-globe-skeleton" />}>
            <Globe3D overlay="market" quakes={[]} onHover={() => {}} onCountryClick={() => {}} />
          </Suspense>
        </div>
        <div className="hero2-scrim" aria-hidden />

        <header className="lp-nav hero2-nav">
          <div className="auth-brand">
            <span className="auth-mark" aria-hidden />
            GFT<span style={{ color: "var(--gold)" }}>·</span>TERMINAL
          </div>
          <nav className="lp-nav-links">
            <a href="#tour">Tour</a>
            <a href="#pricing">Pricing</a>
            <button className="lp-nav-signin" onClick={() => start("signin", "nav")}>Sign in</button>
            <button className="btn-primary sm" onClick={() => start("signup", "nav")}>Get started</button>
          </nav>
        </header>

        <div className="hero2-copy">
          <div className="lp-badge">
            <span className="pulse-dot" style={{ background: "var(--up)" }} />
            LIVE · 68 COUNTRIES
          </div>
          <h1 className="hero2-h1">
            <span className="hero-shine">The world's economy,</span>
            <span className="live-glow">on one screen.</span>
          </h1>
          <p className="hero2-lead">
            A living 3D map of global markets — and the news that moves them,
            mapped to the countries and sectors they actually hit.
          </p>
          <div className="lp-cta">
            <button className="btn-primary lg" onClick={() => start("signup", "hero")}>
              Start free →
            </button>
            <button className="btn-ghost" onClick={() => start("signin", "hero")}>
              I have an account
            </button>
          </div>

          {/* Proof beats prose: real prices, ticking, above the fold. */}
          <LiveMarketStrip />
        </div>

        <a className="hero2-scroll" href="#tour" aria-label="Scroll to the tour">
          <span>SCROLL</span>
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <rect x="1" y="1" width="12" height="20" rx="6" />
            <path className="hero2-scroll-dot" d="M7 6v3" strokeLinecap="round" />
          </svg>
        </a>
      </section>

      {/* ── Act II — the guided tour, globe pinned ──────────────────── */}
      <div id="tour" />
      <LandingStage />

      {/* ── Act III — capabilities as a bento, not six equal cards ──── */}
      <section className="lp-section" id="features">
        <div className="lp-section-head">
          <h2>Everything else you'd expect. Sharper.</h2>
        </div>
        <div className="bento" ref={bentoRef}>
          {BENTO.map((b) => (
            <div
              className={`bento-tile ${b.span}`}
              key={b.title}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
            >
              <div className="bento-icon" style={{ color: b.color }}><FeatureIcon name={b.icon} /></div>
              <b>{b.title}</b>
              <p>{b.body}</p>
              {b.foot && <span className="bento-foot">{b.foot}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Act IV — honesty, price, CTA ────────────────────────────── */}
      <section className="lp-honesty">
        <p>
          <b>Straight talk on data.</b> Crypto and FX are live. Equity prices are
          delayed, index levels are illustrative, and anything marked <em>DEMO</em> is
          a feature we're still building — not real analysis. Every number on
          screen carries its own source label. Nothing here is investment advice.
        </p>
      </section>

      <section className="lp-section" id="pricing">
        <div className="lp-section-head">
          <h2>Free to explore. Upgrade when it earns its keep.</h2>
        </div>
        <div className="lp-pricing" ref={pricingRef}>
          {PLANS.map((p) => (
            <div className={`lp-plan ${p.featured ? "featured" : ""}`} key={p.name}>
              {p.featured && <div className="lp-plan-tag">MOST POPULAR</div>}
              <div className="lp-plan-name">{p.name}</div>
              <div className="lp-plan-price">{p.price}<span>{p.per}</span></div>
              <ul>{p.perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>
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

      <section className="lp-final" ref={finalRef}>
        <h2>See the whole world's economy move.</h2>
        <button className="btn-primary lg" onClick={() => start("signup", "footer")}>
          Create your free terminal →
        </button>
        <footer className="lp-footer">
          © {new Date().getFullYear()} GFT Terminal · Informational only, not investment advice
          {" · "}<a href="/terms" style={{ color: "var(--muted)" }}>Terms</a>
          {" · "}<a href="/privacy" style={{ color: "var(--muted)" }}>Privacy</a>
          {" · "}<a href="/data-sources" style={{ color: "var(--muted)" }}>Data sources</a>
          {" · "}<a href={SUPPORT_MAILTO} style={{ color: "var(--muted)" }}>Contact</a>
        </footer>
      </section>
    </div>
  );
}

/**
 * Bento tiles. Sizes are deliberately unequal — `wide` for the two that carry
 * the pitch, `tall` for the one with a visual payload — so the grid reads as a
 * composition instead of six interchangeable boxes.
 */
const BENTO = [
  { icon: "signal", color: "var(--gold)", span: "wide", title: "News → signals",
    body: "Headlines mapped to the sectors and stocks they actually move, so you get the 'so what', not just the story.",
    foot: "Google News · classified in-house" },
  { icon: "heatmap", color: "#a08cff", span: "tall", title: "Sector heat map",
    body: "The whole market's mood in one grid — which sectors are hot, which are bleeding.",
    foot: "13 sectors, live" },
  { icon: "sessions", color: "var(--cyan)", span: "", title: "Sessions & breadth",
    body: "Who's trading right now, and whether a move is broad or three megacaps carrying the index.", foot: "" },
  { icon: "star", color: "var(--up)", span: "", title: "Watchlist that follows you",
    body: "Star anything; it syncs to your account across every device.", foot: "" },
  { icon: "bell", color: "var(--down)", span: "wide", title: "Alerts that reach you",
    body: "Get told the moment a level breaks — visible, editable and deletable, not fire-and-forget.",
    foot: "Email & push coming" },
];

/** Drawn line icons at a single 1.6 stroke — no emoji, no placeholder glyphs. */
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
