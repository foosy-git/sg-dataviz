
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
    if (val === null || val === undefined) return { status: 'N.A.', color: 'text-slate-600' };
    if (val <= 12) return { status: 'Normal', color: 'text-emerald-600' };
    if (val <= 35) return { status: 'Elevated', color: 'text-amber-600' };
    if (val <= 55) return { status: 'High', color: 'text-orange-600' };
    if (val <= 150) return { status: 'Very High', color: 'text-red-600' };
    return { status: 'Hazardous', color: 'text-purple-600' };
  };

  // The PSI API no longer provides 'national'. We must calculate it as the max of all regions.
  const getNationalMax = (readings: any) => {
    if (!readings) return null;
    const vals = [readings.north, readings.south, readings.east, readings.west, readings.central].filter(v => v !== undefined && v !== null);
    if (vals.length === 0) return null;
    return Math.max(...vals);
  };

  const nationalPsi = getNationalMax(psiData?.psi?.readings?.psi_twenty_four_hourly) ?? null;
  const nationalPm25hr1 = getNationalMax(psiData?.pm25?.readings?.pm25_one_hourly) ?? null;
  const nationalInfo = getPsiData(nationalPsi);
  const pm25Info = getPm25Data(nationalPm25hr1);

  const historicalHaze = [
    { name: '1997 Haze', psi: 226, year: 1997 },
    { name: '2013 Crisis', psi: 401, year: 2013 },
    { name: '2015 Haze', psi: 321, year: 2015 },
    { name: '2019 Haze', psi: 154, year: 2019 },
    { name: 'Current', psi: nationalPsi ?? 0, year: new Date().getFullYear() },
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
                    <span className="text-xs font-semibold uppercase tracking-wider">National PSI (24-hr)</span>
                  </div>
                  <div className="text-5xl font-serif text-[#243324] mb-2">
                    {nationalPsi ?? 'N.A.'}
                  </div>
                  <div className={"text-lg font-medium " + nationalInfo.color}>
                    {nationalInfo.status}
                  </div>
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
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Factory className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">1-hr PM2.5 Concentration</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2 flex items-baseline gap-2">
                {nationalPm25hr1 ?? 'N.A.'} <span className="text-lg font-sans font-normal text-gray-500">µg/m³</span>
              </div>
              <div className={"text-sm font-medium " + pm25Info.color}>
                {pm25Info.status} (Immediate Haze Indicator)
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col w-full">
            <CardHeader className="border-b border-[#243324]/5 bg-slate-50/50 pb-4">
              <CardTitle className="font-serif text-xl text-[#243324]">Regional Air Quality Map</CardTitle>
              <CardDescription>Live 24-hr PSI readings across Singapore</CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative bg-[#e0f2fe]/20">
              <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden flex items-center justify-center">
                
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
                      const val = psiData?.psi?.readings?.psi_twenty_four_hourly?.[region.id] ?? null;
                      const info = getPsiData(val);
                      
                      // Using SVG foreignObject to render our nice HTML badges directly onto the map coordinates!
                      return (
                        <Marker key={region.id} coordinates={region.coords as [number, number]}>
                          <foreignObject x="-40" y="-40" width="80" height="80">
                            <div className="flex flex-col items-center justify-center w-full h-full">
                              <div className="text-[10px] font-semibold text-[#243324]/80 uppercase tracking-wider mb-1 bg-white/90 px-2 rounded-full backdrop-blur-sm shadow-sm border border-[#243324]/10">
                                {region.label}
                              </div>
                              <div className={"relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] shadow-lg bg-white " + info.border}>
                                {info.pulse && (
                                  <div className={"absolute inset-0 rounded-full animate-ping opacity-30 " + info.bg} />
                                )}
                                <span className={"font-serif text-sm md:text-base font-bold " + info.color}>
                                  {val ?? '-'}
                                </span>
                              </div>
                            </div>
                          </foreignObject>
                        </Marker>
                      );
                    })}
                  </ComposableMap>
                )}
                
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
