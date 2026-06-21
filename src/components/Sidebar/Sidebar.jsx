import { GLOBAL_INDICES } from "../../data/mockData";

const COMMODITY_INDICES = GLOBAL_INDICES.slice(0, 12);
const FX_INDICES = GLOBAL_INDICES.slice(12);

function IndexItem({ item }) {
  return (
    <div className="sidebar__index-item">
      <div className="sidebar__index-row">
        <span className="sidebar__index-name">{item.name}</span>
        <span className={`sidebar__index-change ${item.up ? "up" : "down"}`}>
          {item.change}
        </span>
      </div>
      <div className="sidebar__index-row">
        <span className="sidebar__index-value">{item.value}</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <div className="sidebar__section-title">Equity Indices</div>
        {COMMODITY_INDICES.map((item) => (
          <IndexItem key={item.name} item={item} />
        ))}
      </div>
      <div className="sidebar__section">
        <div className="sidebar__section-title">FX · Commodities · Crypto</div>
        {FX_INDICES.map((item) => (
          <IndexItem key={item.name} item={item} />
        ))}
      </div>
    </aside>
  );
}
