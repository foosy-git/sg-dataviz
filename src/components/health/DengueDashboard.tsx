'use client';

import Link from 'next/link';
import { ArrowLeft, Activity, Bug, AlertTriangle, Syringe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart
} from 'recharts';

export default function DengueDashboard({ data }: { data: any[] }) {
  const latestData = data[data.length - 1];
  
  // Find highest outbreak year
  const maxCases = Math.max(...data.map(d => d.cases));
  const peakYear = data.find(d => d.cases === maxCases)?.year;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Bug className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Cases ({latestData.year})</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2">
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
                <span className="text-xs font-semibold uppercase tracking-wider">Severe DHF Cases ({latestData.year})</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2">
                {latestData.dhf}
              </div>
              <div className="text-sm font-medium text-orange-600">
                Requires hospitalization
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50/50 border-red-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-red-900/60">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Historical Peak</span>
              </div>
              <div className="text-5xl font-serif text-red-900 mb-2">
                {peakYear}
              </div>
              <div className="text-sm font-medium text-red-800/80">
                {maxCases.toLocaleString()} cases recorded
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-[#243324]/5 shadow-sm mb-12">
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
      </div>
    </div>
  );
}
