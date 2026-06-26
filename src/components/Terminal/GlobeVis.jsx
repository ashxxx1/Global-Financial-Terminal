import { useEffect, useState, useRef, useMemo } from "react";
import Globe from "react-globe.gl";
import { Info, Target, RotateCcw, Plus, Minus } from "lucide-react";
import { getCountryStats } from "./data";
import * as THREE from "three";
import useTerminalStore from "../../store/terminalStore";

export function GlobeVis({ selectedCountry, onCountryClick, timeframe = "1D" }) {
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);
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
      let color = ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.1)']; // Trade (Emerald)
      if (type > 0.6) color = ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.1)']; // Internet (Indigo)
      if (type > 0.8) color = ['rgba(244, 63, 94, 0.8)', 'rgba(244, 63, 94, 0.1)']; // Military/Air (Rose)
      
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
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(worldData => {
        const filteredFeatures = worldData.features.filter((d) => d.properties.ISO_A2 !== 'AQ' && d.properties.ADMIN !== 'India');
        
        // Fetch simplified datameet india geojson
        fetch('/india.geojson')
          .then(res => res.json())
          .then(indiaData => {
            const formattedIndia = indiaData.features.map((f) => ({
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
      setDimensions({ width: w, height: h });
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
      if (currentGlobe) {
        const scene = currentGlobe.scene();
        const camera = currentGlobe.camera();
        
        // Remove default directional lights attached to camera
        const dirLights = camera.children.filter((c) => c.isDirectionalLight || c.type === 'DirectionalLight');
        dirLights.forEach((light) => camera.remove(light));

        sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        scene.add(sunLight);
        ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
        scene.add(ambientLight);

        const globeMaterial = currentGlobe.globeMaterial();
        globeMaterial.bumpScale = 10;
        new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-water.png', texture => {
           globeMaterial.specularMap = texture;
           globeMaterial.specular = new THREE.Color('grey');
           globeMaterial.shininess = 20;
        });

        const updateSunPosition = () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
          const sunLat = 23.44 * Math.sin(2 * Math.PI * (diff - 81) / 365);
          const sunLng = 180 - (now.getUTCHours() + now.getUTCMinutes() / 60) * 15;
          
          if (currentGlobe) {
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
       if (currentGlobe) {
          const scene = currentGlobe.scene();
          if (sunLight) scene.remove(sunLight);
          if (ambientLight) scene.remove(ambientLight);
       }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globeRef.current) {
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

  useEffect(() => {
    if (!selectedCountry && globeRef.current) {
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
    if (globeRef.current) {
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
      <div className="absolute inset-0 flex items-center justify-center opacity-100 drop-shadow-[0_0_80px_rgba(30,58,138,0.3)]">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere={true}
          atmosphereColor="#38bdf8"
          atmosphereAltitude={0.15}
          polygonsData={countries.features}
          polygonAltitude={d => d === hoverD ? 0.08 : 0.001}
          polygonCapColor={d => {
             const iso = d.properties?.ISO_A2 || '';
             const stats = getCountryStats(iso);
             const fallback = stats.marketReturns["1D"];
             const score = stats.marketReturns[timeframe] !== undefined ? stats.marketReturns[timeframe] : fallback;
             
             const baseAlpha = d === hoverD ? '0.6' : '0.1'; 
             if (score > 1.0) return `rgba(16, 185, 129, ${baseAlpha})`; 
             if (score < -1.0) return `rgba(244, 63, 94, ${baseAlpha})`;
             return `rgba(251, 191, 36, ${baseAlpha})`; 
          }}
          polygonSideColor={() => 'rgba(15, 23, 42, 0.0)'} 
          polygonStrokeColor={() => 'rgba(255, 255, 255, 0.02)'} 
          polygonLabel={(d) => {
            const props = d?.properties || {};
            return `
            <div class="bg-black/90 border border-slate-700 px-3 py-2 rounded shadow-2xl backdrop-blur-md font-sans min-w-[120px]">
              <div class="text-[11px] font-bold text-white tracking-widest uppercase mb-1">${props.ADMIN || 'Unknown'}</div>
              <div class="text-[9px] text-sky-400 font-bold uppercase tracking-wider">CLICK FOR AI SUMMARY</div>
            </div>
          `}}
          onPolygonHover={setHoverD}
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
           className="w-10 h-10 rounded-md bg-[#131b2f] border border-[#1e293b] text-slate-400 hover:text-white flex items-center justify-center hover:bg-[#1a233a] transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer"
           onClick={() => globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 1.7 }, 1000)}
           aria-label="Reset view"
        >
          <Target className="w-5 h-5" />
        </button>
        <button 
           className="w-10 h-10 rounded-md bg-[#131b2f] border border-[#1e293b] text-slate-400 hover:text-white flex items-center justify-center hover:bg-[#1a233a] transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer"
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
        <div className="flex flex-col rounded-md bg-[#131b2f] border border-[#1e293b] overflow-hidden mt-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
           <button 
             className="w-10 h-10 text-slate-400 hover:text-white flex items-center justify-center hover:bg-[#1a233a] transition-colors border-b border-[#1e293b] cursor-pointer"
             onClick={() => globeRef.current && globeRef.current.pointOfView({ altitude: globeRef.current.pointOfView().altitude - 0.2 }, 300)}
             aria-label="Zoom in"
           >
             <Plus className="w-5 h-5" />
           </button>
           <button 
             className="w-10 h-10 text-slate-400 hover:text-white flex items-center justify-center hover:bg-[#1a233a] transition-colors cursor-pointer"
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
