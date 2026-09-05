'use client';

import Link from 'next/link';
import { ArrowLeft, Train, Bus, Users, TrendingUp } from 'lucide-react';
import DashboardNav from '@/components/ui/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

export default function RidershipDashboard({ data }: { data: any[] }) {
  // Aggregate data by year
  const yearMap = new Map();
  
  data.forEach(d => {
    if (!yearMap.has(d.year)) {
      yearMap.set(d.year, { year: d.year, total: 0 });
    }
    const entry = yearMap.get(d.year);
    entry[d.mode] = d.ridership;
    entry.total += d.ridership;
  });

  const chartData = Array.from(yearMap.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));

  // Compute percentages for the 100% stacked area chart
  const percentageData = chartData.map(d => {
    const railTotal = (d.MRT || 0) + (d.LRT || 0);
    const busTotal = d.Bus || 0;
    return {
      year: d.year,
      RailPct: Number(((railTotal / d.total) * 100).toFixed(1)),
      BusPct: Number(((busTotal / d.total) * 100).toFixed(1))
    };
  });

  const latestData = chartData[chartData.length - 1];
  const prevData = chartData[chartData.length - 2];
  
  const latestYear = latestData.year;
  
  // High-interest Metrics
  const yoyGrowth = (((latestData.total - prevData.total) / prevData.total) * 100).toFixed(1);
  const isGrowing = parseFloat(yoyGrowth) >= 0;

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
                <Train className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Transport
              </h1>
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
            Public Transport Ridership
          </h1>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            Tracking the average daily passenger volume across Singapore's MRT, LRT, and Public Bus networks over the past decades.
          </p>
        </div>

        {/* TOP LEVEL KPIS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Users className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Daily Ridership ({latestYear})</span>
              </div>
              <div className="text-4xl lg:text-5xl font-serif text-[#243324] mb-2">
                {(latestData.total / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Total average daily journeys
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">YoY Growth</span>
              </div>
              <div className="text-4xl lg:text-5xl font-serif text-[#243324] mb-2">
                {isGrowing ? '+' : ''}{yoyGrowth}%
              </div>
              <div className={"text-sm font-medium " + (isGrowing ? "text-emerald-600" : "text-red-600")}>
                Compared to {prevData.year}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Train className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Rail (MRT + LRT)</span>
              </div>
              <div className="text-4xl lg:text-5xl font-serif text-[#243324] mb-2">
                {((latestData.MRT + latestData.LRT) / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm font-medium text-blue-600">
                {(((latestData.MRT + latestData.LRT) / latestData.total) * 100).toFixed(1)}% of total share
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Bus className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Public Bus</span>
              </div>
              <div className="text-4xl lg:text-5xl font-serif text-[#243324] mb-2">
                {(latestData.Bus / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm font-medium text-emerald-600">
                {((latestData.Bus / latestData.total) * 100).toFixed(1)}% of total share
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <Card className="bg-white border-[#243324]/5 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Historical Ridership Volume</CardTitle>
              <CardDescription>Notice the severe impact of the COVID-19 pandemic in 2020 and the subsequent recovery curve.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMRT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => [`${(Number(value)/1000000).toFixed(2)}M`, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="Bus" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorBus)" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="MRT" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMRT)" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="LRT" stackId="1" stroke="#8b5cf6" fillOpacity={1} fill="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Mode Share Transition (Rail vs Bus)</CardTitle>
              <CardDescription>A 100% stacked view illustrating how Singapore transitioned from a bus-centric to a rail-centric commuting culture.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={percentageData} stackOffset="expand" margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, (name || '').replace('Pct', ' Share')]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="BusPct" stackId="1" name="Public Bus" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="RailPct" stackId="1" name="Rail (MRT & LRT)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
