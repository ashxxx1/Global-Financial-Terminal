/**
 * MeridianTerminalV2.jsx — Complete UI Redesign
 *
 * Full-featured terminal with:
 * - Tab-based navigation
 * - Clickable countries sidebar
 * - Globe + data panels
 * - Professional layout
 */

import { useState, useEffect } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import GlobeVis from './GlobeVis';
import { intelApi } from '../../services/intelApi';

const COLORS = {
  bg: '#050608',
  bgAlt: '#0a0e1a',
  glass: 'rgba(9,11,16,0.92)',
  border: 'rgba(255,255,255,0.08)',
  cyan: '#3ec6ff',
  green: '#39d6a3',
  red: '#ff5b68',
  text: '#f2f4f8',
  textMuted: '#8a93a3',
  textDimmed: '#5b6472',
};

const TABS = [
  { id: 'markets', label: '◎ MARKETS', icon: '📊' },
  { id: 'macro', label: '⚡ MACRO', icon: '📈' },
  { id: 'risk', label: '△ RISK', icon: '⚠️' },
  { id: 'news', label: '📡 NEWS', icon: '📰' },
  { id: 'fx', label: '💱 FX', icon: '💹' },
];

function MeridianTerminalV2({ selectedCountry, onCountrySelect, countries = [] }) {
  const [activeTab, setActiveTab] = useState('markets');
  const [panelTab, setPanelTab] = useState('overview');
  const [searchText, setSearchText] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [economyData, setEconomyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clockStr, setClockStr] = useState('00:00:00');
  const [globalData, setGlobalData] = useState(null);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setClockStr(`${h}:${m}:${s}`);
    }, 1000);

    // Load global data
    intelApi.recent().then(data => setGlobalData(data)).catch(() => {});

    return () => clearInterval(timer);
  }, []);

  // Load data when country selected
  useEffect(() => {
    if (!selectedCountry) return;

    setLoading(true);
    const countryCode = selectedCountry.properties?.ISO_A2 || selectedCountry.code;

    Promise.all([
      intelApi.markets(countryCode),
      intelApi.economy(countryCode),
    ])
      .then(([m, e]) => {
        setMarketData(m);
        setEconomyData(e);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCountry]);

  const filteredCountries = searchText
    ? countries.filter(c =>
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.code.toLowerCase().includes(searchText.toLowerCase())
      )
    : countries;

  const countryCode = selectedCountry?.properties?.ISO_A2 || selectedCountry?.code || '';
  const countryName = selectedCountry?.properties?.ADMIN || selectedCountry?.name || '';
  const indexValue = marketData?.indices?.[0]?.price || 7575.39;
  const indexChange = marketData?.indices?.[0]?.changePct || 0.42;
  const fxValue = marketData?.indices?.[1]?.price || 1.0876;
  const fxChange = marketData?.indices?.[1]?.changePct || 0.15;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'markets':
        return (
          <div style={{ padding: '20px', color: COLORS.text }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Global Markets</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { name: 'S&P 500', value: 5847.23, change: 1.24 },
                { name: 'NIKKEI 225', value: 28456.12, change: 0.79 },
                { name: 'EUROSTOXX', value: 4892.45, change: -0.12 },
                { name: 'FTSE 100', value: 7654.32, change: 0.45 },
              ].map((market, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '6px' }}>{market.name}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{market.value.toLocaleString()}</div>
                  <div style={{ color: market.change >= 0 ? COLORS.green : COLORS.red, fontSize: '12px', marginTop: '4px' }}>
                    {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'macro':
        return (
          <div style={{ padding: '20px', color: COLORS.text }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Macro Indicators</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'USD Index', value: '104.25', change: 0.15 },
                { label: 'Crude Oil', value: '$78.45/bbl', change: 1.25 },
                { label: 'Gold', value: '$2387/oz', change: -0.35 },
                { label: 'Bitcoin', value: '$67234', change: 2.14 },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.value}</div>
                  <div style={{ color: item.change >= 0 ? COLORS.green : COLORS.red, fontSize: '12px', marginTop: '4px' }}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'risk':
        return (
          <div style={{ padding: '20px', color: COLORS.text }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Risk Monitor</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Market Volatility', level: 'ELEVATED', pct: 78 },
                { name: 'Credit Risk', level: 'NORMAL', pct: 45 },
                { name: 'Geopolitical', level: 'HIGH', pct: 85 },
                { name: 'Liquidity', level: 'NORMAL', pct: 35 },
              ].map((risk, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ color: COLORS.text, fontWeight: '600' }}>{risk.name}</div>
                    <div style={{ color: risk.level === 'HIGH' ? COLORS.red : risk.level === 'ELEVATED' ? '#e5aa52' : COLORS.green, fontSize: '11px', fontWeight: 'bold' }}>
                      {risk.level}
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${risk.pct}%`, height: '100%', background: risk.pct > 70 ? COLORS.red : risk.pct > 50 ? '#e5aa52' : COLORS.green }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'news':
        return (
          <div style={{ padding: '20px', color: COLORS.text }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Market News</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { headline: 'Central bank signals policy easing', sentiment: 'BULLISH', time: '2 hours ago' },
                { headline: 'Tech sector shows strong earnings growth', sentiment: 'BULLISH', time: '4 hours ago' },
                { headline: 'Oil prices surge on supply concerns', sentiment: 'NEUTRAL', time: '6 hours ago' },
                { headline: 'Banking stocks under pressure', sentiment: 'BEARISH', time: '8 hours ago' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>{item.headline}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ color: item.sentiment === 'BULLISH' ? COLORS.green : item.sentiment === 'BEARISH' ? COLORS.red : COLORS.textMuted }}>
                      {item.sentiment}
                    </div>
                    <div style={{ color: COLORS.textDimmed }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'fx':
        return (
          <div style={{ padding: '20px', color: COLORS.text }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>FX Pairs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { pair: 'EUR/USD', rate: 1.0876, change: 0.15 },
                { pair: 'GBP/USD', rate: 1.2654, change: 0.32 },
                { pair: 'USD/JPY', rate: 149.45, change: -0.28 },
                { pair: 'AUD/USD', rate: 0.6654, change: 0.12 },
              ].map((pair, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '6px' }}>{pair.pair}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{pair.rate.toFixed(4)}</div>
                  <div style={{ color: pair.change >= 0 ? COLORS.green : COLORS.red, fontSize: '12px', marginTop: '4px' }}>
                    {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPanelTab = () => {
    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>;

    switch (panelTab) {
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DataCard title="INDEX" value={indexValue.toLocaleString()} change={indexChange} />
            <DataCard title="FX - USD" value={fxValue.toFixed(4)} change={fxChange} />
            <div style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '8px' }}>AI SENTIMENT</div>
              <div style={{ color: indexChange >= 0 ? COLORS.green : COLORS.red, fontSize: '18px', fontWeight: 'bold' }}>
                {indexChange >= 0 ? 'BULLISH' : 'BEARISH'}
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '6px' }}>
                82% confidence - Strong catalysts
              </div>
            </div>
          </div>
        );

      case 'news':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Policy easing signals', 'Strong earnings growth', 'Market resilience']
              .map((headline, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ color: COLORS.text, fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>{headline}</div>
                  <div style={{ color: COLORS.green, fontSize: '11px' }}>BULLISH 85%</div>
                </div>
              ))}
          </div>
        );

      case 'markets':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Technology +2.34%', 'Banking -0.85%', 'Energy +1.12%', 'Healthcare +0.45%']
              .map((sector, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: COLORS.text, fontSize: '12px' }}>{sector.split('+')[0].split('-')[0]}</div>
                  <div style={{ color: sector.includes('+') ? COLORS.green : COLORS.red, fontWeight: 'bold', fontSize: '12px' }}>
                    {sector.split(' ')[1]}
                  </div>
                </div>
              ))}
          </div>
        );

      case 'economy':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'GDP', value: economyData?.indicators?.gdpGrowth?.value || 2.2, unit: '%' },
              { label: 'INFLATION', value: economyData?.indicators?.inflation?.value || 2.9, unit: '%' },
              { label: 'RATE', value: economyData?.indicators?.rate?.value || 5.2, unit: '%' },
              { label: 'RATING', value: 'A+', unit: '' },
            ].map((metric, i) => (
              <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ color: COLORS.textDimmed, fontSize: '10px', marginBottom: '6px' }}>{metric.label}</div>
                <div style={{ color: COLORS.text, fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}{metric.unit}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      {/* Top Header */}
      <div style={{ height: '60px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', background: COLORS.bgAlt }}>
        <div>
          <div style={{ color: COLORS.text, fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.15em' }}>MERIDIAN</div>
          <div style={{ color: COLORS.textDimmed, fontSize: '10px' }}>GLOBAL INTELLIGENCE TERMINAL</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'monospace', color: COLORS.textMuted }}>
          <div style={{ fontSize: '12px' }}>{clockStr} UTC</div>
          <div style={{ color: COLORS.green, fontSize: '10px' }}>● LIVE</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Countries */}
        <div style={{ width: '280px', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', background: COLORS.bgAlt, overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px', borderBottom: `1px solid ${COLORS.border}` }}>
            <input
              type="text"
              placeholder="Search countries..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                color: COLORS.text,
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Countries List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredCountries.map((country, i) => (
              <button
                key={i}
                onClick={() => {
                  onCountrySelect(country);
                  setPanelTab('overview');
                }}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  background: selectedCountry?.code === country.code ? 'rgba(62,198,255,0.15)' : 'transparent',
                  border: 'none',
                  borderLeft: selectedCountry?.code === country.code ? `3px solid ${COLORS.cyan}` : `3px solid transparent`,
                  borderBottom: `1px solid ${COLORS.border}`,
                  color: selectedCountry?.code === country.code ? COLORS.cyan : COLORS.text,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedCountry?.code === country.code ? '600' : '400',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedCountry?.code !== country.code) {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCountry?.code !== country.code) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{country.name}</span>
                  <span style={{ color: COLORS.textDimmed, fontSize: '11px' }}>{country.code}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Globe or Data */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgAlt, overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id ? `rgba(62,198,255,0.1)` : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${COLORS.cyan}` : 'none',
                  color: activeTab === tab.id ? COLORS.cyan : COLORS.textMuted,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) e.target.style.color = COLORS.text;
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) e.target.style.color = COLORS.textMuted;
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content or Globe */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {selectedCountry ? (
              // Globe View
              <div style={{ flex: 1, position: 'relative' }}>
                <GlobeVis
                  selectedCountry={selectedCountry}
                  onCountryClick={onCountrySelect}
                  timeframe="1D"
                />
              </div>
            ) : (
              // Data Grid View
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {renderTabContent()}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Data Panel */}
        {selectedCountry && (
          <div style={{ width: '340px', borderLeft: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', background: COLORS.bgAlt, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '4px' }}>{countryCode}</div>
                <div style={{ color: COLORS.text, fontSize: '18px', fontWeight: 'bold' }}>{countryName}</div>
              </div>
              <button
                onClick={() => onCountrySelect(null)}
                style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            {/* Panel Tabs */}
            <div style={{ display: 'flex', gap: '12px', padding: '0 16px', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto' }}>
              {['overview', 'news', 'markets', 'economy'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  style={{
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    color: panelTab === tab ? COLORS.cyan : COLORS.textDimmed,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderBottom: panelTab === tab ? `2px solid ${COLORS.cyan}` : 'none',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (panelTab !== tab) e.target.style.color = COLORS.text;
                  }}
                  onMouseLeave={(e) => {
                    if (panelTab !== tab) e.target.style.color = COLORS.textDimmed;
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Status */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, fontSize: '10px', display: 'flex', gap: '12px' }}>
              <span style={{ color: COLORS.green }}>● MARKET OPEN</span>
              <span style={{ color: indexChange >= 0 ? COLORS.green : COLORS.red }}>
                {indexChange >= 0 ? 'BULLISH' : 'BEARISH'}
              </span>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {renderPanelTab()}
            </div>
          </div>
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

function DataCard({ title, value, change }) {
  return (
    <div style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '6px' }}>{title}</div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
        <div style={{ color: COLORS.text, fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
        <div style={{ color: change >= 0 ? COLORS.green : COLORS.red, fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default MeridianTerminalV2;

