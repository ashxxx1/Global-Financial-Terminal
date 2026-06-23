import { useState, useEffect, useRef } from "react";
import useTerminalStore from "../../store/terminalStore";

// FX Rate data
const BASE_RATES = {
  EUR: 1.0850, GBP: 1.2720, JPY: 0.00655, AUD: 0.6580, CAD: 0.7340,
  CHF: 1.1020, CNY: 0.1378, INR: 0.01197, MXN: 0.0587, BRL: 0.1923,
  KRW: 0.000725, SGD: 0.7420, HKD: 0.1278, NOK: 0.0930, SEK: 0.0925,
  USD: 1.0,
};

const PAIRS = [
  { from: "EUR", to: "USD", label: "EUR/USD" },
  { from: "GBP", to: "USD", label: "GBP/USD" },
  { from: "USD", to: "JPY", label: "USD/JPY" },
  { from: "USD", to: "CHF", label: "USD/CHF" },
  { from: "AUD", to: "USD", label: "AUD/USD" },
  { from: "USD", to: "CAD", label: "USD/CAD" },
  { from: "USD", to: "CNY", label: "USD/CNY" },
  { from: "USD", to: "INR", label: "USD/INR" },
  { from: "EUR", to: "GBP", label: "EUR/GBP" },
  { from: "EUR", to: "JPY", label: "EUR/JPY" },
  { from: "GBP", to: "JPY", label: "GBP/JPY" },
  { from: "USD", to: "MXN", label: "USD/MXN" },
];

function computeRate(from, to) {
  const fromRate = BASE_RATES[from] || 1;
  const toRate = BASE_RATES[to] || 1;
  return fromRate / toRate;
}

// Strength index: 0-100 for each currency
const STRENGTH_VALUES = {
  USD: 72, EUR: 58, GBP: 63, JPY: 41, AUD: 52, CAD: 55,
  CHF: 78, CNY: 48, INR: 39, MXN: 44, BRL: 36, NOK: 53, SEK: 50, SGD: 67, HKD: 51,
};

const STRENGTH_ORDER = Object.entries(STRENGTH_VALUES).sort((a, b) => b[1] - a[1]);

function useLiveRates() {
  const [rates, setRates] = useState(() => PAIRS.map((p) => ({
    ...p,
    rate: computeRate(p.from, p.to),
    change: (Math.random() - 0.5) * 0.006,
    pip: (Math.random() - 0.5) * 0.0003,
  })));

  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) =>
        prev.map((r) => {
          const drift = (Math.random() - 0.5) * 0.0004;
          const newRate = Math.max(0.001, r.rate + drift);
          const pip = drift;
          return { ...r, rate: newRate, pip };
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return rates;
}

function CurrencyConverter() {
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const CURRENCIES = Object.keys(BASE_RATES);
  const rate = computeRate(from, to);
  const result = parseFloat(amount || 0) * rate;

  return (
    <div className="fx-converter">
      <div className="fx-converter__title">Currency Converter</div>
      <div className="fx-converter__row">
        <input
          className="fx-converter__input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
        />
        <select className="fx-converter__select" value={from} onChange={(e) => setFrom(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="fx-converter__arrow">⇅</div>
      <div className="fx-converter__row">
        <div className="fx-converter__result">{isNaN(result) ? "—" : result.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
        <select className="fx-converter__select" value={to} onChange={(e) => setTo(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="fx-converter__rate">
        1 {from} = {rate.toFixed(5)} {to}
      </div>
    </div>
  );
}

export default function FXDashboard({ onClose }) {
  const rates = useLiveRates();

  return (
    <div className="fx-dashboard">
      <div className="fx-dashboard__header">
        <div className="fx-dashboard__title">🌐 FX Dashboard — Live Cross Rates</div>
        <button className="fx-dashboard__close" onClick={onClose}>✕</button>
      </div>

      <div className="fx-dashboard__layout">
        {/* Left: Rates Table */}
        <div className="fx-dashboard__rates-section">
          <div className="fx-dashboard__section-title">Major Pairs</div>
          <table className="fx-dashboard__rates-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Rate</th>
                <th>Change</th>
                <th>Pip Move</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => {
                const up = r.pip >= 0;
                return (
                  <tr key={r.label} className={`fx-dashboard__rate-row ${up ? "up" : "down"}`}>
                    <td className="fx-dashboard__pair-label">{r.label}</td>
                    <td className="fx-dashboard__rate-value">{r.rate.toFixed(5)}</td>
                    <td className={`fx-dashboard__rate-change ${up ? "up" : "down"}`}>
                      {up ? "+" : ""}{((r.pip / r.rate) * 100).toFixed(3)}%
                    </td>
                    <td className={`fx-dashboard__pip ${up ? "up" : "down"}`}>
                      {up ? "+" : ""}{(r.pip * 10000).toFixed(1)} pips
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right: Strength + Converter */}
        <div className="fx-dashboard__right">
          <div className="fx-dashboard__strength-section">
            <div className="fx-dashboard__section-title">Currency Strength Index</div>
            {STRENGTH_ORDER.slice(0, 10).map(([currency, strength]) => (
              <div key={currency} className="fx-dashboard__strength-row">
                <span className="fx-dashboard__strength-label">{currency}</span>
                <div className="fx-dashboard__strength-track">
                  <div
                    className="fx-dashboard__strength-bar"
                    style={{
                      width: `${strength}%`,
                      background: strength >= 65 ? "var(--accent-green)" : strength >= 45 ? "var(--accent-amber)" : "var(--accent-red)",
                    }}
                  />
                </div>
                <span className="fx-dashboard__strength-val">{strength}</span>
              </div>
            ))}
          </div>
          <CurrencyConverter />
        </div>
      </div>

      <div className="fx-dashboard__note">
        ⚡ Rates update every 2.5 seconds with simulated live pip movements · Source: Simulated interbank rates
      </div>
    </div>
  );
}
