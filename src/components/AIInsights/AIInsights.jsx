import { useState, useEffect, useRef } from "react";
import { generateNarrative, generateStockNarrative } from "./narrativeData";

function TypewriterText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(false);
      return;
    }
    idxRef.current = 0;
    const interval = setInterval(() => {
      idxRef.current += 1;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => {
      clearInterval(interval);
      setDisplayed("");
      setDone(false);
    };
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="ai-cursor">▋</span>}
    </span>
  );
}

export default function AIInsights({ country, stock }) {
  const [visible, setVisible] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (country) {
      const timer = setTimeout(() => {
        const text = generateNarrative(country.code, country.sentiment || "neutral");
        setNarrative(text);
        setKey((k) => k + 1);
        setVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    } else if (stock) {
      const timer = setTimeout(() => {
        const text = generateStockNarrative(stock);
        setNarrative(text);
        setKey((k) => k + 1);
        setVisible(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setNarrative("");
    }
  }, [country, stock]);

  if (!visible || !narrative) return null;

  const sentiment = country?.sentiment || (stock?.changePct >= 0 ? "bullish" : "bearish");

  return (
    <div className={`ai-insights ai-insights--${sentiment}`}>
      <div className="ai-insights__header">
        <div className="ai-insights__icon">🧠</div>
        <div className="ai-insights__title">Terminal Intelligence</div>
        <div className="ai-insights__badge">AI</div>
        <div className="ai-insights__live">
          <span className="ai-insights__live-dot" />
          LIVE
        </div>
      </div>
      <p className="ai-insights__text" key={key}>
        <TypewriterText text={narrative} speed={14} />
      </p>
      <div className="ai-insights__footer">
        <span className={`ai-insights__sentiment ai-insights__sentiment--${sentiment}`}>
          {sentiment === "bullish" ? "▲ BULLISH" : sentiment === "bearish" ? "▼ BEARISH" : "◆ NEUTRAL"}
        </span>
        <span className="ai-insights__time">
          {new Date().toUTCString().slice(17, 25)} UTC
        </span>
      </div>
    </div>
  );
}
