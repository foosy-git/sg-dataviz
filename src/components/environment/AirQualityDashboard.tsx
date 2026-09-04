'use client';

import Link from 'next/link';
import { ArrowLeft, Activity, Wind, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AirQualityDashboard({ psiData }: { psiData: any }) {
  
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

  const nationalPsi = psiData?.readings?.psi_twenty_four_hourly?.national ?? null;
  const nationalPm25 = psiData?.readings?.pm25_twenty_four_hourly?.national ?? null;
  const nationalInfo = getPsiData(nationalPsi);

  const historicalHaze = [
    { name: '1997 Haze', psi: 226, year: 1997 },
    { name: '2013 Crisis', psi: 401, year: 2013 },
    { name: '2015 Haze', psi: 321, year: 2015 },
    { name: '2019 Haze', psi: 154, year: 2019 },
    { name: 'Current', psi: nationalPsi ?? 0, year: new Date().getFullYear() },
  ].sort((a, b) => a.year - b.year);

  const regions = [
    { id: 'north', label: 'North', top: '15%', left: '50%' },
    { id: 'west', label: 'West', top: '50%', left: '20%' },
    { id: 'central', label: 'Central', top: '55%', left: '50%' },
    { id: 'east', label: 'East', top: '50%', left: '80%' },
    { id: 'south', label: 'South', top: '85%', left: '55%' },
  ];

  return (
    <main className="min-h-screen bg-[#FBF9F5] pb-20">
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
            Live Real-time
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
            Air Quality & Haze
          </h1>
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
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">PM2.5 Concentration</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2 flex items-baseline gap-2">
                {nationalPm25 ?? 'N.A.'} <span className="text-lg font-sans font-normal text-gray-500">µg/m³</span>
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Fine particulate matter reading
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 bg-slate-50/50 pb-4">
              <CardTitle className="font-serif text-xl text-[#243324]">Regional Breakdown Map</CardTitle>
              <CardDescription>Live 24-hr PSI readings across Singapore</CardDescription>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="relative w-full aspect-square sm:aspect-video lg:aspect-square bg-[#E8DCC4]/20 rounded-2xl border border-[#243324]/10 overflow-hidden">
                {/* Decorative Map Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(circle at center, #243324 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                
                {regions.map((region) => {
                  const val = psiData?.readings?.psi_twenty_four_hourly?.[region.id] ?? null;
                  const info = getPsiData(val);
                  
                  return (
                    <div 
                      key={region.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                      style={{ top: region.top, left: region.left }}
                    >
                      <div className="text-xs font-semibold text-[#243324]/60 uppercase tracking-wider mb-1">
                        {region.label}
                      </div>
                      <div className={"relative flex items-center justify-center w-14 h-14 rounded-full border-4 shadow-md bg-white " + info.border}>
                        {info.pulse && (
                          <div className={"absolute inset-0 rounded-full animate-ping opacity-20 " + info.bg} />
                        )}
                        <span className={"font-serif text-lg font-bold " + info.color}>
                          {val ?? '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 bg-orange-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-orange-900">Historical Haze Benchmarks</CardTitle>
              <CardDescription>Comparing today's PSI against the worst crises in Singapore history</CardDescription>
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
                            return <Cell key={`cell-${index}`} fill="#3b82f6" />;
                          }
                          return <Cell key={`cell-${index}`} fill="#f97316" />;
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
    </main>
  );
}
