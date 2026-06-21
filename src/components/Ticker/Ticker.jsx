import { GLOBAL_INDICES } from "../../data/mockData";

export default function Ticker() {
  // Duplicate for seamless loop
  const items = [...GLOBAL_INDICES, ...GLOBAL_INDICES];

  return (
    <div className="ticker">
      <div className="ticker__track">
        {items.map((item, i) => (
          <div key={i} className="ticker__item">
            <span className="ticker__name">{item.name}</span>
            <span className="ticker__value">{item.value}</span>
            <span className={`ticker__change ${item.up ? "up" : "down"}`}>
              {item.change}
            </span>
            <span style={{ color: "var(--border-subtle)", fontSize: 10 }}>|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
