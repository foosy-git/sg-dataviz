import { useMemo, useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

// Mapping dataset town names to GeoJSON planning area names (if different)
const TOWN_MAP: Record<string, string> = {
  "KALLANG/WHAMPOA": "KALLANG",
  "CENTRAL AREA": "DOWNTOWN CORE", // Often HDB maps this to Downtown Core or Outram
};

export default function GeographicalMap({ data }: { data: any[] }) {
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredTown, setHoveredTown] = useState<any>(null);

  useEffect(() => {
    fetch('/sg.geojson')
      .then(r => r.json())
      .then(d => setGeoData(d));
  }, []);

  const chartData = useMemo(() => {
    const map = new Map();
    data.forEach(d => {
      map.set(d.fullTown, d);
    });
    return map;
  }, [data]);

  const minPrice = Math.min(...data.map(d => d.medianPrice), Infinity) === Infinity ? 0 : Math.min(...data.map(d => d.medianPrice));
  const maxPrice = Math.max(...data.map(d => d.medianPrice), -Infinity) === -Infinity ? 1 : Math.max(...data.map(d => d.medianPrice));

  const getColor = (price: number) => {
    if (minPrice === maxPrice) return '#16a34a';
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.5) {
      const r = ratio * 2;
      const red = Math.round(22 + (212 * r));
      const green = Math.round(163 - (5 * r));
      const blue = Math.round(74 - (66 * r));
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      const r = (ratio - 0.5) * 2;
      const red = Math.round(234 + (5 * r));
      const green = Math.round(179 - (111 * r));
      const blue = Math.round(8 - (0 * r));
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  if (!data || data.length === 0) {
    return <div className="h-[450px] w-full flex items-center justify-center text-[#243324]/50 bg-[#e0f2fe]/40 rounded-xl">No data available for map.</div>;
  }

  return (
    <div className="w-full relative bg-[#e0f2fe]/40 rounded-xl overflow-hidden border border-[#243324]/5 p-2 md:p-4">
      <div className="relative w-full h-[340px] sm:h-[480px] md:h-[600px] flex items-center justify-center">
        {!geoData && (
          <div className="animate-pulse text-[#243324]/50">Loading Map...</div>
        )}
        {geoData && (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 130000,
              center: [103.8198, 1.3521] // Centered on Singapore
            }}
            width={800}
            height={500}
            style={{ width: '100%', height: '100%' }}
          >
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name.toUpperCase();
                  
                  // Try to find the matching town in our dataset
                  let matchedTown = chartData.get(geoName);
                  if (!matchedTown) {
                    // Try reverse mapping
                    const mappedName = Object.keys(TOWN_MAP).find(k => TOWN_MAP[k] === geoName);
                    if (mappedName) {
                      matchedTown = chartData.get(mappedName);
                    }
                  }

                  const fillColor = matchedTown ? getColor(matchedTown.medianPrice) : "#e2e8f0";
                  const centroid = geoCentroid(geo);

                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#94a3b8", outline: "none", cursor: 'pointer' },
                          pressed: { outline: "none" },
                        }}
                        onClick={() => {
                          if (matchedTown) {
                            setHoveredTown((prev: any) => prev?.fullTown === matchedTown.fullTown ? null : matchedTown);
                          }
                        }}
                        onMouseEnter={() => {
                          if (matchedTown) setHoveredTown(matchedTown);
                        }}
                        onMouseLeave={() => {
                          setHoveredTown(null);
                        }}
                      />
                      {/* Only draw marker/text if we have data for this town */}
                      {matchedTown && (
                        <Marker coordinates={centroid}>
                          <circle r={2.5} fill="#ffffff" stroke="#243324" strokeWidth={0.5} />
                          <text
                            textAnchor="middle"
                            y={-6}
                            style={{ fontFamily: "inherit", fontSize: "7px", fill: "#243324", fontWeight: 600, pointerEvents: 'none' }}
                          >
                            {matchedTown.fullTown}
                          </text>
                        </Marker>
                      )}
                    </g>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        )}

        <AnimatePresence>
          {hoveredTown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-2 left-2 right-2 sm:bottom-auto sm:top-4 sm:left-4 sm:right-auto z-30 pointer-events-auto"
            >
              <Card className="shadow-lg border-[#243324]/10 bg-white/95 backdrop-blur-sm min-w-[200px]">
                <CardContent className="p-3 sm:p-4 space-y-1.5 sm:space-y-2 relative">
                  <button 
                    onClick={() => setHoveredTown(null)}
                    className="sm:hidden absolute top-2 right-2 text-[#243324]/40 hover:text-[#243324] text-xs p-1"
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                  <div className="font-serif font-semibold text-base sm:text-lg text-[#243324] border-b border-[#243324]/10 pb-1 pr-6 sm:pr-0">
                    {hoveredTown.fullTown}
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-[11px] font-sans font-medium uppercase tracking-wider text-[#243324]/60">
                      Median Resale Price
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-[#243324]">
                      ${hoveredTown.medianPrice.toLocaleString()}
                    </div>
                  </div>
                  {hoveredTown.volume !== undefined && (
                    <div className="text-xs text-[#243324]/70 pt-1.5 border-t border-[#243324]/5 flex items-center justify-between gap-4">
                      <span className="font-medium text-[#243324]/60">Volume</span>
                      <span className="font-semibold text-[#243324]">{hoveredTown.volume.toLocaleString()} flats</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute top-2 right-2 sm:top-auto sm:bottom-4 sm:right-4 bg-white/95 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-[#243324]/10 shadow-sm pointer-events-none z-20">
          <div className="text-[9px] sm:text-[10px] font-semibold text-[#243324]/60 uppercase tracking-wider mb-1 sm:mb-2">Median Price</div>
          <div className="flex sm:flex-col gap-2 sm:gap-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#16a34a]"></div>
              <span className="text-[11px] sm:text-xs text-[#243324]/80 font-medium">Lower</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#eab308]"></div>
              <span className="text-[11px] sm:text-xs text-[#243324]/80 font-medium">Mid</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ea580c]"></div>
              <span className="text-[11px] sm:text-xs text-[#243324]/80 font-medium">Higher</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
