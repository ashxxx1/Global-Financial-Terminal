import { GLOBAL_INDICES } from "../../data/mockData";

export default function Ticker() {
  const items = [...GLOBAL_INDICES, ...GLOBAL_INDICES];

  return (
    <div className="nx-ticker">
      <div className="nx-ticker__lane-label">SIGNAL</div>
      <div className="nx-ticker__track-wrap">
        <div className="nx-ticker__track">
          {items.map((item, i) => (
            <div key={i} className="nx-ticker__item">
              <span className="nx-ticker__dot" />
              <span className="nx-ticker__name">{item.name}</span>
              <span className="nx-ticker__value">{item.value}</span>
              <span className={`nx-ticker__change ${item.up ? "up" : "down"}`}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="nx-ticker__pulse">
        <span className="nx-ticker__live-dot" />
        LIVE
      </div>
    </div>
  );
}
