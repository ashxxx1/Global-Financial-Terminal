import { useState, useMemo } from "react";
import useTerminalStore from "../../store/terminalStore";
import { getStocksForCountry } from "../../data/stocksData";
import MiniChart from "../Charts/MiniChart";
import "./MarketTable.css";

const SORT_FIELDS = [
  { key: "symbol", label: "Symbol" },
  { key: "price", label: "Price" },
  { key: "changePct", label: "Chg%" },
  { key: "marketCap", label: "Mkt Cap" },
  { key: "volume", label: "Volume" },
  { key: "pe", label: "P/E" },
];

export default function MarketTable({ countryCode }) {
  const setSelectedStock = useTerminalStore((s) => s.setSelectedStock);
  const [sortKey, setSortKey] = useState("changePct");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");

  const raw = getStocksForCountry(countryCode);

  const stocks = useMemo(() => {
    let list = raw.filter(
      (s) =>
        !search ||
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    list = [...list].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (av == null) av = -Infinity;
      if (bv == null) bv = -Infinity;
      if (typeof av === "string") av = av.replace(/[^0-9.]/g, "") * 1;
      if (typeof bv === "string") bv = bv.replace(/[^0-9.]/g, "") * 1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [raw, sortKey, sortDir, search]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (!raw.length) {
    return (
      <div className="mkt-table__empty">
        <span>No stock data available for this market</span>
      </div>
    );
  }

  return (
    <div className="mkt-table">
      <div className="mkt-table__topbar">
        <span className="mkt-table__count">{stocks.length} stocks listed</span>
        <input
          className="mkt-table__search"
          placeholder="Search symbol or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="mkt-table__wrap">
        <table className="mkt-table__table">
          <thead>
            <tr>
              {SORT_FIELDS.map((f) => (
                <th
                  key={f.key}
                  className={`mkt-table__th ${sortKey === f.key ? "active" : ""}`}
                  onClick={() => handleSort(f.key)}
                >
                  {f.label}
                  {sortKey === f.key && (
                    <span className="mkt-table__sort-arrow">{sortDir === "asc" ? " ▲" : " ▼"}</span>
                  )}
                </th>
              ))}
              <th className="mkt-table__th">7D</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const up = stock.changePct >= 0;
              return (
                <tr
                  key={stock.symbol}
                  className={`mkt-table__row ${up ? "up" : "down"}`}
                  onClick={() => setSelectedStock(stock)}
                >
                  <td className="mkt-table__td mkt-table__td--symbol">
                    <div className="mkt-table__sym">{stock.symbol}</div>
                    <div className="mkt-table__sname">{stock.name.length > 18 ? stock.name.slice(0, 18) + "…" : stock.name}</div>
                  </td>
                  <td className="mkt-table__td mkt-table__td--price">
                    {stock.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`mkt-table__td mkt-table__td--change ${up ? "up" : "down"}`}>
                    <span className="mkt-table__chg-badge">
                      {up ? "▲" : "▼"} {Math.abs(stock.changePct).toFixed(2)}%
                    </span>
                  </td>
                  <td className="mkt-table__td mkt-table__td--muted">{stock.marketCap}</td>
                  <td className="mkt-table__td mkt-table__td--muted">{stock.volume}</td>
                  <td className="mkt-table__td mkt-table__td--muted">{stock.pe ?? "—"}</td>
                  <td className="mkt-table__td mkt-table__td--chart">
                    <MiniChart
                      data={stock.sparkline}
                      color={up ? "#00ff88" : "#ff2244"}
                      width={72}
                      height={28}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
