/**
 * PremiumTerminal.jsx — Advanced MERIDIAN UI with integrated engines
 * Combines: DotGlobe (WebGL), Market Engine, Crisis Engine, AI Assistant
 */

import { useEffect, useRef, useState } from 'react';
import MeridianLayout from './MeridianLayout';
import MeridianPanel from './MeridianPanel';
import GlobeVis from './GlobeVis';

// Import engines (these need to be transpiled from the extracted files)
// For now, we'll use the existing GlobeVis but with enhanced styling

export default function PremiumTerminal({
  selectedCountry,
  onCountrySelect,
  timeframe,
  countries = []
}) {
  const containerRef = useRef(null);
  const [selectedLens, setSelectedLens] = useState('markets');
  const [panelCountry, setPanelCountry] = useState(selectedCountry);
  const [clockStr, setClockStr] = useState('00:00:00');
  const [marketClocks, setMarketClocks] = useState([
    { flag: '🇺🇸', city: 'NYC', time: '09:30', openColor: '#39d6a3' },
    { flag: '🇬🇧', city: 'LON', time: '14:30', openColor: '#39d6a3' },
    { flag: '🇯🇵', city: 'TOK', time: '09:00', openColor: '#39d6a3' },
    { flag: '🇭🇰', city: 'HKG', time: '09:30', openColor: '#39d6a3' },
    { flag: '🇸🇬', city: 'SGP', time: '17:00', openColor: '#ff5b68' },
  ]);

  // Update UTC clock
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

  // Update panel when country changes
  useEffect(() => {
    setPanelCountry(selectedCountry);
  }, [selectedCountry]);

  return (
    <MeridianLayout
      selectedCountry={selectedCountry}
      onCountrySelect={(country) => {
        onCountrySelect(country);
        setPanelCountry(country);
      }}
      countries={countries}
      clockStr={clockStr}
      marketClocks={marketClocks}
      selectedLens={selectedLens}
      onLensChange={setSelectedLens}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(22,49,79,0.28) 0%, #05070d 65%)',
        }}
      >
        <GlobeVis
          selectedCountry={selectedCountry}
          onCountryClick={onCountrySelect}
          timeframe={timeframe}
        />
      </div>

      {/* Show panel when country selected */}
      {panelCountry && (
        <div style={{ position: 'absolute', bottom: 100, right: 50, zIndex: 80 }}>
          <MeridianPanel
            country={panelCountry}
            lens={selectedLens}
            onClose={() => setPanelCountry(null)}
            onLensChange={setSelectedLens}
          />
        </div>
      )}
    </MeridianLayout>
  );
}
