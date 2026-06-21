import { useState } from "react";
import useTerminalStore from "../../store/terminalStore";
import { GLOBAL_INDICES } from "../../data/mockData";
import { getStocksForCountry } from "../../data/stocksData";
import MiniChart from "../Charts/MiniChart";

const EQUITY = GLOBAL_INDICES.filter((_, i) => i < 22);
const FX_COMM_CRYPTO = GLOBAL_INDICES.filter((_, i) => i >= 22);

function IndexItem({ item }) {
  return (
    <div className="sidebar__index-item">
      <div className="sidebar__index-row">
        <span className="sidebar__index-name">{item.name}</span>
        <span className={`sidebar__index-change ${item.up ? "up" : "down"}`}>
          {item.up ? "▲" : "▼"} {item.change}
        </span>
      </div>
      <div className="sidebar__index-value">{item.value}</div>
    </div>
  );
}

function StockItem({ stock, onClick }) {
  const up = stock.changePct >= 0;
  return (
    <div className="sidebar__stock-item" onClick={() => onClick(stock)}>
      <div className="sidebar__stock-left">
        <div className="sidebar__stock-sym">{stock.symbol}</div>
        <div className="sidebar__stock-name">{stock.name.length > 14 ? stock.name.slice(0, 14) + "…" : stock.name}</div>
      </div>
      <div className="sidebar__stock-right">
        <MiniChart data={stock.sparkline} color={up ? "#00ff88" : "#ff2244"} width={52} height={22} />
        <span className={`sidebar__stock-chg ${up ? "up" : "down"}`}>
          {up ? "+" : ""}{stock.changePct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function WatchlistItem({ stock, onRemove, onClick }) {
  const up = stock.changePct >= 0;
  return (
    <div className="sidebar__watch-item">
      <div className="sidebar__stock-left" onClick={() => onClick(stock)} style={{ cursor: "pointer", flex: 1 }}>
        <div className="sidebar__stock-sym">{stock.symbol}</div>
        <div className="sidebar__stock-name">{stock.country}</div>
      </div>
      <div className="sidebar__stock-right">
        <MiniChart data={stock.sparkline} color={up ? "#00ff88" : "#ff2244"} width={44} height={20} />
        <span className={`sidebar__stock-chg ${up ? "up" : "down"}`}>
          {up ? "+" : ""}{stock.changePct.toFixed(2)}%
        </span>
        <button
          className="sidebar__watch-remove"
          onClick={() => onRemove(stock.symbol, stock.country)}
          title="Remove from watchlist"
        >×</button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { sidebarTab, setSidebarTab, selectedCountry, setSelectedStock, watchlist, removeFromWatchlist } =
    useTerminalStore();
  const [indicesSection, setIndicesSection] = useState("equity");

  const countryStocks = selectedCountry ? getStocksForCountry(selectedCountry.code) : [];

  return (
    <aside className="sidebar">
      {/* Tab Bar */}
      <div className="sidebar__tabs">
        {["indices", "stocks", "watchlist"].map((tab) => (
          <button
            key={tab}
            className={`sidebar__tab ${sidebarTab === tab ? "active" : ""}`}
            onClick={() => setSidebarTab(tab)}
          >
            {tab === "indices" ? "📊" : tab === "stocks" ? "🏛️" : "⭐"}
            <span>{tab.toUpperCase()}</span>
            {tab === "watchlist" && watchlist.length > 0 && (
              <span className="sidebar__tab-badge">{watchlist.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── INDICES Tab ── */}
      {sidebarTab === "indices" && (
        <div className="sidebar__content">
          <div className="sidebar__subtabs">
            <button
              className={`sidebar__subtab ${indicesSection === "equity" ? "active" : ""}`}
              onClick={() => setIndicesSection("equity")}
            >
              Equity
            </button>
            <button
              className={`sidebar__subtab ${indicesSection === "fxcc" ? "active" : ""}`}
              onClick={() => setIndicesSection("fxcc")}
            >
              FX · Crypto
            </button>
          </div>
          {indicesSection === "equity" &&
            EQUITY.map((item) => <IndexItem key={item.name} item={item} />)
          }
          {indicesSection === "fxcc" &&
            FX_COMM_CRYPTO.map((item) => <IndexItem key={item.name} item={item} />)
          }
        </div>
      )}

      {/* ── STOCKS Tab ── */}
      {sidebarTab === "stocks" && (
        <div className="sidebar__content">
          {selectedCountry ? (
            <>
              <div className="sidebar__stocks-header">
                <span className="sidebar__section-title">{selectedCountry.name}</span>
                <span className="sidebar__stocks-count">{countryStocks.length} stocks</span>
              </div>
              {countryStocks.length === 0 ? (
                <div className="sidebar__empty">No stocks data for this market</div>
              ) : (
                countryStocks.map((s) => (
                  <StockItem key={s.symbol} stock={s} onClick={setSelectedStock} />
                ))
              )}
            </>
          ) : (
            <div className="sidebar__empty">
              <div className="sidebar__empty-icon">🌍</div>
              Click a country on the globe to view its listed stocks
            </div>
          )}
        </div>
      )}

      {/* ── WATCHLIST Tab ── */}
      {sidebarTab === "watchlist" && (
        <div className="sidebar__content">
          {watchlist.length === 0 ? (
            <div className="sidebar__empty">
              <div className="sidebar__empty-icon">⭐</div>
              Open any stock and click "Add to Watchlist"
            </div>
          ) : (
            watchlist.map((s) => (
              <WatchlistItem
                key={`${s.symbol}-${s.country}`}
                stock={s}
                onRemove={removeFromWatchlist}
                onClick={setSelectedStock}
              />
            ))
          )}
        </div>
      )}
    </aside>
  );
}
