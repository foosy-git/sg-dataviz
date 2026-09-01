"use client";

import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TOWN_COORDS: Record<string, [number, number]> = {
  "WOODLANDS": [1.4361, 103.7865],
  "SEMBAWANG": [1.4491, 103.8185],
  "YISHUN": [1.4304, 103.8354],
  "CHOA CHU KANG": [1.3840, 103.7470],
  "BUKIT PANJANG": [1.3774, 103.7719],
  "BUKIT BATOK": [1.3590, 103.7599],
  "JURONG EAST": [1.3329, 103.7436],
  "JURONG WEST": [1.3404, 103.7046],
  "CLEMENTI": [1.3162, 103.7649],
  "BUKIT TIMAH": [1.3294, 103.8021],
  "QUEENSTOWN": [1.2942, 103.8062],
  "BUKIT MERAH": [1.2819, 103.8239],
  "CENTRAL AREA": [1.2789, 103.8536],
  "TOA PAYOH": [1.3343, 103.8563],
  "BISHAN": [1.3526, 103.8352],
  "ANG MO KIO": [1.3691, 103.8454],
  "SERANGOON": [1.3554, 103.8679],
  "HOUGANG": [1.3724, 103.8915],
  "SENGKANG": [1.3868, 103.8914],
  "PUNGGOL": [1.4045, 103.9021],
  "KALLANG/WHAMPOA": [1.3100, 103.8651],
  "GEYLANG": [1.3201, 103.8918],
  "MARINE PARADE": [1.3020, 103.9051],
  "BEDOK": [1.3236, 103.9273],
  "TAMPINES": [1.3496, 103.9568],
  "PASIR RIS": [1.3721, 103.9491]
};

export default function MapInner({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    return data.map(d => {
      const coords = TOWN_COORDS[d.fullTown] || [1.3521, 103.8198];
      return { ...d, coords, price: d.medianPrice };
    });
  }, [data]);

  const minPrice = Math.min(...chartData.map(d => d.price), Infinity) === Infinity ? 0 : Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price), -Infinity) === -Infinity ? 1 : Math.max(...chartData.map(d => d.price));

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

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[1.3521, 103.8198]} 
        zoom={11} 
        scrollWheelZoom={false}
        className="w-full h-full rounded-xl z-0"
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />
        {chartData.map(entry => {
          const color = getColor(entry.price);
          return (
            <CircleMarker
              key={entry.fullTown}
              center={entry.coords}
              radius={12}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.8,
                color: '#fff',
                weight: 2
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <div className="text-center">
                  <div className="font-bold text-slate-800 text-sm mb-1">{entry.fullTown}</div>
                  <div className="text-slate-600 font-medium">${entry.price.toLocaleString()}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-lg shadow-sm text-xs font-medium flex items-center gap-3 border border-[#243324]/10 z-[1000]">
         <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#16a34a] shadow-inner" /> Lower</div>
         <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#eab308] shadow-inner" /> Mid</div>
         <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-inner" /> Higher</div>
      </div>
    </div>
  );
}
