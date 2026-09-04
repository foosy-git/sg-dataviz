
'use client';

import Link from 'next/link';
import { ArrowLeft, Activity, Wind, AlertCircle, Factory } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AirQualityDashboard({ psiData }: { psiData: { psi: any, pm25: any } }) {
  const [geoData, setGeoData] = useState<any>(null);
  const [mapMetric, setMapMetric] = useState<'psi' | 'pm25'>('psi');
  
  const updateTimestamp = psiData?.psi?.update_timestamp;
  const formattedTime = updateTimestamp ? new Date(updateTimestamp).toLocaleString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N.A.';

  useEffect(() => {
    fetch('/sg.geojson')
      .then(r => r.json())
      .then(d => setGeoData(d));
  }, []);
  
  const getPsiData = (val: number | null) => {
    if (val === null || val === undefined) {
      return { status: 'N.A.', color: 'text-slate-600', bg: 'bg-slate-500', border: 'border-slate-500', pulse: false };
    }
    if (val <= 50) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-500', pulse: false };
    if (val <= 100) return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-500', pulse: false };
    if (val <= 200) return { status: 'Unhealthy', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-500', pulse: true };
    if (val <= 300) return { status: 'Very Unhealthy', color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-500', pulse: true };
    return { status: 'Hazardous', color: 'text-purple-600', bg: 'bg-purple-500', border: 'border-purple-500', pulse: true };
  };

  const getPm25Data = (val: number | null) => {
    if (val === null || val === undefined) {
      return { status: 'N.A.', color: 'text-slate-600', bg: 'bg-slate-500', border: 'border-slate-500', pulse: false };
    }
    if (val <= 12) return { status: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-500', pulse: false };
    if (val <= 35) return { status: 'Elevated', color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-500', pulse: false };
    if (val <= 55) return { status: 'High', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-500', pulse: true };
    if (val <= 150) return { status: 'Very High', color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-500', pulse: true };
    return { status: 'Hazardous', color: 'text-purple-600', bg: 'bg-purple-500', border: 'border-purple-500', pulse: true };
  };

  // Helper to extract comprehensive stats across Singapore's 5 regions
  const getRegionalStats = (readings: Record<string, number> | null | undefined) => {
    if (!readings) return null;
    const regionKeys = ['north', 'south', 'east', 'west', 'central'] as const;
    const entries: { region: string; val: number }[] = [];
    for (const r of regionKeys) {
      const v = readings[r];
      if (typeof v === 'number' && !isNaN(v)) {
        entries.push({ region: r, val: v });
      }
    }
    if (entries.length === 0) return null;

    const vals = entries.map(e => e.val);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / vals.length);
    const highestEntry = entries.find(e => e.val === max);
    const highestRegionName = highestEntry 
      ? highestEntry.region.charAt(0).toUpperCase() + highestEntry.region.slice(1) 
      : '';

    return {
      min,
      max,
      avg,
      range: min === max ? `${min}` : `${min} – ${max}`,
      highestRegion: highestRegionName,
    };
  };

  const getNationalMax = (readings: any) => {
    if (!readings) return null;
    const vals = [readings.north, readings.south, readings.east, readings.west, readings.central].filter(v => v !== undefined && v !== null);
    if (vals.length === 0) return null;
    return Math.max(...vals);
  };

  const psiStats = getRegionalStats(psiData?.psi?.readings?.psi_twenty_four_hourly);
  const pm25Stats = getRegionalStats(psiData?.pm25?.readings?.pm25_one_hourly);

  const nationalPsi = psiStats?.max ?? null;
  const nationalPm25hr1 = pm25Stats?.max ?? null;
  const nationalInfo = getPsiData(nationalPsi);
  const pm25Info = getPm25Data(nationalPm25hr1);

  const historicalHaze = [
    { name: '1997 Haze', psi: 226, year: 1997 },
    { name: '2013 Crisis', psi: 401, year: 2013 },
    { name: '2015 Haze', psi: 321, year: 2015 },
    { name: '2019 Haze', psi: 154, year: 2019 },
    { name: 'Current (Peak)', psi: nationalPsi ?? 0, year: new Date().getFullYear() },
  ].sort((a, b) => a.year - b.year);

  // Approximate longitude/latitude for the 5 regions
  const regions = [
    { id: 'north', label: 'North', coords: [103.82, 1.43] },
    { id: 'west', label: 'West', coords: [103.71, 1.36] },
    { id: 'central', label: 'Central', coords: [103.82, 1.35] },
    { id: 'east', label: 'East', coords: [103.94, 1.35] },
    { id: 'south', label: 'South', coords: [103.82, 1.28] },
  ];

  // Radar chart data for pollutants. We also must calculate the max for these if national is missing.
  const pollutantData = [
    { subject: 'PM2.5', A: getNationalMax(psiData?.psi?.readings?.pm25_sub_index) ?? 0, fullMark: 200 },
    { subject: 'PM10', A: getNationalMax(psiData?.psi?.readings?.pm10_sub_index) ?? 0, fullMark: 200 },
    { subject: 'Ozone', A: getNationalMax(psiData?.psi?.readings?.o3_sub_index) ?? 0, fullMark: 200 },
    { subject: 'SO2', A: getNationalMax(psiData?.psi?.readings?.so2_sub_index) ?? 0, fullMark: 200 },
    { subject: 'CO', A: getNationalMax(psiData?.psi?.readings?.co_sub_index) ?? 0, fullMark: 200 },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-[#243324]/10 bg-[#FBF9F5]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/60 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-md shadow-sm border border-[#243324]/5 bg-white/50">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <div className="h-6 w-px bg-[#243324]/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <div className="bg-[#243324] text-[#FBF9F5] p-1.5 rounded-lg shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Air Quality
              </h1>
            </div>
          </div>
          <div className="text-sm font-medium text-[#243324]/60 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live (hourly)
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight">
              Air Quality & Haze
            </h1>
            <div className="inline-flex items-center gap-2 bg-[#243324]/5 px-3 py-1.5 rounded-full text-sm font-medium text-[#243324]/70 border border-[#243324]/10 shadow-sm self-start md:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Data as of {formattedTime}
            </div>
          </div>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            Real-time PSI & PM2.5 readings, regional air quality map, and historical haze crisis benchmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">24-hr PSI (Islandwide Range)</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-serif text-[#243324] mb-2 tracking-tight">
                    {psiStats?.range ?? 'N.A.'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={"text-base font-semibold " + nationalInfo.color}>
                      {nationalInfo.status}
                    </span>
                    {psiStats && (
                      <span className="text-xs text-[#243324]/70 bg-[#243324]/5 px-2 py-0.5 rounded-full">
                        Peak: {psiStats.highestRegion} ({psiStats.max}) · Avg: {psiStats.avg}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#243324]/50 font-light">
                    Official NEA 24-hr PSI range across Singapore's 5 regions. Use for planning tomorrow's activities.
                  </p>
                </div>
                {nationalInfo.pulse && (
                  <div className={"p-3 rounded-full bg-opacity-10 " + nationalInfo.bg.replace('bg-', 'bg-') + "/10"}>
                    <AlertCircle className={"w-8 h-8 " + nationalInfo.color} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <Factory className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">1-hr PM2.5 Concentration</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-serif text-[#243324] mb-2 flex items-baseline gap-2 tracking-tight">
                    {pm25Stats?.range ?? 'N.A.'} <span className="text-lg font-sans font-normal text-gray-500">µg/m³</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={"text-base font-semibold " + pm25Info.color}>
                      {pm25Info.status}
                    </span>
                    {pm25Stats && (
                      <span className="text-xs text-[#243324]/70 bg-[#243324]/5 px-2 py-0.5 rounded-full">
                        Peak: {pm25Stats.highestRegion} ({pm25Stats.max} µg/m³) · Avg: {pm25Stats.avg} µg/m³
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#243324]/50 font-light">
                    Islandwide range across 5 regions. Immediate guide for outdoor exercise & real-time haze.
                  </p>
                </div>
                {pm25Info.pulse && (
                  <div className={"p-3 rounded-full bg-opacity-10 " + pm25Info.bg.replace('bg-', 'bg-') + "/10"}>
                    <AlertCircle className={"w-8 h-8 " + pm25Info.color} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col w-full">
            <CardHeader className="border-b border-[#243324]/5 bg-slate-50/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">Regional Air Quality Map</CardTitle>
                  <CardDescription>
                    {mapMetric === 'psi'
                      ? 'Live 24-hr PSI readings across Singapore (North, South, East, West, Central)'
                      : 'Live 1-hr PM2.5 concentrations (µg/m³) across Singapore (North, South, East, West, Central)'}
                  </CardDescription>
                </div>
                
                {/* Metric Switcher Toggle */}
                <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs font-medium self-start sm:self-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMapMetric('psi')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      mapMetric === 'psi'
                        ? 'bg-white text-[#243324] shadow font-semibold'
                        : 'text-[#243324]/70 hover:text-[#243324]'
                    }`}
                  >
                    24-hr PSI
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMetric('pm25')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      mapMetric === 'pm25'
                        ? 'bg-white text-[#243324] shadow font-semibold'
                        : 'text-[#243324]/70 hover:text-[#243324]'
                    }`}
                  >
                    1-hr PM2.5
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative bg-[#e0f2fe]/20">
              <div className="relative w-full h-[460px] md:h-[600px] overflow-hidden flex items-center justify-center">
                
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
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                  >
                    <Geographies geography={geoData}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#f1f5f9"
                            stroke="#cbd5e1"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none" },
                              hover: { fill: "#f1f5f9", outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>

                    {regions.map((region) => {
                      const isPsi = mapMetric === 'psi';
                      const val = isPsi 
                        ? psiData?.psi?.readings?.psi_twenty_four_hourly?.[region.id] ?? null
                        : psiData?.pm25?.readings?.pm25_one_hourly?.[region.id] ?? null;
                      const info = isPsi ? getPsiData(val) : getPm25Data(val);
                      
                      // Using SVG foreignObject to render our nice HTML badges directly onto the map coordinates!
                      return (
                        <Marker key={region.id} coordinates={region.coords as [number, number]}>
                          <foreignObject x="-45" y="-45" width="90" height="90">
                            <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none">
                              <div className="text-[10px] font-semibold text-[#243324]/80 uppercase tracking-wider mb-1 bg-white/95 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-[#243324]/10">
                                {region.label}
                              </div>
                              <div className={"relative flex flex-col items-center justify-center w-11 h-11 md:w-13 md:h-13 rounded-full border-[3px] shadow-lg bg-white " + info.border}>
                                {info.pulse && (
                                  <div className={"absolute inset-0 rounded-full animate-ping opacity-30 " + info.bg} />
                                )}
                                <span className={"font-serif text-sm md:text-base font-bold leading-none " + info.color}>
                                  {val ?? '-'}
                                </span>
                                {!isPsi && val !== null && (
                                  <span className="text-[8px] font-sans font-medium text-slate-400 leading-none mt-0.5">
                                    µg/m³
                                  </span>
                                )}
                              </div>
                              <div className={"text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded bg-white/95 shadow-sm border border-slate-200/60 leading-none " + info.color}>
                                {info.status}
                              </div>
                            </div>
                          </foreignObject>
                        </Marker>
                      );
                    })}
                  </ComposableMap>
                )}
                
                {/* Map Scale & Descriptor Legend */}
                <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-white/95 backdrop-blur-sm border border-[#243324]/10 rounded-lg p-2.5 shadow-sm text-xs text-[#243324]/80 max-w-lg">
                  <div className="font-semibold text-[11px] mb-1.5 text-[#243324]">
                    {mapMetric === 'psi' ? '24-hr PSI Scale (NEA)' : '1-hr PM2.5 Concentration Bands (NEA)'}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    {mapMetric === 'psi' ? (
                      <>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Good (0–50)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Moderate (51–100)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Unhealthy (101–200)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Very Unhealthy (201–300)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Hazardous (&gt;300)</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Normal (≤12)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Elevated (13–35)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> High (36–55)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Very High (56–150)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Hazardous (&gt;150)</span>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 bg-purple-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-purple-900">Pollutant Sub-Indices</CardTitle>
              <CardDescription>Breakdown of individual pollutant components driving the PSI</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pollutantData}>
                    <PolarGrid stroke="#24332420" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#24332480', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 20']} tick={{ fill: '#24332440', fontSize: 10 }} />
                    <Radar name="Sub-Index" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 bg-orange-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-orange-900">Historical Haze Benchmarks</CardTitle>
              <CardDescription>Comparing today's PSI against the worst crises</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalHaze} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#24332405' }}
                      formatter={(value: number) => [value, 'PSI']}
                    />
                    <Bar dataKey="psi" radius={[4, 4, 0, 0]}>
                      {
                        historicalHaze.map((entry, index) => {
                          if (entry.name === 'Current') {
                            return <Cell key={'cell-' + index} fill="#3b82f6" />;
                          }
                          return <Cell key={'cell-' + index} fill="#f97316" />;
                        })
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
