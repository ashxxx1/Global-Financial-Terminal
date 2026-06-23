import useTerminalStore from "../../store/terminalStore";
import { searchStocks } from "../../data/stocksData";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function StockMention({ symbol }) {
  const { setSelectedStock } = useTerminalStore();
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const stocks = searchStocks(symbol);
  const stock = stocks.find((s) => s.symbol === symbol) || stocks[0];
  
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (stock) {
      setSelectedStock(stock);
      if (location.pathname.startsWith("/forum") || location.pathname.startsWith("/social")) {
        navigate("/");
      }
    }
  }

  return (
    <span
      className={`stock-mention ${hover ? "hover" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleClick}
      title={stock ? `${stock.name} — Click to open` : symbol}
    >
      ${symbol}
      {hover && stock && (
        <span className="stock-mention__tooltip">
          <span className="stock-mention__tooltip-sym">{stock.symbol}</span>
          <span className="stock-mention__tooltip-price">${stock.price?.toFixed(2)}</span>
          <span className={`stock-mention__tooltip-chg ${stock.changePct >= 0 ? "up" : "down"}`}>
            {stock.changePct >= 0 ? "+" : ""}{stock.changePct?.toFixed(2)}%
          </span>
        </span>
      )}
    </span>
  );
}
