'use client';

import Link from 'next/link';
import { ArrowLeft, Activity, Bug, AlertTriangle, Syringe, Skull, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function DengueDashboard({ data, liveClusters = [] }: { data: any[], liveClusters?: any[] }) {
  const latestData = data[data.length - 1];
  
  const maxCases = Math.max(...data.map(d => d.cases));
  const peakYear = data.find(d => d.cases === maxCases)?.year;

  const seasonalityData = [
    { month: 'Jan', cases: 1200 },
    { month: 'Feb', cases: 900 },
    { month: 'Mar', cases: 1000 },
    { month: 'Apr', cases: 1500 },
    { month: 'May', cases: 3500 },
    { month: 'Jun', cases: 5500 },
    { month: 'Jul', cases: 6200 },
    { month: 'Aug', cases: 4800 },
    { month: 'Sep', cases: 3100 },
    { month: 'Oct', cases: 2200 },
    { month: 'Nov', cases: 1800 },
    { month: 'Dec', cases: 1400 },
  ];

  const activeClustersCount = liveClusters.length;
  const topCluster = liveClusters.length > 0 ? liveClusters[0] : null;

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
                Public Health
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
            Dengue Outbreak Cycles
          </h1>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            Visualizing the cyclical severity of Dengue and Dengue Haemorrhagic Fever (DHF) in Singapore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Active Clusters</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {activeClustersCount}
              </div>
              <div className="text-sm font-medium text-red-600 truncate" title={topCluster?.LOCALITY}>
                {topCluster ? `Red Alert: ${topCluster.LOCALITY.split('/')[0]}` : 'No active clusters'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Bug className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Cases ({latestData.year})</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {latestData.cases.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Endemic tracking
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Syringe className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Severe DHF ({latestData.year})</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {latestData.dhf}
              </div>
              <div className="text-sm font-medium text-orange-600">
                Requires hospitalization
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <Skull className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Fatalities ({latestData.year})</span>
              </div>
              <div className="text-4xl font-serif text-white mb-2">
                {latestData.deaths}
              </div>
              <div className="text-sm font-medium text-slate-400">
                Tragic loss of life
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          <Card className="bg-white border-[#243324]/5 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Dengue Cases Over Time</CardTitle>
              <CardDescription>Notice the cyclical pattern of major outbreaks every few years</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} dx={-10} tickFormatter={(v) => `${v/1000}k`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#dc2626' }} dx={10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="cases" name="Total Dengue Cases" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="dhf" name="DHF Cases" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 pb-4 bg-orange-50/50">
              <CardTitle className="font-serif text-xl text-orange-900">Outbreak Seasonality</CardTitle>
              <CardDescription>Historically, cases surge dramatically during the warmer mid-year months.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={seasonalityData}>
                    <PolarGrid stroke="#24332420" />
                    <PolarAngleAxis dataKey="month" tick={{ fill: '#24332480', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                    <Radar name="Cases" dataKey="cases" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {liveClusters.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif text-3xl text-[#243324] mb-6">Live Dengue Clusters</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveClusters.slice(0, 10).map((cluster: any, idx: number) => (
                <Card key={idx} className="bg-white border-[#243324]/5 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="font-sans text-lg text-[#243324] leading-tight">
                        {cluster.LOCALITY}
                      </CardTitle>
                      <Badge variant="destructive" className="shrink-0 text-sm">
                        {cluster.CASE_SIZE} Cases
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cluster.HOMES && (
                        <div>
                          <span className="text-xs font-semibold text-[#243324]/60 uppercase tracking-wider block mb-1">Breeding Habitats (Homes)</span>
                          <p className="text-sm text-[#243324]/80">{cluster.HOMES}</p>
                        </div>
                      )}
                      {cluster.PUBLIC_PLACES && (
                        <div>
                          <span className="text-xs font-semibold text-[#243324]/60 uppercase tracking-wider block mb-1">Breeding Habitats (Public Places)</span>
                          <p className="text-sm text-[#243324]/80">{cluster.PUBLIC_PLACES}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
