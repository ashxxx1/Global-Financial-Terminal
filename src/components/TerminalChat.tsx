import { useState, useRef, useEffect } from "react";
import { useTerminal } from "../store";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function TerminalChat() {
  const open = useTerminal((s) => s.chatOpen);
  const setOpen = useTerminal((s) => s.setChatOpen);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "I am the Terminal AI. Ask me to summarize earnings, analyze market correlations, or screen for stocks." }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    // Simulate AI typing delay
    setTimeout(() => {
      let aiResponse = "I'm a demo AI. In a production environment, I would connect to OpenAI or Anthropic to process your request.";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes("aapl") || lower.includes("apple")) {
        aiResponse = "Apple (AAPL) recently reported strong services revenue growth, though hardware sales were flat year-over-year. Institutional positioning remains crowded, but the stock continues to test resistance levels. The fundamental P/E of 28x suggests it is priced for execution.";
      } else if (lower.includes("oil") || lower.includes("energy")) {
        aiResponse = "Currently, there is a strong negative correlation between Crude Oil futures and airline equities. Rising energy costs are putting pressure on transport margins, though the broader energy sector (XLE) is seeing positive momentum from geopolitical tailwinds.";
      } else if (lower.includes("screen") || lower.includes("filter")) {
        aiResponse = "Based on your criteria, I've found 3 matching equities: MSFT (Tech), JPM (Financials), and NVDA (Semis). All three have P/E < 40 and revenue growth > 15% over the last 4 quarters.";
      }

      setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 380,
        height: 500,
        background: "rgba(10, 16, 27, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--line-strong)",
        borderRadius: 8,
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Terminal AI <span className="demo-tag">SIM</span></span>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: 18 }}>&times;</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{ 
              background: m.role === "user" ? "var(--blue-dim)" : "var(--navy)",
              color: m.role === "user" ? "var(--blue)" : "var(--text)",
              padding: "8px 12px", 
              borderRadius: 6,
              border: m.role === "ai" ? "1px solid var(--line)" : "none",
              fontSize: 13.5,
              lineHeight: 1.5,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Terminal AI..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14 }}
          autoFocus
        />
      </form>
    </div>
  );
}
