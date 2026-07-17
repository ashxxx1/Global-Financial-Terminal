import { useEffect, useState, useRef, useMemo } from "react";
import Globe from "react-globe.gl";
import { Info, Target, RotateCcw, Plus, Minus } from "lucide-react";
import { getCountryStats } from "./data";
import * as THREE from "three";
import useTerminalStore from "../../store/terminalStore";

export function GlobeVis({ selectedCountry, onCountryClick, timeframe = "1D" }) {
  const [countries, setCountries] = useState({ features: [] });
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const { annotations } = useTerminalStore();

  const regionsData = [
    { name: "NORTH AMERICA", lat: 45, lng: -100, val: "+0.85%", col: "emerald" },
    { name: "SOUTH AMERICA", lat: -15, lng: -60, val: "-0.32%", col: "rose" },
    { name: "EUROPE", lat: 50, lng: 10, val: "-0.12%", col: "rose" },
    { name: "AFRICA", lat: 0, lng: 20, val: "+0.21%", col: "emerald" },
    { name: "ASIA", lat: 35, lng: 100, val: "+0.68%", col: "emerald" },
  ];

  const combinedHtmlData = useMemo(() => {
    return [
      ...regionsData,
      ...(annotations || []).map((ann) => ({
        ...ann,
        name: ann.text,
        isAnnotation: true,
        val: "",
        col: "amber"
      }))
    ];
  }, [annotations]);

  const [trafficArcs] = useState(() => {
    // Generate mock traffic arcs for trade routes, aircraft, etc
    const N = 40;
    return [...Array(N).keys()].map(() => {
      const type = Math.random();
      let color = ['rgba(70, 211, 138, 0.8)', 'rgba(70, 211, 138, 0.1)']; // Trade (Rise)
      if (type > 0.6) color = ['rgba(245, 177, 61, 0.8)', 'rgba(245, 177, 61, 0.1)']; // Capital flows (Brass)
      if (type > 0.8) color = ['rgba(232, 99, 90, 0.8)', 'rgba(232, 99, 90, 0.1)']; // Military/Air (Fall)
      
      return {
        startLat: (Math.random() - 0.5) * 160,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 160,
        endLng: (Math.random() - 0.5) * 360,
        color
      };
    });
  });

  useEffect(() => {
    const ISO_A3_MAP = {
      USA: "US", GBR: "GB", JPN: "JP", DEU: "DE", CHN: "CN", IND: "IN",
      BRA: "BR", AUS: "AU", CAN: "CA", FRA: "FR", SAU: "SA", KOR: "KR",
      ZAF: "ZA", NGA: "NG", MEX: "MX", SGP: "SG", ARE: "AE", RUS: "RU",
      ESP: "ES", ITA: "IT", NLD: "NL", SWE: "SE", NOR: "NO", CHE: "CH",
      DNK: "DK", FIN: "FI", AUT: "AT", PRT: "PT", GRC: "GR", POL: "PL",
      BEL: "BE", IRL: "IE", HUN: "HU", CZE: "CZ", ROU: "RO", UKR: "UA",
      TUR: "TR", ISR: "IL", QAT: "QA", KWT: "KW", OMN: "OM", JOR: "JO",
      BHR: "BH", IRN: "IR", EGY: "EG", MAR: "MA", KEN: "KE", GHA: "GH",
      CIV: "CI", TZA: "TZ", TWN: "TW", HKG: "HK", IDN: "ID", MYS: "MY",
      THA: "TH", PHL: "PH", VNM: "VN", PAK: "PK", BGD: "BD", LKA: "LK",
      NZL: "NZ", KAZ: "KZ", ARG: "AR", COL: "CO", CHL: "CL", PER: "PE",
      GUY: "GY", DZA: "DZ"
    };

    const NAME_MAP = {
      "India": "IN",
      "United States of America": "US",
      "United Kingdom": "GB",
      "France": "FR",
      "Norway": "NO",
      "China": "CN",
      "South Korea": "KR",
      "Republic of Korea": "KR",
      "Russia": "RU",
      "Australia": "AU",
      "Brazil": "BR",
      "Canada": "CA",
      "Germany": "DE",
      "Japan": "JP",
      "Mexico": "MX",
      "Saudi Arabia": "SA",
      "Singapore": "SG",
      "South Africa": "ZA",
      "Nigeria": "NG",
      "United Arab Emirates": "AE",
      "Spain": "ES",
      "Italy": "IT",
      "Netherlands": "NL",
      "Sweden": "SE",
      "Switzerland": "CH",
      "Denmark": "DK",
      "Finland": "FI",
      "Austria": "AT",
      "Portugal": "PT",
      "Greece": "GR",
      "Poland": "PL",
      "Belgium": "BE",
      "Ireland": "IE",
      "Hungary": "HU",
      "Czech Republic": "CZ",
      "Czechia": "CZ",
      "Romania": "RO",
      "Ukraine": "UA",
      "Turkey": "TR",
      "Türkiye": "TR",
      "Israel": "IL",
      "Qatar": "QA",
      "Kuwait": "KW",
      "Oman": "OM",
      "Jordan": "JO",
      "Bahrain": "BH",
      "Iran": "IR",
      "Egypt": "EG",
      "Morocco": "MA",
      "Kenya": "KE",
      "Ghana": "GH",
      "Ivory Coast": "CI",
      "Côte d'Ivoire": "CI",
      "Tanzania": "TZ",
      "United Republic of Tanzania": "TZ",
      "Taiwan": "TW",
      "Hong Kong": "HK",
      "Indonesia": "ID",
      "Malaysia": "MY",
      "Thailand": "TH",
      "Philippines": "PH",
      "Vietnam": "VN",
      "Viet Nam": "VN",
      "Pakistan": "PK",
      "Bangladesh": "BD",
      "Sri Lanka": "LK",
      "New Zealand": "NZ",
      "Kazakhstan": "KZ",
      "Argentina": "AR",
      "Colombia": "CO",
      "Chile": "CL",
      "Peru": "PE",
      "Guyana": "GY",
      "Algeria": "DZ"
    };

    function resolveISO(feat) {
      const p = feat.properties || {};
      if (p.ISO_A2 && p.ISO_A2 !== "-99") return p.ISO_A2;
      if (p.ISO_A3 && ISO_A3_MAP[p.ISO_A3]) return ISO_A3_MAP[p.ISO_A3];
      if (p.NAME && NAME_MAP[p.NAME]) return NAME_MAP[p.NAME];
      if (p.ADMIN && NAME_MAP[p.ADMIN]) return NAME_MAP[p.ADMIN];
      return p.ISO_A2 || null;
    }

    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(worldData => {
        const filteredFeatures = worldData.features
          .filter((d) => d.properties.ISO_A2 !== 'AQ' && d.properties.ADMIN !== 'India')
          .map((d) => {
             const resolved = resolveISO(d);
             return {
               ...d,
               properties: {
                 ...d.properties,
                 ISO_A2: resolved || d.properties.ISO_A2
               }
             };
          });
        
        // Fetch simplified datameet india geojson
        fetch('/india.geojson')
          .then(res => res.json())
          .then(indiaData => {
            const rawFeatures = indiaData.features || (indiaData.geometries ? indiaData.geometries.map(g => ({ type: 'Feature', properties: {}, geometry: g })) : []);
            const formattedIndia = rawFeatures.map((f) => ({
              ...f,
              properties: {
                 ...f.properties,
                 ADMIN: 'India',
                 ISO_A2: 'IN'
              }
            }));
            setCountries({ features: [...filteredFeatures, ...formattedIndia] });
          })
          .catch(err => {
             console.error("Could not load high-res India map", err);
             setCountries({ features: worldData.features.filter((d) => d.properties.ISO_A2 !== 'AQ') });
          });
      })
      .catch(err => {
        console.error("Failed to fetch world geojson", err);
      });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 800;
      setDimensions(prev => {
        if (Math.abs(prev.width - w) < 3 && Math.abs(prev.height - h) < 3) {
          return prev;
        }
        return { width: w, height: h };
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // Set up real-time Sun light
    let sunLight;
    let ambientLight;
    let intervalSet;
    const currentGlobe = globeRef.current;
    
    const initTimer = setTimeout(() => {
      if (currentGlobe && typeof currentGlobe.scene === 'function' && typeof currentGlobe.camera === 'function') {
        const scene = currentGlobe.scene();
        const camera = currentGlobe.camera();
        
        // Remove default directional lights attached to camera
        const dirLights = camera.children.filter((c) => c.isDirectionalLight || c.type === 'DirectionalLight');
        dirLights.forEach((light) => camera.remove(light));

        // Balanced lighting: sun at ~45° to mimic real Earth
        sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
        sunLight.position.set(1, 0.7, 1);
        scene.add(sunLight);
        ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        if (typeof currentGlobe.globeMaterial === 'function') {
          const globeMaterial = currentGlobe.globeMaterial();
          globeMaterial.bumpScale = 0; // no bump map exaggeration
          globeMaterial.specular = new THREE.Color('#1a3a52'); // deep ocean blue, subtle gloss
          globeMaterial.shininess = 4; // low gloss (not plastic-y)
          globeMaterial.needsUpdate = true;
        }

        const updateSunPosition = () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
          const sunLat = 23.44 * Math.sin(2 * Math.PI * (diff - 81) / 365);
          const sunLng = 180 - (now.getUTCHours() + now.getUTCMinutes() / 60) * 15;
          
          if (currentGlobe && typeof currentGlobe.getCoords === 'function') {
             const coords = currentGlobe.getCoords(sunLat, sunLng, 2);
             sunLight.position.set(coords.x, coords.y, coords.z);
          }
        };
        
        updateSunPosition();
        intervalSet = setInterval(updateSunPosition, 60000); // update every minute
      }
    }, 1000);

    return () => {
       clearTimeout(initTimer);
       if (intervalSet) clearInterval(intervalSet);
       if (currentGlobe && typeof currentGlobe.scene === 'function') {
          const scene = currentGlobe.scene();
          if (sunLight) scene.remove(sunLight);
          if (ambientLight) scene.remove(ambientLight);
       }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globeRef.current && typeof globeRef.current.controls === 'function' && typeof globeRef.current.pointOfView === 'function') {
        const controls = globeRef.current.controls();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.2;
          globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 1.7 });
          clearInterval(interval);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Force WebGL context disposal on unmount to release GPU resources
  useEffect(() => {
    return () => {
      if (globeRef.current) {
        try {
          const renderer = globeRef.current.renderer();
          if (renderer) {
            renderer.dispose();
            const extension = renderer.getContext()?.getExtension('WEBGL_lose_context');
            if (extension) {
              extension.loseContext();
            }
          }
        } catch (e) {
          console.warn("Could not dispose WebGL context:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedCountry && globeRef.current && typeof globeRef.current.controls === 'function') {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2;
      }
    }
  }, [selectedCountry]);

  const getPolygonCenter = (polygon) => {
    if (!polygon || !polygon.geometry) return { lat: 0, lng: 0 };
    const { type, coordinates } = polygon.geometry;
    let lats = [];
    let lngs = [];
    
    const processCoords = (coords) => {
      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          processCoords(coord);
        } else {
          lngs.push(coord[0]);
          lats.push(coord[1]);
        }
      });
    };
    
    processCoords(coordinates);
    
    if (lats.length === 0 || lngs.length === 0) return { lat: 0, lng: 0 };
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    };
  };

  const handlePolygonClick = (polygon, event) => {
    if (globeRef.current && typeof globeRef.current.controls === 'function' && typeof globeRef.current.pointOfView === 'function') {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
      }
      
      const { lat, lng } = getPolygonCenter(polygon);
      globeRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 1000);
    }
    
    if (onCountryClick) {
      onCountryClick(polygon, event);
    }
  };


  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden" ref={containerRef}>
      
      {/* The Globe Canvas Container */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-100"
        style={{
          filter: 'drop-shadow(0 0 50px rgba(70,211,138,0.06))',
        }}
      >
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          showAtmosphere={false}
          polygonsData={countries.features}
          polygonAltitude={0.008}
          polygonCapColor={d => {
             // Only the selected country is tinted. react-globe.gl does not depth-occlude
             // the transparent polygon caps against the Earth sphere, so tinting every
             // country stacks front+far-side caps into a solid wash that hides the globe.
             // Keeping all-but-selected transparent lets the blue-marble Earth read cleanly.
             const iso = d.properties?.ISO_A2 || '';
             const selIso = selectedCountry?.properties?.ISO_A2 || selectedCountry?.code || '';
             if (!selIso || iso !== selIso) return 'rgba(0, 0, 0, 0)';

             const stats = getCountryStats(iso);
             const fallback = stats.marketReturns["1D"];
             const score = stats.marketReturns[timeframe] !== undefined ? stats.marketReturns[timeframe] : fallback;
             if (score < -1.0) return 'rgba(230, 95, 85, 0.55)';   // red — declining
             if (score > 1.0) return 'rgba(90, 210, 150, 0.55)';   // green — advancing
             return 'rgba(245, 177, 61, 0.45)';                    // gold — neutral highlight
          }}
          polygonSideColor={() => 'rgba(245, 177, 61, 0.15)'}
          polygonStrokeColor={d => {
             const iso = d.properties?.ISO_A2 || '';
             const selIso = selectedCountry?.properties?.ISO_A2 || selectedCountry?.code || '';
             return (selIso && iso === selIso) ? 'rgba(245, 177, 61, 0.9)' : 'rgba(245, 177, 61, 0.12)';
          }}
          polygonLabel={(d) => {
            const props = d?.properties || {};
            return `
            <div style="background:rgba(5,7,13,0.95);border:1px solid rgba(245,177,61,0.4);padding:8px 12px;border-radius:2px;box-shadow:0 4px 20px rgba(0,0,0,0.8),0 0 0 1px rgba(245,177,61,0.08);min-width:130px;backdrop-filter:blur(12px);">
              <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#f0e6d2;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px;">${props.ADMIN || 'Unknown'}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;color:#f5b13d;letter-spacing:0.1em;text-transform:uppercase;">↗ CLICK FOR AI INTEL</div>
            </div>
          `}}
          onPolygonClick={handlePolygonClick}
          htmlElementsData={combinedHtmlData}
          arcsData={trafficArcs}
          arcStroke={0.5}
          arcStartLat={(d) => d.startLat}
          arcStartLng={(d) => d.startLng}
          arcEndLat={(d) => d.endLat}
          arcEndLng={(d) => d.endLng}
          arcColor={(d) => d.color}
          arcDashLength={0.8}
          arcDashGap={1}
          arcDashAnimateTime={4000}
          arcAltitudeAutoScale={0.25}
          htmlElement={(d) => {
            const el = document.createElement('div');
            if (d.isAnnotation) {
              el.innerHTML = `
                <div class="flex flex-col items-center pointer-events-none translate-x-[-50%] translate-y-[-50%]">
                   <div class="bg-[#0b1329]/95 border border-amber-500/40 backdrop-blur-md rounded px-2.5 py-1.5 shadow-2xl text-center max-w-[130px]">
                      <div class="text-[8px] font-mono font-bold text-amber-400 tracking-wider">📌 NOTE BY ${d.author}</div>
                      <div class="text-[9.5px] text-slate-300 font-sans mt-0.5 leading-snug">${d.text}</div>
                   </div>
                   <div class="w-[1px] h-4 bg-gradient-to-b from-amber-500/80 to-transparent"></div>
                   <span class="text-xs">🚩</span>
                </div>
              `;
            } else {
              el.innerHTML = `
                <div class="flex flex-col items-center pointer-events-none translate-x-[-50%] translate-y-[-50%]">
                   <div class="bg-[#0c1220]/80 border border-[#1e293b] backdrop-blur-md rounded px-2 py-1 shadow-lg text-center min-w-[100px]">
                      <div class="text-[10px] font-bold text-[#cbd5e1] tracking-widest">${d.name}</div>
                      <div class="text-[11px] font-bold tracking-widest ${d.col === 'emerald' ? 'text-emerald-400' : 'text-rose-500'}">${d.val}</div>
                   </div>
                   <div class="w-1 h-8 bg-gradient-to-b from-[#1e293b] to-transparent"></div>
                   <div class="w-2 h-2 rounded-full ${d.col === 'emerald' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]'}"></div>
                </div>
              `;
            }
            return el;
          }}
        />
      </div>
      
      {/* Zoom Controls Overlay */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
        <button 
           className="w-10 h-10 rounded-sm flex items-center justify-center transition-all cursor-pointer"
           style={{ background: "#0a0e1a", border: "1px solid rgba(245,177,61,0.25)", color: "#a89c84", boxShadow: "0 0 15px rgba(0,0,0,0.5)" }}
           onMouseEnter={e => { e.currentTarget.style.color = "#f0e6d2"; e.currentTarget.style.background = "rgba(245,177,61,0.1)"; }}
           onMouseLeave={e => { e.currentTarget.style.color = "#a89c84"; e.currentTarget.style.background = "#0a0e1a"; }}
           onClick={() => globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 1.7 }, 1000)}
           aria-label="Reset view"
        >
          <Target className="w-5 h-5" />
        </button>
        <button 
           className="w-10 h-10 rounded-sm flex items-center justify-center transition-all cursor-pointer"
           style={{ background: "#0a0e1a", border: "1px solid rgba(245,177,61,0.25)", color: "#a89c84", boxShadow: "0 0 15px rgba(0,0,0,0.5)" }}
           onMouseEnter={e => { e.currentTarget.style.color = "#f0e6d2"; e.currentTarget.style.background = "rgba(245,177,61,0.1)"; }}
           onMouseLeave={e => { e.currentTarget.style.color = "#a89c84"; e.currentTarget.style.background = "#0a0e1a"; }}
           onClick={() => {
             if (globeRef.current) {
               const controls = globeRef.current.controls();
               controls.autoRotate = !controls.autoRotate;
             }
           }}
           aria-label="Toggle auto rotation"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="flex flex-col rounded-sm overflow-hidden mt-2" style={{ background: "#0a0e1a", border: "1px solid rgba(245,177,61,0.25)", boxShadow: "0 0 15px rgba(0,0,0,0.5)" }}>
           <button 
             className="w-10 h-10 flex items-center justify-center transition-all cursor-pointer"
             style={{ color: "#a89c84", borderBottom: "1px solid rgba(245,177,61,0.18)" }}
             onMouseEnter={e => { e.currentTarget.style.color = "#f0e6d2"; e.currentTarget.style.background = "rgba(245,177,61,0.1)"; }}
             onMouseLeave={e => { e.currentTarget.style.color = "#a89c84"; e.currentTarget.style.background = "transparent"; }}
             onClick={() => globeRef.current && globeRef.current.pointOfView({ altitude: globeRef.current.pointOfView().altitude - 0.2 }, 300)}
             aria-label="Zoom in"
           >
             <Plus className="w-5 h-5" />
           </button>
           <button 
             className="w-10 h-10 flex items-center justify-center transition-all cursor-pointer"
             style={{ color: "#a89c84" }}
             onMouseEnter={e => { e.currentTarget.style.color = "#f0e6d2"; e.currentTarget.style.background = "rgba(245,177,61,0.1)"; }}
             onMouseLeave={e => { e.currentTarget.style.color = "#a89c84"; e.currentTarget.style.background = "transparent"; }}
             onClick={() => globeRef.current && globeRef.current.pointOfView({ altitude: globeRef.current.pointOfView().altitude + 0.2 }, 300)}
             aria-label="Zoom out"
           >
             <Minus className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
}
export default GlobeVis;
