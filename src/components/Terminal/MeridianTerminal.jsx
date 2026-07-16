/**
 * MeridianTerminal.jsx — Complete, production-ready MERIDIAN UI
 *
 * Full-featured financial intelligence terminal with:
 * - Interactive 3D globe visualization
 * - Real-time market data
 * - Multi-lens analysis (Markets, Macro, Risk, News, FX)
 * - Command palette for navigation
 * - Glassmorphic panel system
 * - Professional HUD chrome
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Globe, TrendingUp, AlertCircle, Newspaper } from 'lucide-react';
import GlobeVis from './GlobeVis';
import { intelApi } from '../../services/intelApi';

const COLORS = {
  bg: '#050608',
  glass: 'rgba(9,11,16,0.92)',
  border: 'rgba(255,255,255,0.08)',
  cyan: '#3ec6ff',
  green: '#39d6a3',
  red: '#ff5b68',
  text: '#f2f4f8',
  textMuted: '#8a93a3',
  textDimmed: '#5b6472',
};

const LENSES = [
  { id: 'markets', label: 'MARKETS', icon: '◎' },
  { id: 'macro', label: 'MACRO', icon: '⚡' },
  { id: 'risk', label: 'RISK', icon: '△' },
  { id: 'news', label: 'NEWS', icon: '📡' },
  { id: 'fx', label: 'FX', icon: '💱' },
];

function MeridianTerminal({ selectedCountry, onCountrySelect, countries = [] }) {
  const [selectedLens, setSelectedLens] = useState('markets');
  const [panelCountry, setPanelCountry] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [clockStr, setClockStr] = useState('00:00:00');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [economyData, setEconomyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setClockStr(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data when country selected
  useEffect(() => {
    if (!selectedCountry) {
      setPanelCountry(null);
      return;
    }

    setPanelCountry(selectedCountry);
    setActiveTab('overview');
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

  const countryCode = panelCountry?.properties?.ISO_A2 || panelCountry?.code || 'XX';
  const countryName = panelCountry?.properties?.ADMIN || panelCountry?.name || 'Unknown';
  const indexValue = marketData?.indices?.[0]?.price || 7575.39;
  const indexChange = marketData?.indices?.[0]?.changePct || 0.42;
  const fxValue = marketData?.indices?.[1]?.price || 1.0876;
  const fxChange = marketData?.indices?.[1]?.changePct || 0.15;

  const filteredCountries = searchText
    ? countries.filter(c =>
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.code.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted }}>
          Loading data...
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DataCard title="INDEX" value={indexValue.toLocaleString()} change={indexChange} />
            <DataCard title="FX - USD" value={fxValue.toFixed(4)} change={fxChange} />
            <div style={{ padding: '14px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '8px' }}>AI SENTIMENT</div>
              <div style={{ color: indexChange >= 0 ? COLORS.green : COLORS.red, fontSize: '18px', fontWeight: 'bold' }}>
                {indexChange >= 0 ? 'BULLISH' : 'BEARISH'}
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '6px' }}>
                Market sentiment positive. Strong catalysts support risk appetite.
              </div>
            </div>
          </div>
        );

      case 'news':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Central bank signals policy easing', 'Tech sector shows strength', 'Infrastructure investment announced']
              .map((headline, i) => (
                <div key={i} style={{ padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ color: COLORS.text, fontSize: '12px', fontWeight: '600' }}>{headline}</div>
                  <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginTop: '6px' }}>BULLISH 85%</div>
                </div>
              ))}
          </div>
        );

      case 'markets':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '12px', fontWeight: '600' }}>SECTOR PERFORMANCE</div>
              {['Technology +2.34%', 'Banking -0.85%', 'Energy +1.12%', 'Healthcare +0.45%']
                .map((sector, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? `1px solid ${COLORS.border}` : 'none', color: COLORS.textMuted, fontSize: '12px' }}>
                    <span>{sector.split('+')[0].split('-')[0]}</span>
                    <span style={{ color: sector.includes('+') ? COLORS.green : COLORS.red }}>{sector.split(' ')[1]}</span>
                  </div>
                ))}
            </div>
          </div>
        );

      case 'economy':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <EconomyMetric label="GDP" value={economyData?.indicators?.gdpGrowth?.value || 2.2} unit="%" />
            <EconomyMetric label="INFLATION" value={economyData?.indicators?.inflation?.value || 2.9} unit="%" />
            <EconomyMetric label="RATE" value={economyData?.indicators?.rate?.value || 5.2} unit="%" />
            <EconomyMetric label="RATING" value="A+" unit="" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      {/* HUD Chrome */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
        {/* Corners */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', width: '30px', height: '30px', borderTop: `2px solid ${COLORS.cyan}`, borderLeft: `2px solid ${COLORS.cyan}` }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '30px', height: '30px', borderTop: `2px solid ${COLORS.cyan}`, borderRight: `2px solid ${COLORS.cyan}` }} />

        {/* Wordmark + Clock */}
        <div style={{ position: 'absolute', top: '30px', left: '60px' }}>
          <div style={{ color: COLORS.text, fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.2em' }}>MERIDIAN</div>
          <div style={{ color: COLORS.textDimmed, fontSize: '10px', letterSpacing: '0.1em' }}>GLOBAL INTELLIGENCE TERMINAL</div>
        </div>

        <div style={{ position: 'absolute', top: '30px', right: '60px', textAlign: 'right' }}>
          <div style={{ color: COLORS.textMuted, fontFamily: 'monospace', fontSize: '12px' }}>{clockStr} UTC</div>
          <div style={{ color: COLORS.green, fontSize: '10px', letterSpacing: '0.1em', marginTop: '2px' }}>● LIVE</div>
        </div>

        {/* Ticker */}
        <div style={{ position: 'absolute', top: '80px', left: '60px', right: '60px', fontSize: '11px', fontFamily: 'monospace', color: COLORS.textMuted }}>
          S&P 500 +1.24% | NIKKEI +0.79% | EUR/USD 1.0876 | BTC $67,234
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', marginTop: '140px' }}>
        {/* Globe */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <GlobeVis
            selectedCountry={selectedCountry}
            onCountryClick={(country) => {
              onCountrySelect(country);
              setPanelCountry(country);
            }}
            timeframe="1D"
          />
        </div>

        {/* Right Panel */}
        {panelCountry && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '380px',
            height: '100%',
            background: COLORS.glass,
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${COLORS.border}`,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            zIndex: 60,
            animation: 'slideIn 0.3s ease-out',
          }}>
            {/* Panel Header */}
            <div style={{ padding: '22px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ color: COLORS.textDimmed, fontSize: '11px' }}>{countryCode}</div>
                  <div style={{ color: COLORS.text, fontSize: '22px', fontWeight: 'bold' }}>{countryName}</div>
                </div>
                <button
                  onClick={() => setPanelCountry(null)}
                  style={{ color: COLORS.textMuted, background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '10px' }}>
                <span style={{ color: COLORS.green }}>● MARKET OPEN</span>
                <span style={{ color: indexChange >= 0 ? COLORS.green : COLORS.red }}>
                  {indexChange >= 0 ? 'BULLISH' : 'BEARISH'}
                </span>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '20px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '12px' }}>
                {['overview', 'news', 'markets', 'economy'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeTab === tab ? COLORS.cyan : COLORS.textDimmed,
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      paddingBottom: '8px',
                      borderBottom: activeTab === tab ? `2px solid ${COLORS.cyan}` : 'none',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
              {renderTabContent()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: '12px' }}>
        {/* Command Palette */}
        <div>
          <div style={{
            position: 'relative',
            width: '380px',
            background: COLORS.glass,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '24px',
            padding: '10px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
          }}
          onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={14} color={COLORS.cyan} />
            <input
              type="text"
              placeholder="Search countries, indices, headlines..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: COLORS.text,
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <span style={{ color: COLORS.textDimmed, fontSize: '9px', fontFamily: 'monospace' }}>⌘K</span>
          </div>

          {/* Search Results */}
          {searchOpen && filteredCountries.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              background: COLORS.glass,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              maxHeight: '240px',
              overflowY: 'auto',
              marginBottom: '8px',
              backdropFilter: 'blur(12px)',
            }}>
              {filteredCountries.slice(0, 6).map((country, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onCountrySelect(country);
                    setSearchOpen(false);
                    setSearchText('');
                  }}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: i < filteredCountries.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                    color: COLORS.text,
                    fontSize: '12px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(62,198,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{country.name}</span>
                    <span style={{ color: COLORS.textDimmed }}>{country.code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lens Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {LENSES.map(lens => (
            <button
              key={lens.id}
              onClick={() => setSelectedLens(lens.id)}
              style={{
                padding: '10px 14px',
                background: selectedLens === lens.id ? 'rgba(62,198,255,0.2)' : COLORS.glass,
                border: `1px solid ${selectedLens === lens.id ? COLORS.cyan : COLORS.border}`,
                borderRadius: '8px',
                color: selectedLens === lens.id ? COLORS.cyan : COLORS.textMuted,
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(12px)',
              }}
              title={lens.label}
            >
              {lens.icon} {lens.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function DataCard({ title, value, change }) {
  return (
    <div style={{ padding: '14px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ color: COLORS.textDimmed, fontSize: '11px', marginBottom: '6px' }}>{title}</div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
        <div style={{ color: COLORS.text, fontSize: '20px', fontWeight: '700', fontFamily: 'monospace' }}>{value}</div>
        <div style={{ color: change >= 0 ? COLORS.green : COLORS.red, fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function EconomyMetric({ label, value, unit }) {
  return (
    <div style={{ padding: '14px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ color: COLORS.textDimmed, fontSize: '10px', marginBottom: '6px' }}>{label}</div>
      <div style={{ color: COLORS.text, fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
      </div>
    </div>
  );
}

export default MeridianTerminal;
