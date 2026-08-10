import { useEffect, useMemo, useRef, useState } from "react";
import { allStockSymbols, metaFor } from "../../lib/market";

interface Props {
  value: string;
  onChange: (symbol: string) => void;
  exclude?: string;
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Compact ticker typeahead used by the compare picker. */
export default function SymbolSuggest({
  value, onChange, exclude, label, placeholder = "Ticker…", autoFocus,
}: Props) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQ(value); }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hits = useMemo(() => {
    const needle = q.trim().toUpperCase();
    const pool = allStockSymbols().filter((s) => s !== exclude);
    if (!needle) {
      return ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "SPY", "QQQ", "AMD"]
        .filter((s) => pool.includes(s))
        .slice(0, 8);
    }
    const out: string[] = [];
    for (const s of pool) {
      const m = metaFor(s);
      if (s.includes(needle) || (m?.name || "").toUpperCase().includes(needle)) {
        out.push(s);
        if (out.length >= 10) break;
      }
    }
    return out;
  }, [q, exclude]);

  const commit = (sym: string) => {
    onChange(sym.toUpperCase());
    setQ(sym.toUpperCase());
    setOpen(false);
  };

  return (
    <div className="tc-suggest" ref={wrapRef}>
      <label className="label" htmlFor={`suggest-${label}`}>{label}</label>
      <input
        id={`suggest-${label}`}
        className="tc-input"
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value.toUpperCase());
          setOpen(true);
          setIdx(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIdx((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (hits[idx]) commit(hits[idx]);
            else if (q.trim() && allStockSymbols().includes(q.trim().toUpperCase())) {
              commit(q.trim().toUpperCase());
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && hits.length > 0 && (
        <ul className="tc-suggest-list" role="listbox">
          {hits.map((s, i) => {
            const m = metaFor(s);
            return (
              <li key={s} role="option" aria-selected={i === idx}>
                <button
                  type="button"
                  className={`tc-suggest-hit ${i === idx ? "active" : ""}`}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => commit(s)}
                >
                  <span className="mono">{s}</span>
                  <span className="label">{m?.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
