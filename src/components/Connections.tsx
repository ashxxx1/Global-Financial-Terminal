import { useNavigate } from "react-router-dom";
import type { GraphNode } from "../lib/graph";

const TYPE_COLOR: Record<GraphNode["type"], string> = {
  country: "var(--gold)",
  stock: "var(--blue)",
  sector: "var(--up)",
  index: "var(--muted)",
  fx: "var(--muted)",
};

/** Knowledge-graph neighborhood: every chip is a typed edge; navigable ones route. */
export default function Connections({ nodes }: { nodes: GraphNode[] }) {
  const navigate = useNavigate();
  if (nodes.length === 0) return null;
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <div className="panel-head">
        <span className="panel-title">Connections</span>
        <span className="label">knowledge graph</span>
      </div>
      <div className="panel-body" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {nodes.map((n, i) => (
          <button
            key={n.type + n.label + i}
            className="chip"
            disabled={!n.to}
            onClick={() => n.to && navigate(n.to)}
            style={{ color: TYPE_COLOR[n.type], borderColor: "var(--line-strong)", cursor: n.to ? "pointer" : "default", opacity: n.to ? 1 : 0.85 }}
            title={n.type}
          >
            <span className="label" style={{ fontSize: 7.5, marginRight: 6, color: "var(--faint)" }}>{n.type}</span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
