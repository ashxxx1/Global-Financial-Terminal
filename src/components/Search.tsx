import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { allStockSymbols, metaFor, countryList } from "../lib/market";
import { useTerminal } from "../store";

interface Hit { type: "stock" | "country" | "page"; label: string; sub: string; to: string; }

const PAGES: Hit[] = [
  { type: "page", label: "World — 3D globe", sub: "Landing", to: "/" },
  { type: "page", label: "Global Markets", sub: "Indices · FX · Crypto · Commodities", to: "/markets" },
  { type: "page", label: "Compare Charts", sub: "Overlay two stocks · normalized %", to: "/compare" },
  { type: "page", label: "Technology sector", sub: "Sector heat & charts", to: "/sector/technology" },
  { type: "page", label: "Global News Feed", sub: "All countries", to: "/news" },
];

export default function Search() {
  const open = useTerminal((s) => s.searchOpen);
  const setOpen = useTerminal((s) => s.setSearchOpen);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(!open); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return PAGES;
    const out: Hit[] = [];

    // "AAPL vs MSFT" / "aapl/msft" shorthand → compare route
    const vsMatch = q.trim().toUpperCase().match(/^([A-Z0-9.-]+)\s*(?:VS|VS\.|VERSUS|\/|,)\s*([A-Z0-9.-]+)$/);
    if (vsMatch) {
      const [, left, right] = vsMatch;
      if (metaFor(left) && metaFor(right) && left !== right) {
        out.push({
          type: "page",
          label: `${left} vs ${right}`,
          sub: "Compare charts",
          to: `/compare/${left}/${right}`,
        });
      }
    }

    // Command palette: /compare AAPL MSFT
    const cmdCompare = q.trim().toUpperCase().match(/^\/COMPARE\s+([A-Z0-9.-]+)(?:\s+([A-Z0-9.-]+))?$/);
    if (cmdCompare) {
      const [, left, right] = cmdCompare;
      if (right && metaFor(left) && metaFor(right) && left !== right) {
        out.push({ type: "page", label: `${left} vs ${right}`, sub: "Compare charts", to: `/compare/${left}/${right}` });
      } else if (left && metaFor(left)) {
        out.push({ type: "page", label: `Compare ${left}`, sub: "Select second stock", to: `/compare/${left}` });
      }
    }

    for (const c of countryList()) {
      if (c.name.toLowerCase().includes(needle) || c.code.toLowerCase() === needle)
        out.push({ type: "country", label: c.name, sub: `${c.marketIndex} · ${c.currency}`, to: `/country/${c.code}` });
      if (out.length >= 6) break;
    }
    let count = 0;
    for (const s of allStockSymbols()) {
      const m = metaFor(s)!;
      if (s.toLowerCase().includes(needle) || m.name.toLowerCase().includes(needle)) {
        out.push({ type: "stock", label: `${s} — ${m.name}`, sub: `${m.sector} · ${m.country}`, to: `/stock/${s}` });
        if (++count >= 8) break;
      }
    }
    for (const p of PAGES) {
      if (p.label.toLowerCase().includes(needle) || (needle.includes("compare") && p.to === "/compare")) out.push(p);
    }
    return out.slice(0, 12);
  }, [q]);

  if (!open) return null;

  const go = (h: Hit) => { setOpen(false); navigate(h.to); };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,8,14,0.72)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", paddingTop: "12vh" }}
    >
      <div onClick={(e) => e.stopPropagation()} className="panel" style={{ width: "min(620px, 92vw)", height: "fit-content", maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow)" }}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, hits.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
            if (e.key === "Enter" && hits[idx]) go(hits[idx]);
          }}
          placeholder="Search stocks, countries, or type / for commands…"
          style={{
            width: "100%", padding: "14px 16px", background: "transparent", border: "none",
            borderBottom: "1px solid var(--line)", color: "var(--text)", fontSize: 15, outline: "none",
            fontFamily: "var(--sans)",
          }}
        />
        <div style={{ overflowY: "auto" }}>
          {hits.map((h, i) => (
            <button
              key={h.to + h.label}
              onClick={() => go(h)}
              onMouseEnter={() => setIdx(i)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                padding: "10px 16px", background: i === idx ? "var(--blue-dim)" : "none",
                border: "none", cursor: "pointer",
              }}
            >
              <span className="label" style={{ width: 62, color: h.type === "stock" ? "var(--blue)" : h.type === "country" ? "var(--gold)" : "var(--faint)" }}>
                {h.type}
              </span>
              <span style={{ color: "var(--text)", fontSize: 13.5, fontWeight: 600 }}>{h.label}</span>
              <span style={{ marginLeft: "auto", color: "var(--faint)", fontSize: 11 }}>{h.sub}</span>
            </button>
          ))}
          {hits.length === 0 && <div style={{ padding: 16, color: "var(--faint)", fontSize: 13 }}>No matches.</div>}
        </div>
      </div>
    </div>
  );
}
